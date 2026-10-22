import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGames, validate, publicData } from '../src/data.mjs';
import { detail, blocks, reportView } from '../src/render.mjs';
const games = await loadGames();
const fixture = () => structuredClone(games.find(b => b.game.slug === 'cyberpunk-2077'));

test('references must resolve and recommendation metrics must match its configuration', () => {
  const b = fixture();
  b.reports[1].recommendations[0].basedOnTestIds = ['test-b-stream-2160p-fg'];
  assert.throws(() => validate(b), /same profile/);
  b.reports[1].recommendations[0].basedOnTestIds = ['missing'];
  assert.throws(() => validate(b), /same profile/);
});
test('unknown metrics cannot be represented as arbitrary strings', () => {
  const b = fixture();
  b.reports[0].tests[0].metrics.game.avgFps = '80 FPS';
  assert.throws(() => validate(b), /Invalid avgFps/);
});
test('invalid current report cannot silently display another device', () => {
  const b = fixture();
  b.game.currentReportByDevice['example-host-b'] = 'report-one-os-b';
  assert.throws(() => validate(b), /Invalid current report/);
});
test('unknown block types and mismatched table columns fail before deployment', () => {
  const b = fixture();
  b.game.contentSections[0].blocks[0].type = 'arbitrary-html';
  assert.throws(() => validate(b), /Unknown block/);
  const c = fixture();
  c.game.contentSections[0].blocks.find(b => b.type === 'table').rows[0].extra = 'bad';
  assert.throws(() => validate(c), /Table columns/);
});
test('internal audit, reviewers and evidence links are not exported', () => {
  const b = fixture();
  b.internalAudit.sources[0].url = 'https://private.invalid/secret-source';
  b.reports[0].provenance.reviewedBy = 'PRIVATE_REVIEWER';
  const result = JSON.stringify(publicData(b));
  for (const forbidden of ['internalAudit', 'provenance', 'PRIVATE_REVIEWER', 'private.invalid', 'evidenceIds', 'example.invalid/evidence']) assert.ok(!result.includes(forbidden), forbidden);
});
test('draft reports stay out of the public projection', () => {
  const b = fixture();
  b.reports[0].reviewStatus = 'draft';
  assert.equal(publicData(b).reports.length, 1);
});
test('default report is in initial HTML with noindex and unique metadata', () => {
  const b = publicData(fixture());
  const html = detail(b, []);
  const initial = html.slice(0, html.indexOf('<template'));
  assert.ok(initial.includes('86'));
  assert.ok(initial.includes('example-os-b'));
  assert.ok(html.includes('noindex,nofollow'));
  assert.ok(html.includes(b.game.seo.title.replaceAll('&', '&amp;')));
});
test('unverified devices have an honest empty state, no invented metrics', () => {
  const html = reportView(publicData(fixture()), null);
  assert.ok(html.includes('Not verified'));
  assert.ok(!html.includes('<table'));
});
test('editorial content is escaped and dangerous image URLs are rejected', () => {
  const html = blocks([{ id: 'test', title: '<script>alert(1)</script>', blocks: [{ type: 'paragraph', text: '<img onerror=alert(1)>' }, { type: 'image', src: 'javascript:alert(1)', alt: 'bad' }] }]);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('&lt;img'));
});
test('games can define different settings without changing the renderer', () => {
  const b = publicData(games.find(b => b.game.slug === 'total-war-warhammer-3'));
  const html = detail(b, []);
  assert.ok(html.includes('Unit size'));
  assert.ok(html.includes('Unsupported'));
});
