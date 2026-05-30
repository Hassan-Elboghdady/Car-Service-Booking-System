// admin-dashboard.js
const DASH_MILEAGE_NAMES = {
  'pkg-10k':'10,000 km Service','pkg-20k':'20,000 km Service','pkg-30k':'30,000 km Service',
  'pkg-40k':'40,000 km Service','pkg-50k':'50,000 km Service','pkg-60k':'60,000 km Major Service',
  'pkg-70k':'70,000 km Service','pkg-80k':'80,000 km Service','pkg-90k':'90,000 km Service',
  'pkg-100k':'100,000 km Overhaul',
};
function dashSvcLabel(b) {
  if (b.service?.name) return `<span style="font-size:1.1rem;margin-right:4px;vertical-align:middle;display:inline-block">${SVG_ICONS.checkCircle}</span> ${b.service.name}`;
  const ids = b.serviceIds || (b.serviceId ? [b.serviceId] : []);
  const mId = ids.find(id => DASH_MILEAGE_NAMES[id]);
  if (mId) return `<span style="font-size:1.1rem;margin-right:4px;vertical-align:middle;display:inline-block">${SVG_ICONS.clock}</span> ${DASH_MILEAGE_NAMES[mId]}`;
  if (ids.length > 1) return `<span style="font-size:1.1rem;margin-right:4px;vertical-align:middle;display:inline-block">${SVG_ICONS.clipboard}</span> ${ids.length} Services`;
  return '';
}
window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();

  const user = auth.current();
  document.getElementById('admin-name').textContent   = user?.firstName || 'Admin';
  document.getElementById('admin-avatar').textContent = (user?.firstName||'A').charAt(0);
  document.getElementById('admin-date').textContent   = new Date().toLocaleDateString('en-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  const allBookings = await bookingsAPI.allWithDetails();
  const allUsers    = getAll(KEYS.USERS).filter(u=>u.role==='customer');
  const totalRev    = allBookings.filter(b=>b.status==='completed').reduce((s,b)=>s+(b.total||0),0);
  const pending     = allBookings.filter(b=>b.status==='pending').length;

  // Stats
  document.getElementById('admin-stats').innerHTML = [
    { label:'Total Bookings',    value: allBookings.length, icon:'<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', cls:'red'    },
    { label:'Pending',           value: pending,            icon:'<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', cls:'yellow' },
    { label:'Completed',         value: allBookings.filter(b=>b.status==='completed').length, icon:'<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', cls:'green' },
    { label:'Revenue (EGP)',     value: totalRev.toLocaleString(), icon:'<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', cls:'blue' },
  ].map(s=>`
    <div class="stat-card">
      <div class="stat-icon ${s.cls}">${s.icon}</div>
      <div><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>
    </div>`).join('');

  document.getElementById('recent-bookings-tbl').innerHTML = `
    <table>
      <thead><tr><th>Customer</th><th>Vehicle</th><th>Service</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${allBookings.slice(0,6).map(b=>`
        <tr>
          <td>${b.user?.firstName||''} ${b.user?.lastName||''}</td>
          <td>${getBrandLogoHtml(b.car?.brand)} ${b.car?.brand||''} ${b.car?.model||''}</td>
          <td>${dashSvcLabel(b)}</td>
          <td>${formatDate(b.date)}</td>
          <td style="font-weight:700;color:var(--primary)">EGP ${b.total||''}</td>
          <td>${statusBadge(b.status)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  // Status overview
  const counts = { pending:0, in_progress:0, completed:0, cancelled:0 };
  allBookings.forEach(b=>{ if(counts[b.status]!==undefined) counts[b.status]++; });
  const total = allBookings.length||1;
  const colors = { pending:'var(--warning)', in_progress:'var(--info)', completed:'var(--success)', cancelled:'var(--gray-400)' };
  document.getElementById('status-overview').innerHTML = Object.entries(counts).map(([s,c])=>`
    <div style="margin-bottom:12px">
      <div class="flex-between mb-4" style="font-size:.82rem"><span>${(STATUS[s]||{label:s}).label}</span><span>${c}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(c/total*100)}%;background:${colors[s]}"></div></div>
    </div>`).join('');

  // Revenue by service  includes mileage package name lookup
  const MILEAGE_NAMES = {
    'pkg-10k':'10,000 km Service','pkg-20k':'20,000 km Service','pkg-30k':'30,000 km Service',
    'pkg-40k':'40,000 km Service','pkg-50k':'50,000 km Service','pkg-60k':'60,000 km Major Service',
    'pkg-70k':'70,000 km Service','pkg-80k':'80,000 km Service','pkg-90k':'90,000 km Service',
    'pkg-100k':'100,000 km Overhaul',
  };
  const svcRev = {};
  allBookings.forEach(b => {
    // Try resolved service name first; fall back to mileage map; then 'Other'
    let name = b.service?.name;
    if (!name || name === 'Unknown') {
      const ids = b.serviceIds || (b.serviceId ? [b.serviceId] : []);
      const mileageId = ids.find(id => MILEAGE_NAMES[id]);
      name = mileageId ? MILEAGE_NAMES[mileageId] : (name || 'Other');
    }
    svcRev[name] = (svcRev[name] || 0) + (b.total || 0);
  });
  const maxRev = Math.max(...Object.values(svcRev), 1);
  document.getElementById('revenue-by-service').innerHTML = Object.entries(svcRev).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,v])=>`
    <div style="margin-bottom:12px">
      <div class="flex-between mb-4" style="font-size:.83rem"><span>${n}</span><span style="font-weight:700;color:var(--primary)">EGP ${v.toLocaleString()}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(v/maxRev*100)}%"></div></div>
    </div>`).join('');

  // Recent customers
  document.getElementById('recent-customers').innerHTML = allUsers.slice(0,4).map(u=>`
    <div class="flex-between mb-14">
      <div class="flex-gap">
        <div class="nav-avatar" style="width:36px;height:36px;font-size:.8rem">${u.firstName.charAt(0)}</div>
        <div><div style="font-weight:600;font-size:.85rem">${u.firstName} ${u.lastName}</div><div style="font-size:.75rem;color:var(--gray-500)">${u.email}</div></div>
      </div>
      <span class="badge badge-yellow">${u.points||0} pts</span>
    </div>`).join('');
});
