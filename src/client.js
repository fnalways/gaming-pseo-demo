const search = document.querySelector('#search');
const statusFilter = document.querySelector('#status-filter');
function filterCards() {
  let visible = 0;
  for (const card of document.querySelectorAll('[data-game-card]')) {
    const match = card.dataset.search.includes(search.value.trim().toLowerCase()) && (statusFilter.value === 'all' || card.dataset.status === statusFilter.value);
    card.hidden = !match;
    if (match) visible++;
  }
  document.querySelector('#result-count').textContent = `${visible} games`;
  document.querySelector('#empty-search').hidden = visible > 0;
}
search?.addEventListener('input', filterCards);
statusFilter?.addEventListener('change', filterCards);

const device = document.querySelector('#device');
const report = document.querySelector('#report');
if (device && report) {
  function selectReport(requested) {
    const available = [...report.options].filter(o => o.dataset.device === device.value);
    for (const option of report.options) option.hidden = !available.includes(option);
    const preferred = device.selectedOptions[0].dataset.current;
    report.value = available.some(o => o.value === requested) ? requested : (available.some(o => o.value === preferred) ? preferred : available[0]?.value || '');
    report.disabled = available.length === 0;
    if (report.disabled) report.querySelector('option[value=""]').hidden = false;
    render();
  }
  function render() {
    const template = document.getElementById(report.value ? `template-${report.value}` : 'template-unverified');
    document.querySelector('#report-view').replaceChildren(template.content.cloneNode(true));
    document.querySelector('#selection-note').textContent = report.value ? `Viewing: ${device.selectedOptions[0].textContent} / ${report.selectedOptions[0].textContent}` : 'No verified report for this host.';
  }
  function writeUrl() {
    const url = new URL(location.href);
    url.searchParams.set('device', device.value);
    if (report.value) url.searchParams.set('report', report.value); else url.searchParams.delete('report');
    history.pushState(null, '', url);
  }
  function readUrl() {
    const params = new URLSearchParams(location.search);
    const chosen = params.get('device');
    device.value = [...device.options].some(o => o.value === chosen) ? chosen : document.querySelector('.report-controls').dataset.defaultDevice;
    selectReport(params.get('report'));
  }
  device.addEventListener('change', () => { selectReport(); writeUrl(); });
  report.addEventListener('change', () => { render(); writeUrl(); });
  window.addEventListener('popstate', readUrl);
  readUrl();
}
