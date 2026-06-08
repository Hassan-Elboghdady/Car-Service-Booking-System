
window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();
  await renderReports();
  document.getElementById('report-period').addEventListener('change', renderReports);
});
async function renderReports() {
  const allB = await bookingsAPI.allWithDetails();
  const completed = allB.filter(b => b.status === 'completed');
  const totalRev = completed.reduce((s, b) => s + (b.total || 0), 0);
  const avgTicket = completed.length ? Math.round(totalRev / completed.length) : 0;
  document.getElementById('report-stats').innerHTML = [
    { l: 'Gross Revenue', v: 'EGP ' + totalRev.toLocaleString(), i: '🚗', c: 'green' },
    { l: 'Avg Service Value', v: 'EGP ' + avgTicket, i: '🚗', c: 'blue' },
    { l: 'Successful Jobs', v: completed.length, i: '?', c: 'blue' },
    { l: 'Cancelled (Loss)', v: 'EGP ' + allB.filter(b=>b.status==='cancelled').reduce((s,b)=>s+(b.total||0),0).toLocaleString(), i: '🚗', c: 'red' },
  ].map(s => `<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
  const categories = { maintenance: 0, cleaning: 0, repair: 0 };
  completed.forEach(b => {
    const cat = b.service?.cat || 'maintenance';
    if (categories[cat] !== undefined) categories[cat] += b.total;
  });
  const maxCat = Math.max(...Object.values(categories), 1);
  document.getElementById('category-chart').innerHTML = Object.entries(categories).map(([name, val]) => `
    <div class="chart-bar-row">
      <div class="chart-bar-label"><span>${name.charAt(0).toUpperCase() + name.slice(1)}</span><strong>EGP ${val.toLocaleString()}</strong></div>
      <div class="chart-bar-bg"><div class="chart-bar-fill" style="width: ${Math.round(val/maxCat*100)}%"></div></div>
    </div>`).join('');
  const months = ['Jan', 'Feb', 'Mar', 'Apr'];
  const monthData = [totalRev * 0.1, totalRev * 0.2, totalRev * 0.3, totalRev * 0.4];
  const maxMonth = Math.max(...monthData, 1);
  document.getElementById('growth-chart').innerHTML = months.map((m, i) => `
    <div class="chart-bar-row">
      <div class="chart-bar-label"><span>${m}</span><strong>EGP ${monthData[i].toLocaleString()}</strong></div>
      <div class="chart-bar-bg"><div class="chart-bar-fill" style="width: ${Math.round(monthData[i]/maxMonth*100)}%; background:var(--info)"></div></div>
    </div>`).join('');
  const svcScores = {};
  completed.forEach(b => {
    const sn = b.service?.name || 'Unknown';
    if (!svcScores[sn]) svcScores[sn] = { count: 0, rev: 0 };
    svcScores[sn].count++;
    svcScores[sn].rev += b.total;
  });
  const sortedSvcs = Object.entries(svcScores).sort((a,b) => b[1].rev - a[1].rev).slice(0, 5);
  document.getElementById('top-services-tbody').innerHTML = sortedSvcs.map(([name, data]) => `
    <tr>
      <td><strong>${name}</strong></td>
      <td>${data.count}</td>
      <td style="font-weight:700;color:var(--primary)">EGP ${data.rev.toLocaleString()}</td>
      <td>EGP ${Math.round(data.rev/data.count)}</td>
      <td><span style="color:var(--success)">+12% ?</span></td>
    </tr>`).join('');
}
