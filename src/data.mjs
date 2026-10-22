import { readdir, readFile } from 'node:fs/promises';

export function validate(bundle) {
  const fail = message => { throw new Error(`${bundle.game?.slug || 'game'}: ${message}`); };
  const require = (condition, message) => { if (!condition) fail(message); };
  const unique = (items, label) => {
    require(Array.isArray(items), `${label} must be an array`);
    const map = new Map();
    for (const item of items) {
      require(typeof item.id === 'string' && /^[a-z0-9-]+$/.test(item.id), `${label}: invalid id`);
      require(!map.has(item.id), `${label}: duplicate id ${item.id}`);
      map.set(item.id, item);
    }
    return map;
  };
  const g = bundle.game;
  require(bundle.schemaVersion === 1, 'schemaVersion must be 1');
  require(bundle.exampleOnly === true, 'This sandbox accepts fictional exampleOnly data only');
  require(g && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.slug), 'Invalid slug');
  require(typeof g.name === 'string' && g.name.length > 0, 'Game name is required');
  require(g.publication.status === 'draft' && !g.publication.indexable, 'Demo content must remain draft and noindex');
  const devices = unique(bundle.devices, 'devices');
  const reports = unique(bundle.reports, 'reports');
  const sources = unique(bundle.internalAudit.sources, 'sources');
  const evidence = unique(bundle.internalAudit.evidence, 'evidence');
  const definitions = new Map(g.settingDefinitions.map(d => [d.key, d]));
  require(definitions.size === g.settingDefinitions.length, 'Duplicate setting key');
  require(devices.has(g.defaultDeviceId), 'Unknown default device');
  for (const [device, rid] of Object.entries(g.currentReportByDevice)) {
    require(devices.has(device), `Unknown device ${device}`);
    if (rid !== null) require(reports.get(rid)?.deviceId === device && reports.get(rid)?.reviewStatus === 'reviewed', `Invalid current report ${rid}`);
  }
  for (const e of evidence.values()) require(sources.has(e.sourceId), `Unknown source ${e.sourceId}`);
  for (const report of reports.values()) {
    require(report.gameId === g.id && devices.has(report.deviceId), `Invalid report ownership ${report.id}`);
    require(['draft', 'reviewed', 'withdrawn'].includes(report.reviewStatus), 'Invalid review status');
    const source = sources.get(report.provenance.sourceId);
    require(source?.revision === report.provenance.sourceRevision, 'Source revision mismatch');
    if (report.supersedesReportId) {
      const old = reports.get(report.supersedesReportId);
      require(old && old.id !== report.id && old.deviceId === report.deviceId, 'Invalid supersedes reference');
    }
    require(report.software?.os?.version && report.hardware?.cpu, 'Environment snapshot is required');
    const profiles = unique(report.profiles, 'profiles');
    const tests = unique(report.tests, 'tests');
    unique(report.recommendations, 'recommendations');
    for (const p of profiles.values()) {
      require(['direct', 'streaming'].includes(p.playMode), 'Invalid play mode');
      require((p.streaming !== null) === (p.playMode === 'streaming'), 'Streaming environment mismatch');
      require(p.outputResolution.width > 0 && p.outputResolution.height > 0, 'Invalid resolution');
      require(p.graphics && p.runtime, 'Graphics and runtime required');
      for (const s of p.gameSettings) {
        const def = definitions.get(s.key);
        require(def, `Unknown setting ${s.key}`);
        if (def.type === 'enum') require(def.options.some(o => o.value === s.value), `Invalid value for ${s.key}`);
        if (def.type === 'number') require(typeof s.value === 'number' && s.value >= def.minimum && s.value <= def.maximum, `Invalid number for ${s.key}`);
      }
    }
    for (const t of tests.values()) {
      require(profiles.has(t.profileId), `Unknown profile ${t.profileId}`);
      require(Number.isFinite(Date.parse(t.testedAt)), 'Invalid test date');
      require(t.method.durationSeconds > 0 && t.method.scenario && t.method.captureTool, 'Test method required');
      require(['rendered', 'includes_generated', 'unknown'].includes(t.metrics.game.frameBasis), 'FPS basis required');
      for (const k of ['avgFps', 'onePercentLowFps', 'minFps']) require(t.metrics.game[k] === null || (typeof t.metrics.game[k] === 'number' && Number.isFinite(t.metrics.game[k]) && t.metrics.game[k] >= 0), `Invalid ${k}`);
      require(t.evidenceIds.length > 0, 'Test evidence required');
      for (const id of [...t.evidenceIds, ...(t.metrics.display?.evidenceIds || []), ...(t.metrics.streaming?.evidenceIds || [])]) require(evidence.has(id), `Unknown evidence ${id}`);
    }
    for (const rec of report.recommendations) {
      require(profiles.has(rec.profileId), `Unknown recommendation profile ${rec.profileId}`);
      require(['tested', 'editorial', 'external'].includes(rec.basis), 'Invalid recommendation basis');
      if (rec.basis === 'tested') require(rec.basedOnTestIds.length > 0, 'Tested recommendation requires evidence');
      for (const tid of rec.basedOnTestIds) require(tests.get(tid)?.profileId === rec.profileId, 'Recommendation must reference tests with the same profile');
    }
    require(['runs_well', 'playable', 'runs_poorly', 'unplayable', 'not_verified'].includes(report.assessment.status), 'Invalid assessment');
    for (const tid of report.assessment.basedOnTestIds) require(tests.has(tid), 'Unknown assessment test');
    if (report.reviewStatus === 'reviewed') require(Number.isFinite(Date.parse(report.verifiedAt)) && report.assessment.basedOnTestIds.length > 0, 'Reviewed report needs date and evidence');
  }
  for (const section of g.contentSections) {
    require(/^[a-z0-9-]+$/.test(section.id) && section.title, 'Invalid section');
    for (const block of section.blocks) {
      require(['paragraph', 'callout', 'list', 'table', 'steps', 'image', 'faq'].includes(block.type), `Unknown block ${block.type}`);
      if (block.type === 'table') for (const row of block.rows) require(Object.keys(row).sort().join() === block.columns.map(c => c.key).sort().join(), 'Table columns do not match');
    }
  }
  return bundle;
}

export async function loadGames(directory = new URL('../content/games/', import.meta.url)) {
  const files = (await readdir(directory)).filter(f => f.endsWith('.json')).sort();
  const games = [];
  for (const filename of files) games.push(validate(JSON.parse(await readFile(new URL(filename, directory), 'utf8'))));
  if (new Set(games.map(b => b.game.slug)).size !== games.length) throw new Error('Duplicate game slug');
  if (new Set(games.map(b => b.game.id)).size !== games.length) throw new Error('Duplicate game id');
  return games;
}

// Deliberate allowlist: raw source documents, reviewer identities and evidence URLs never ship.
export function publicData(bundle) {
  const { game: g } = bundle;
  return {
    exampleOnly: true,
    game: { id: g.id, slug: g.slug, name: g.name, intro: g.intro, aliases: g.aliases, genres: g.genres, seo: g.seo, cover: g.cover, defaultDeviceId: g.defaultDeviceId, currentReportByDevice: g.currentReportByDevice, settingDefinitions: g.settingDefinitions, contentSections: g.contentSections },
    devices: bundle.devices.map(d => ({ id: d.id, name: d.name })),
    reports: bundle.reports.filter(r => r.reviewStatus === 'reviewed').map(r => ({
      id: r.id, deviceId: r.deviceId, verifiedAt: r.verifiedAt, testedFrom: r.testedFrom, testedTo: r.testedTo,
      software: r.software, hardware: r.hardware, resources: r.resources, profiles: r.profiles,
      assessment: r.assessment, recommendations: r.recommendations,
      tests: r.tests.map(t => {
        const { evidenceIds: displayEvidence, ...display } = t.metrics.display || {};
        const { evidenceIds: streamingEvidence, ...streaming } = t.metrics.streaming || {};
        return { id: t.id, profileId: t.profileId, testedAt: t.testedAt, method: t.method, outcome: t.outcome, observations: t.observations, metrics: { game: t.metrics.game, display: t.metrics.display ? display : null, streaming: t.metrics.streaming ? streaming : null } };
      })
    }))
  };
}
