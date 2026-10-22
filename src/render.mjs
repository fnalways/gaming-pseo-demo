export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const statusNames = { runs_well: '运行良好', playable: '可游玩', runs_poorly: '体验受限', unplayable: '无法运行', not_verified: '尚未验证' };
const display = v => v == null ? '未测量' : String(v);
const state = v => ({ enabled: '开启', disabled: '关闭', unsupported: '不支持', unknown: '未知', not_applicable: '不适用' }[v] || v || '—');
const res = p => `${p.outputResolution.width} × ${p.outputResolution.height}`;
const mode = p => p.playMode === 'direct' ? '直连显示器' : '本地串流';
const table = (headers, rows, caption = '') => `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(caption || headers[0])}"><table>${caption ? `<caption>${esc(caption)}</caption>` : ''}<thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const list = items => `<ul class="notes">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
const urlSafe = value => {
  if (typeof value !== 'string') return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { return new URL(value).protocol === 'https:' ? value : null; } catch { return null; }
};

export function shell(title, body, path = '/', description = 'JSON 驱动的游戏测试页面演示。所有性能数据均为虚构示例。') {
  const origin = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4173');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="noindex,nofollow"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><link rel="canonical" href="${esc(origin + path)}"><link rel="stylesheet" href="/style.css"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><script type="module" src="/client.js"></script></head><body><a class="skip" href="#main">跳至内容</a><header class="nav"><a class="brand" href="/"><span class="brand-icon">g<span>·</span></span> gaming lab<span class="nav-badge">独立实验站</span></a><nav aria-label="主导航"><a href="/">游戏库</a><a href="/guide">如何更新</a><a class="repo-link" href="https://github.com/fnalways/gaming-pseo-demo" target="_blank" rel="noopener">GitHub ↗</a></nav></header><div class="demo-strip"><span class="dot"></span> 原型演示 · 所有性能数据均为虚构示例，不代表真实测试结论</div><main id="main">${body}</main><footer><a class="brand" href="/">gaming lab<span class="mono"> / 001</span></a><p>一份数据，一套模板。每次更新都有记录。</p><span>Independent prototype · 2026</span></footer></body></html>`;
}

export function card(b, index = 0) {
  const g = b.game;
  const r = b.reports.find(r => r.id === g.currentReportByDevice[g.defaultDeviceId]);
  return `<a class="game-card" data-game-card data-search="${esc([g.name, ...g.aliases].join(' ').toLowerCase())}" data-status="${r?.assessment.status || 'not_verified'}" href="/games/${esc(g.slug)}"><div class="card-art art-${index % 3}" aria-hidden="true"><span class="art-index">FIELD NOTES / ${String(index + 1).padStart(2, '0')}</span><strong>${esc(g.name)}</strong><span class="art-footer">GAMING LAB <span>↗</span></span></div><div class="card-body"><div class="card-heading"><h2>${esc(g.name)}</h2><span class="arrow">↗</span></div><p>${esc(g.intro)}</p><div class="card-meta"><span class="badge">${statusNames[r?.assessment.status || 'not_verified']}</span><span>${r ? `${r.tests.length} 项结果 · ${esc(r.software.os.version)}` : '等待首份报告'}</span></div></div></a>`;
}

export function home(games) {
  const reports = games.reduce((sum, b) => sum + b.reports.length, 0);
  return shell('Gaming Lab — 游戏表现与配置', `<section class="home-hero"><div><p class="eyebrow"><span class="dot"></span> THE GAMING FIELD GUIDE</p><h1>每款游戏，<br>都有据可查<span class="accent">。</span></h1><p class="lede">从运行表现，到适合你的设置。<br>选择一款游戏，查看不同主机和系统版本下的测试记录。</p></div><div class="hero-note"><div class="note-mark">↗</div><p class="eyebrow">A SMALL EXPERIMENT</p><p>把一次测试，<br>变成一页有用的答案。</p><div class="note-bottom"><span>${String(games.length).padStart(2, '0')} 款示例游戏</span><span>${String(reports).padStart(2, '0')} 份报告</span></div></div></section><section class="library"><div class="section-heading"><div><p class="eyebrow">EXPLORE THE LIBRARY</p><h2>游戏库 <span class="count">${games.length}</span></h2></div><div class="filters"><label class="sr-only" for="search">搜索游戏</label><input id="search" type="search" placeholder="搜索游戏名称…"><label class="sr-only" for="status-filter">运行状态</label><select id="status-filter"><option value="all">全部状态</option>${Object.entries(statusNames).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div></div><p id="result-count" class="muted" aria-live="polite">${games.length} 款游戏</p><div class="game-grid">${games.map(card).join('')}</div><div id="empty-search" class="empty" hidden>没有找到匹配的游戏。试试其他名称或状态。</div></section><section class="workflow"><div><p class="eyebrow">FROM TEST TO PAGE</p><h2>更新数据，页面随之更新。</h2><p class="muted">报告、配置与内容块共用一套模板。</p></div><ol><li><span>01</span>修改 JSON</li><li><span>02</span>PR 校验与预览</li><li><span>03</span>合并后发布</li></ol><a class="text-link" href="/guide">查看维护指南 ↗</a></section>`);
}

export function reportView(b, r) {
  if (!r) return `<section class="empty report-empty"><span class="empty-icon">○</span><h2>这台主机还没有验证记录</h2><p>尚未验证不代表无法运行。完成测试后，新增报告即可在这里展示。</p><span class="badge neutral">Not verified</span></section>`;
  const g = b.game;
  const profiles = new Map(r.profiles.map(p => [p.id, p]));
  const current = g.currentReportByDevice[r.deviceId] === r.id;
  const benchmark = r.tests.length ? table(['玩法 / 配置', '输出分辨率', '平均 FPS', '1% Low', '采样'], r.tests.map(t => {
    const p = profiles.get(t.profileId);
    return [`<span class="cell-title">${mode(p)}</span><small>${esc(p.label)}</small>`, esc(res(p)), `<strong class="fps">${esc(display(t.metrics.game.avgFps))}</strong><small>${t.metrics.game.frameBasis === 'rendered' ? '基础渲染帧' : t.metrics.game.frameBasis === 'includes_generated' ? '含生成帧' : '口径待确认'}</small>`, `<strong>${esc(display(t.metrics.game.onePercentLowFps))}</strong>`, `${t.method.durationSeconds / 60} 分钟<small>${esc(t.method.captureTool)}</small>`];
  }), '主机端游戏性能 · 虚构示例') : `<p class="muted">暂无性能数据。</p>`;
  const settings = r.recommendations.map(rec => {
    const p = profiles.get(rec.profileId);
    const rows = [
      ['玩法', mode(p)], ['输出分辨率', res(p)], ['运行层', `${p.runtime.type} · ${p.runtime.version}`],
      ['Overlay 网关', state(p.overlayGateway)], ['画质预设', p.graphics.preset],
      ['超分', p.graphics.upscaling.state === 'enabled' ? `${p.graphics.upscaling.technology} / ${p.graphics.upscaling.mode}` : state(p.graphics.upscaling.state)],
      ['帧生成', p.graphics.frameGeneration.state === 'enabled' ? `${p.graphics.frameGeneration.technology} / ${p.graphics.frameGeneration.modeLabel}` : state(p.graphics.frameGeneration.state)],
      ['光线追踪', p.graphics.rayTracing.state === 'enabled' ? p.graphics.rayTracing.mode : state(p.graphics.rayTracing.state)],
      ...p.gameSettings.map(s => { const d = g.settingDefinitions.find(d => d.key === s.key); return [d.label, d.type === 'enum' ? d.options.find(o => o.value === s.value).label : `${s.value}${d.unit ? ` ${d.unit}` : ''}`]; }),
      ...(p.streaming ? [['串流目标帧率', `${p.streaming.targetFps} FPS`], ['串流目标码率', `${p.streaming.bitrateMbps} Mbps`], ['编码', p.streaming.codec], ['接收端', p.streaming.clientDevice.model]] : [])
    ];
    return `<article class="setting-card"><span class="eyebrow">${esc(rec.goal.replaceAll('_', ' '))}</span><h3>${esc(rec.label)}</h3><p>${esc(rec.rationale)}</p><dl>${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><details><summary>推荐依据与适用限制</summary><p>依据测试：${rec.basedOnTestIds.map(esc).join('、')}</p>${list(rec.limitations)}</details></article>`;
  }).join('');
  const streamNotes = r.tests.filter(t => t.metrics.streaming).map(t => `<details class="stream-details"><summary>串流与帧生成指标 · ${esc(profiles.get(t.profileId).label)}</summary><p>这些指标来自不同阶段，不等同于基础游戏 FPS。</p>${table(['基础游戏 FPS', '含生成帧输出 FPS', '串流接收 FPS', '串流显示 FPS', '网络 RTT'], [[t.metrics.game.avgFps, t.metrics.display?.avgFps, t.metrics.streaming.incomingFps, t.metrics.streaming.renderedFps, `${t.metrics.streaming.networkRttMs} ms`].map(v => esc(display(v)))])}<p class="muted">${esc(t.metrics.streaming.samplingMethod)}</p></details>`).join('');
  const envRows = [['主机', b.devices.find(d => d.id === r.deviceId).name], ['操作系统', `${r.software.os.name} ${r.software.os.version}`], ['OS build', r.software.os.build], ['CPU', r.hardware.cpu], ['GPU', r.hardware.gpu], ['内存 / 显存', `${r.hardware.ramGb} GB / ${r.hardware.vramGb} GB`], ['GPU 功耗上限', `${r.hardware.gpuPowerLimitW} W`], ['应用资源限制', `${r.resources.cpuLimit.value} cores / ${r.resources.memoryLimitGb} GB`], ['驱动', r.software.gpuDriverVersion], ['游戏版本', r.software.gameVersion], ['游戏 build', r.software.gameBuildId], ['Steam 应用 / Chart', `${r.software.steamAppVersion} / ${r.software.steamChartVersion}`]];
  return `<div class="report-summary"><div><span class="badge">${statusNames[r.assessment.status]}</span><span class="badge neutral">${current ? '当前报告' : '历史报告'}</span><p>${esc(r.assessment.summary)}</p></div><div class="checked"><span>最近验证（示例）</span><strong>${esc(r.verifiedAt)}</strong></div></div><section class="report-section" id="performance"><div class="section-heading"><div><p class="eyebrow">01 / PERFORMANCE</p><h2>游戏表现</h2></div><span class="muted">${r.tests.length} 项测试</span></div>${benchmark}${streamNotes}<details class="method"><summary>测试方法与限制</summary>${r.tests.map(t => `<p><b>${esc(profiles.get(t.profileId).label)}</b><br>${esc(t.method.scenario)}<br>采样 ${t.method.durationSeconds} 秒 · 热身 ${t.method.warmupSeconds} 秒 · ${t.method.includesLoading ? '包含加载' : '不含加载'} · ${esc(t.method.captureToolVersion)}</p>`).join('')}${list(r.assessment.issues)}</details></section>${settings ? `<section class="report-section" id="settings"><p class="eyebrow">02 / RECOMMENDED SETTINGS</p><h2>推荐设置</h2><p class="muted section-intro">每套配置对应自己的测试结果。请选择适合的玩法与分辨率。</p><div class="settings-grid">${settings}</div></section>` : ''}<section class="report-section" id="system"><p class="eyebrow">03 / SYSTEM DETAILS</p><h2>验证环境</h2><dl class="environment">${envRows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>`;
}

export function blocks(sections) {
  return sections.map(s => `<section class="content-section" id="content-${esc(s.id)}"><h2>${esc(s.title)}</h2>${s.blocks.map(b => {
    if (b.type === 'paragraph') return `<p>${esc(b.text)}</p>`;
    if (b.type === 'callout') return `<aside class="callout">${esc(b.text)}</aside>`;
    if (b.type === 'list') return `<${b.ordered ? 'ol' : 'ul'}>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</${b.ordered ? 'ol' : 'ul'}>`;
    if (b.type === 'table') return table(b.columns.map(c => c.label), b.rows.map(row => b.columns.map(c => esc(row[c.key]))), b.caption);
    if (b.type === 'steps') return `<ol class="steps">${b.items.map(i => `<li><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></li>`).join('')}</ol>`;
    if (b.type === 'faq') return `<div class="faq">${b.items.map(i => `<details><summary>${esc(i.question)}</summary><p>${esc(i.answer)}</p></details>`).join('')}</div>`;
    if (b.type === 'image') { const src = urlSafe(b.src); return src ? `<figure><img loading="lazy" src="${esc(src)}" alt="${esc(b.alt)}" width="${Number(b.width)}" height="${Number(b.height)}"><figcaption>${esc(b.caption)}</figcaption></figure>` : ''; }
    throw new Error(`Unknown block ${b.type}`);
  }).join('')}</section>`).join('');
}

export function detail(b, others) {
  const g = b.game;
  const selected = b.reports.find(r => r.id === g.currentReportByDevice[g.defaultDeviceId]);
  const reportOptions = b.reports.map(r => `<option value="${esc(r.id)}" data-device="${esc(r.deviceId)}"${r.id === selected?.id ? ' selected' : ''}>${esc(r.software.os.version)} · ${esc(r.verifiedAt)}${g.currentReportByDevice[r.deviceId] === r.id ? ' · 当前' : ' · 历史'}</option>`).join('');
  const templates = b.reports.map(r => `<template id="template-${esc(r.id)}">${reportView(b, r)}</template>`).join('');
  return shell(g.seo.title, `<div class="detail-top"><a class="back" href="/">← 全部游戏</a><a class="text-link" href="/data/${esc(g.slug)}.json" target="_blank">查看页面数据 JSON ↗</a></div><section class="detail-hero"><div><p class="eyebrow">${g.genres.map(esc).join(' / ')}</p><h1>${esc(g.name)}</h1><p class="lede">${esc(g.intro)}</p></div><div class="hero-monogram" aria-hidden="true">${g.slug === 'cyberpunk-2077' ? '2077' : 'III'}<span>FIELD REPORT</span></div></section><div class="report-controls" data-default-device="${esc(g.defaultDeviceId)}"><div><label for="device">运行游戏的主机</label><select id="device">${b.devices.map(d => `<option value="${esc(d.id)}" data-current="${esc(g.currentReportByDevice[d.id] || '')}"${d.id === g.defaultDeviceId ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div><div><label for="report">系统与报告</label><select id="report">${reportOptions}<option value="" hidden>暂无报告</option></select></div><p id="selection-note" aria-live="polite">切换设备或版本，查看对应记录。</p></div><noscript><p class="callout">当前显示默认报告。切换主机与历史版本需要启用 JavaScript。</p></noscript><div id="report-view">${reportView(b, selected)}</div>${templates}<template id="template-unverified">${reportView(b, null)}</template><div class="editorial">${blocks(g.contentSections)}</div><section class="more-games"><div class="section-heading"><h2>继续探索</h2><a class="text-link" href="/">全部游戏 ↗</a></div><div class="game-grid">${others.filter(o => o.game.id !== g.id).map(card).join('')}</div></section>`, `/games/${g.slug}`, g.seo.description);
}

export function guide() {
  return shell('如何更新 — Gaming Lab', `<article class="guide"><p class="eyebrow">THE PUBLISHING WORKFLOW</p><h1>一次 PR，<br>更新一款游戏。</h1><p class="lede">你维护内容与测试记录，模板负责页面展示。</p><ol class="guide-steps"><li><span>01</span><div><h2>编辑游戏 JSON</h2><p>进入仓库的 <code>content/games/</code>，每款游戏一个文件。更新简介、测试、推荐或内容块。</p><a class="text-link" href="https://github.com/fnalways/gaming-pseo-demo/tree/main/content/games">打开数据目录 ↗</a></div></li><li><span>02</span><div><h2>创建 Pull Request</h2><p>新建分支并提交。GitHub Actions 检查引用关系和数据，Vercel 为分支创建预览。</p><p>在预览中检查主机、系统版本、性能数字和推荐配置是否对应。</p></div></li><li><span>03</span><div><h2>审核后合并</h2><p>合并到 main 后，Vercel 重新构建静态页面。新游戏会自动进入游戏库。</p></div></li></ol><section><h2>常见修改</h2>${table(['想改什么', 'JSON 中的位置'], [['游戏简介 / SEO', 'game.intro / game.seo'], ['测试结果', 'reports[].tests[].metrics'], ['推荐配置', 'reports[].profiles + recommendations'], ['新增 OS 或主机测试', '新增 report，再更新 currentReportByDevice'], ['段落 / 表格 / FAQ', 'game.contentSections'], ['游戏特有设置', 'game.settingDefinitions + profiles[].gameSettings']].map(row => row.map(esc)))}</section><aside class="callout">这是独立实验站，始终标记 noindex。当前仅允许虚构示例数据，不能把这里的数值当作官方测试结果。</aside><section><h2>本地运行</h2><pre>npm run validate\nnpm test\nnpm run dev</pre><p>不需要数据库。Node 在构建时读取 JSON，生成每款游戏的完整 HTML；少量浏览器脚本负责搜索与报告切换。</p></section></article>`, '/guide');
}
