// admin-reports.js
window.addEventListener('DOMContentLoaded', async () => {
  seedData(); if (!requireRole('admin')) return; initSidebar();

  const allB = await bookingsAPI.allWithDetails();
  const customers = getAll(KEYS.USERS).filter(u=>u.role==='customer');
  const totalRev  = allB.filter(b=>b.status==='completed').reduce((s,b)=>s+(b.total||0),0);

  document.getElementById('r-stats').innerHTML = [
    {l:'Total Revenue',     v:'EGP '+totalRev.toLocaleString(), i:SVG_ICONS.revenue||SVG_ICONS.clipboard, c:'green'},
    {l:'Total Bookings',    v:allB.length, i:SVG_ICONS.clipboard, c:'red'},
    {l:'Customers',         v:customers.length, i:SVG_ICONS.user, c:'blue'},
    {l:'Completion Rate',   v:Math.round(allB.filter(b=>b.status==='completed').length/(allB.length||1)*100)+'%', i:SVG_ICONS.checkCircle, c:'yellow'},
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');

  // Revenue by service
  const svcRev = {};
  allB.forEach(b=>{ const n=b.service?.name||'Unknown'; svcRev[n]=(svcRev[n]||0)+(b.total||0); });
  const maxRev = Math.max(...Object.values(svcRev),1);
  document.getElementById('r-svc-chart').innerHTML = Object.entries(svcRev).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`
    <div style="margin-bottom:10px">
      <div class="flex-between mb-4" style="font-size:.82rem"><span>${n}</span><span style="font-weight:700;color:var(--primary)">EGP ${v}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(v/maxRev*100)}%"></div></div>
    </div>`).join('');

  // Bookings by status
  const statC = {pending:0,in_progress:0,completed:0,cancelled:0};
  allB.forEach(b=>{if(statC[b.status]!==undefined)statC[b.status]++;});
  const colors = {pending:'var(--warning)',in_progress:'var(--info)',completed:'var(--success)',cancelled:'var(--gray-400)'};
  document.getElementById('r-status-chart').innerHTML = Object.entries(statC).map(([s,c])=>`
    <div style="margin-bottom:10px">
      <div class="flex-between mb-4" style="font-size:.82rem"><span>${(STATUS[s]||{label:s}).label}</span><span>${c}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(c/(allB.length||1)*100)}%;background:${colors[s]}"></div></div>
    </div>`).join('');

  // Top customers
  const custData = customers.map(u=>{
    const bks = allB.filter(b=>b.userId===u.id);
    const spent = bks.filter(b=>b.status==='completed').reduce((s,b)=>s+(b.total||0),0);
    return {...u, bkCount:bks.length, spent};
  }).sort((a,b)=>b.spent-a.spent).slice(0,5);
  document.getElementById('r-top-cust').innerHTML = custData.map(u=>`
    <tr>
      <td><strong>${u.firstName} ${u.lastName}</strong><br><small>${u.email}</small></td>
      <td>${u.bkCount}</td>
      <td style="font-weight:700;color:var(--primary)">EGP ${u.spent}</td>
      <td>${u.points||0}</td>
    </tr>`).join('');

  // Staff productivity
  const staffList = getAll(KEYS.USERS).filter(u=>u.role==='staff');
  document.getElementById('r-staff-prod').innerHTML = staffList.map(u=>{
    const jobs = allB.filter(b=>b.assignedStaff===u.id&&b.status==='completed').length;
    const pct  = Math.round(jobs/(Math.max(...staffList.map(s=>allB.filter(b=>b.assignedStaff===s.id&&b.status==='completed').length),1))*100);
    return `
      <div style="margin-bottom:12px">
        <div class="flex-between mb-4" style="font-size:.83rem">
          <span>${u.firstName} ${u.lastName} <span class="badge badge-blue" style="margin-left:4px">${u.staffRole||'Staff'}</span></span>
          <span>${jobs} jobs</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('') || '<p style="color:var(--gray-400)">No staff data yet.</p>';
});
