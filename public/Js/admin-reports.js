// admin-reports.js
window.addEventListener('DOMContentLoaded', async () => {
  seedData(); if (!requireRole('admin')) return; initSidebar();

  const [allB, topCustRes] = await Promise.all([
    bookingsAPI.allWithDetails(),
    api.get('/users/top-customers').catch(() => ({ data: [] })),
  ]);

  const totalRev = allB.filter(b=>b.status==='completed').reduce((s,b)=>s+(b.total||0),0);
  const totalCustomers = (topCustRes.data || []).length;

  document.getElementById('r-stats').innerHTML = [
    {l:'Total Revenue',   v:'EGP '+totalRev.toLocaleString(), i:SVG_ICONS.revenue||SVG_ICONS.clipboard, c:'green'},
    {l:'Total Bookings',  v:allB.length, i:SVG_ICONS.clipboard, c:'red'},
    {l:'Customers',       v:totalCustomers, i:SVG_ICONS.user, c:'blue'},
    {l:'Completion Rate', v:Math.round(allB.filter(b=>b.status==='completed').length/(allB.length||1)*100)+'%', i:SVG_ICONS.checkCircle, c:'yellow'},
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');

  // Revenue by service
  const svcRev = {};
  const MILEAGE_NAMES = {
    'pkg-10k':'10,000 km Service','pkg-20k':'20,000 km Service','pkg-30k':'30,000 km Service',
    'pkg-40k':'40,000 km Service','pkg-50k':'50,000 km Service','pkg-60k':'60,000 km Major Service',
    'pkg-70k':'70,000 km Service','pkg-80k':'80,000 km Service','pkg-90k':'90,000 km Service',
    'pkg-100k':'100,000 km Overhaul',
  };
  allB.forEach(b => {
    if (b.status !== 'completed') return;
    let name = b.service?.name;
    if (!name || name === 'Unknown') {
      const ids = b.serviceIds || (b.serviceId ? [b.serviceId] : []);
      const mileageId = ids.find(id => MILEAGE_NAMES[id]);
      name = mileageId ? MILEAGE_NAMES[mileageId] : (name || 'Other');
    }
    svcRev[name] = (svcRev[name] || 0) + (b.total || 0);
  });
  const maxRev = Math.max(...Object.values(svcRev),1);
  document.getElementById('r-svc-chart').innerHTML = Object.entries(svcRev).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`
    <div style="margin-bottom:10px">
      <div class="flex-between mb-4" style="font-size:.82rem"><span>${n}</span><span style="font-weight:700;color:var(--primary)">EGP ${v.toLocaleString()}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(v/maxRev*100)}%"></div></div>
    </div>`).join('') || '<p style="color:var(--gray-400)">No completed bookings yet.</p>';

  // Bookings by status
  const statC = {pending:0,in_progress:0,completed:0,cancelled:0};
  allB.forEach(b=>{if(statC[b.status]!==undefined)statC[b.status]++;});
  const colors = {pending:'var(--warning)',in_progress:'var(--info)',completed:'var(--success)',cancelled:'var(--gray-400)'};
  document.getElementById('r-status-chart').innerHTML = Object.entries(statC).map(([s,c])=>`
    <div style="margin-bottom:10px">
      <div class="flex-between mb-4" style="font-size:.82rem"><span>${(STATUS[s]||{label:s}).label}</span><span>${c}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(c/(allB.length||1)*100)}%;background:${colors[s]}"></div></div>
    </div>`).join('');

  // ── Top 5 Customers — from real database ──────────────────────
  const custData = topCustRes.data || [];
  const custTbody = document.getElementById('r-top-cust');
  if (custData.length === 0) {
    custTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--gray-400);padding:20px">No customers found.</td></tr>`;
  } else {
    custTbody.innerHTML = custData.map((u, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`;
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:1.2rem;min-width:28px;text-align:center">${medal}</span>
              <div>
                <strong>${u.firstName} ${u.lastName}</strong><br>
                <small style="color:var(--gray-400)">${u.email}</small>
              </div>
            </div>
          </td>
          <td><span class="badge badge-blue">${u.bkCount}</span></td>
          <td style="font-weight:700;color:var(--primary)">EGP ${u.spent.toLocaleString()}</td>
          <td><span class="badge badge-yellow">⭐ ${u.points}</span></td>
        </tr>`;
    }).join('');
  }

  // Staff productivity — from real bookings (assignedStaff is a DB id string)
  // Group completed bookings by assignedStaff id
  const staffJobMap = {};
  allB.forEach(b => {
    if (b.status === 'completed' && b.assignedStaff) {
      const sid = b.assignedStaff;
      staffJobMap[sid] = (staffJobMap[sid] || 0) + 1;
    }
  });
  const maxJobs = Math.max(...Object.values(staffJobMap), 1);

  // Get staff details from populated booking data
  const staffSeen = {};
  allB.forEach(b => {
    if (b.staff && b.assignedStaff) {
      const sid = b.assignedStaff;
      if (!staffSeen[sid]) {
        staffSeen[sid] = b.staff;
      }
    }
  });

  const staffEntries = Object.entries(staffJobMap).sort((a,b)=>b[1]-a[1]);
  document.getElementById('r-staff-prod').innerHTML = staffEntries.map(([sid, jobs]) => {
    const s = staffSeen[sid] || {};
    const name = (s.firstName && s.lastName) ? `${s.firstName} ${s.lastName}` : 'Staff Member';
    const pct = Math.round(jobs / maxJobs * 100);
    return `
      <div style="margin-bottom:12px">
        <div class="flex-between mb-4" style="font-size:.83rem">
          <span>${name}</span>
          <span>${jobs} jobs</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('') || '<p style="color:var(--gray-400)">No completed jobs yet.</p>';
});
