const STAFF_MILEAGE_NAMES = {
  'pkg-10k':'10,000 km Service','pkg-20k':'20,000 km Service','pkg-30k':'30,000 km Service',
  'pkg-40k':'40,000 km Service','pkg-50k':'50,000 km Service','pkg-60k':'60,000 km Major Service',
  'pkg-70k':'70,000 km Service','pkg-80k':'80,000 km Service','pkg-90k':'90,000 km Service',
  'pkg-100k':'100,000 km Overhaul',
};

const SVG_CLIPBOARD = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
const SVG_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const SVG_CHECK_CIRCLE = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
const SVG_CALENDAR = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
const SVG_HOURGLASS = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14M5 22h14M19 2v4a7 7 0 0 1-7 7 7 7 0 0 1-7-7V2M5 22v-4a7 7 0 0 1 7-7 7 7 0 0 1 7 7v4"/></svg>`;
const SVG_WRENCH = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
const SVG_REVENUE = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
const SVG_USERS = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;

function staffSvcLabel(b) {
  if (b.service?.name) return `<span style="display:inline-flex;align-items:center;gap:8px">${renderServiceIconHtml(b.service,'1.1rem')} ${b.service.name}</span>`;
  const ids = b.serviceIds || (b.serviceId ? [b.serviceId] : []);
  const mId = ids.find(id => STAFF_MILEAGE_NAMES[id]);
  if (mId) return `🛣️ ${STAFF_MILEAGE_NAMES[mId]}`;
  if (ids.length > 1) return `🔧 ${ids.length} Services`;
  return '';
}

window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('staff')) return;
  initSidebar();

  const user = auth.current();
  document.getElementById('staff-name').textContent   = user?.firstName || 'Staff';
  document.getElementById('staff-avatar').textContent = (user?.firstName || 'S').charAt(0);

  const role = (user?.staffRole || '').toLowerCase();
  
  let welcomeIcon = '';
  let badgeHTML = '';

  if (role === 'manager') {
    welcomeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary); vertical-align: middle;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18v2H3z"/></svg>`;
    badgeHTML = `<span class="badge badge-red" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; font-weight: 600;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18v2H3z"/></svg>
      Manager
    </span>`;
  } else if (role === 'mechanic') {
    welcomeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary); vertical-align: middle;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
    badgeHTML = `<span class="badge badge-blue" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; font-weight: 600;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      Mechanic
    </span>`;
  } else {
    welcomeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary); vertical-align: middle;"><path d="M2 18a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-2H2v2z"/><path d="M12 2a10 10 0 0 0-10 10h20A10 10 0 0 0 12 2z"/><path d="M12 2v10"/></svg>`;
    badgeHTML = `<span class="badge badge-yellow" style="padding: 4px 8px; font-weight: 600;">No Role Assigned</span>`;
  }

  const welcomeIconContainer = document.getElementById('staff-welcome-icon');
  if (welcomeIconContainer) {
    welcomeIconContainer.innerHTML = welcomeIcon;
  }
  document.getElementById('staff-role-tag').innerHTML = badgeHTML;

  const allBookings = await bookingsAPI.allWithDetails();
  const myJobs  = allBookings.filter(b => b.assignedStaff === user.id);
  const today   = todayStr();

  if (role === 'manager') {
    document.getElementById('mechanic-layout').style.display = 'none';
    renderManagerDash(allBookings, myJobs, today);
  } else {
    document.getElementById('staff-main-layout').style.display = 'none';
    renderMechanicDash(myJobs, today);
  }
});

function renderMechanicDash(myJobs, today) {
  document.getElementById('staff-stats').innerHTML = [
    { l:'Assigned to Me', v:myJobs.length,                                    i:SVG_CLIPBOARD, c:'blue'   },
    { l:'In Progress',    v:myJobs.filter(j=>j.status==='in_progress').length,i:SVG_CLOCK,     c:'yellow' },
    { l:'Completed',      v:myJobs.filter(j=>j.status==='completed').length,  i:SVG_CHECK_CIRCLE,c:'green'  },
    { l:'Today\'s Jobs',  v:myJobs.filter(j=>j.date===today).length,          i:SVG_CALENDAR,  c:'red'    },
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');

  const active = myJobs.filter(j => ['pending','in_progress'].includes(j.status));
  const jobsList = document.getElementById('staff-jobs-list');
  jobsList.innerHTML = active.length ? active.map(j => `
    <div style="padding:16px 0;border-bottom:1px solid var(--gray-100)">
      <div class="flex-between mb-8">
        <div><strong>${j.car?.emoji||'🚗'} ${j.car?.brand||''} ${j.car?.model||''} (${j.car?.year||''})</strong></div>
        ${statusBadge(j.status)}
      </div>
      <div style="font-size:.82rem;color:var(--gray-500);margin-bottom:6px">${staffSvcLabel(j)}</div>
      <div style="font-size:.78rem;color:var(--gray-400);display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${formatDate(j.date)} at ${j.time||'TBD'}  Customer: ${j.user?.firstName||''} ${j.user?.lastName||''}</div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        ${j.status==='pending'?`<button class="btn btn-primary btn-sm" style="display:inline-flex;align-items:center;gap:4px" onclick="startJob('${j.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Start Job</button>`:''}
        ${j.status==='in_progress'?`<button class="btn btn-success btn-sm" style="display:inline-flex;align-items:center;gap:4px" onclick="completeJob('${j.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Mark Complete</button>`:''}
        <span style="font-size:.78rem;color:var(--gray-500);align-self:center">EGP ${j.total||''}</span>
      </div>
    </div>`).join('')
  : '<div class="empty-state" style="padding:32px"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div><p>No active jobs assigned to you. Check back later!</p></div>';

  renderTodaySchedule(myJobs, today);
}

function renderManagerDash(allBookings, myJobs, today) {
  const allStaff  = (store.get(KEYS.USERS)||[]).filter(u=>u.role==='staff'||u.userType==='staff');
  const completed = allBookings.filter(b=>b.status==='completed');
  const totalRev  = completed.reduce((s,b)=>s+(b.total||0), 0);
  const pending   = allBookings.filter(b=>b.status==='pending').length;
  const inProg    = allBookings.filter(b=>b.status==='in_progress').length;

  const sidebarWidget = document.getElementById('mgr-sidebar-stats');
  if (sidebarWidget) {
    sidebarWidget.style.display = 'block';
    const todayCompleted = completed.filter(b => b.date === today);
    const todayRev = todayCompleted.reduce((s,b) => s+(b.total||0), 0);
    const thisMonth = new Date().toISOString().slice(0,7); // YYYY-MM
    const monthRev = completed.filter(b => b.date?.startsWith(thisMonth)).reduce((s,b) => s+(b.total||0), 0);
    document.getElementById('mgr-rev-today').textContent = `EGP ${todayRev.toLocaleString()}`;
    document.getElementById('mgr-rev-today-label').textContent = `from ${todayCompleted.length} completed job(s)`;
    document.getElementById('mgr-rev-month').textContent = `EGP ${monthRev.toLocaleString()}`;
    document.getElementById('mgr-pending-count').textContent = pending;
    document.getElementById('mgr-done-count').textContent = completed.length;
  }

  document.getElementById('staff-stats').innerHTML = [
    { l:'Total Bookings',   v:allBookings.length,  i:SVG_CLIPBOARD, c:'blue'   },
    { l:'Pending Jobs',     v:pending,             i:SVG_HOURGLASS, c:'yellow' },
    { l:'In Progress',      v:inProg,              i:SVG_WRENCH,    c:'red'    },
    { l:'Completed Today',  v:allBookings.filter(b=>b.status==='completed'&&b.date===today).length, i:SVG_CHECK_CIRCLE, c:'green' },
    { l:'Total Revenue',    v:'EGP '+totalRev.toLocaleString(), i:SVG_REVENUE, c:'blue'  },
    { l:'Team Size',        v:allStaff.length,     i:SVG_USERS,     c:'yellow' },
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');

  document.getElementById('staff-main-layout').innerHTML = `
    <div class="card">
      <div class="card-header"><h3 style="display:flex;align-items:center;gap:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Revenue by Service</h3></div>
      <div style="padding:0 24px 24px">
        ${(()=>{
          const svcRev = {};
          allBookings.forEach(b => {
            const n = staffSvcLabel(b).replace(/^[^\s]+ /,'') || 'Other';
            svcRev[n]=(svcRev[n]||0)+(b.total||0);
          });
          const maxR = Math.max(...Object.values(svcRev),1);
          return Object.entries(svcRev).sort((a,b_)=>b_[1]-a[1]).slice(0,6).map(([n,v])=>`
            <div style="margin-bottom:14px">
              <div class="flex-between mb-4" style="font-size:.83rem"><span>${n}</span><span style="font-weight:700;color:var(--primary)">EGP ${v.toLocaleString()}</span></div>
              <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(v/maxR*100)}%"></div></div>
            </div>`).join('') || '<p class="text-muted">No revenue data yet.</p>';
        })()}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px">
      <div class="card">
        <div class="card-header flex-between"><h3 style="display:flex;align-items:center;gap:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> Active Bookings</h3><span class="badge badge-yellow">${pending+inProg}</span></div>
        <div style="padding:0 24px 24px">
          ${allBookings.filter(b=>['pending','in_progress'].includes(b.status)).slice(0,8).map(b=>`
            <div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">
              <div class="flex-between mb-4">
                <strong style="font-size:.85rem">${b.car?.brand||''} ${b.car?.model||''}</strong>
                ${statusBadge(b.status)}
              </div>
              <div style="font-size:.78rem;color:var(--gray-500)">${staffSvcLabel(b)}  EGP ${b.total||''}</div>
              <div style="font-size:.74rem;color:var(--gray-400);display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 0 4 0a2 2 0 0 0-4 0zM3 16a2 2 0 1 0 4 0a2 2 0 0 0-4 0z"></path></svg> ${formatDate(b.date)} ${b.time||''}</div>
            </div>`).join('') || '<p class="text-muted" style="padding-top:12px">No active bookings.</p>'}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 style="display:flex;align-items:center;gap:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Team Performance</h3></div>
        <div style="padding:0 24px 24px">
          ${allStaff.length ? allStaff.map(u=>{
            const jobsDone = allBookings.filter(b=>b.assignedStaff===u.id&&b.status==='completed').length;
            const jobsActive = allBookings.filter(b=>b.assignedStaff===u.id&&b.status==='in_progress').length;
            return `<div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">
              <div class="flex-between mb-4">
                <div class="flex-gap">
                  <div class="nav-avatar" style="width:30px;height:30px;font-size:.75rem">${u.firstName.charAt(0)}</div>
                  <div>
                    <div style="font-weight:600;font-size:.85rem">${u.firstName} ${u.lastName}</div>
                    <div style="font-size:.73rem;color:var(--gray-400)">${u.staffRole||'No Role'}</div>
                  </div>
                </div>
                <div style="text-align:right;font-size:.78rem">
                  <div style="color:var(--success);display:flex;align-items:center;gap:4px;justify-content:flex-end"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${jobsDone} done</div>
                  <div style="color:var(--warning);display:flex;align-items:center;gap:4px;justify-content:flex-end"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> ${jobsActive} active</div>
                </div>
              </div>
            </div>`;
          }).join('') : '<p class="text-muted" style="padding-top:12px">No staff members yet.</p>'}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:24px">
      <div class="card-header"><h3 style="display:flex;align-items:center;gap:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Today's Full Schedule (${new Date().toLocaleDateString('en-EG',{weekday:'long',month:'short',day:'numeric'})})</h3></div>
      <div style="padding:0 24px 24px">
        ${(()=>{
          const todayJobs = allBookings.filter(b=>b.date===today).sort((a,b_)=> (a.time||'').localeCompare(b_.time||''));
          return todayJobs.length ? todayJobs.map(b=>`
            <div style="display:grid;grid-template-columns:60px 1fr auto;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
              <div style="font-weight:700;color:var(--primary);font-size:.82rem;padding-top:2px">${b.time||'TBD'}</div>
              <div>
                <div style="font-size:.85rem;font-weight:600">${staffSvcLabel(b)}</div>
                <div style="font-size:.75rem;color:var(--gray-400)">${b.car?.brand||''} ${b.car?.model||''}  ${b.user?.firstName||''} ${b.user?.lastName||''}</div>
              </div>
              <div>${statusBadge(b.status)}</div>
            </div>`).join('')
          : '<p class="text-muted" style="padding-top:12px">No jobs scheduled for today.</p>';
        })()}
      </div>
    </div>`;
  
  renderTodaySchedule(myJobs, today);
}

function renderTodaySchedule(myJobs, today) {
  const sched = document.getElementById('today-schedule');
  if (!sched) return;
  const todayJobs = myJobs.filter(j=>j.date===today).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  sched.innerHTML = todayJobs.length ? todayJobs.map(j=>`
    <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--gray-100)">
      <div style="font-size:.75rem;font-weight:700;color:var(--primary);min-width:52px;padding-top:2px">${j.time||'TBD'}</div>
      <div>
        <div style="font-size:.83rem;font-weight:600">${staffSvcLabel(j)}</div>
        <div style="font-size:.73rem;color:var(--gray-400)">${j.car?.brand||''} ${j.car?.model||''}</div>
      </div>
    </div>`).join('')
  : '<p style="color:var(--gray-400);font-size:.85rem">No jobs today.</p>';
}

window.startJob = async (id) => {
  await bookingsAPI.updateStatus(id, 'in_progress');
  showToast('Job started', 'success');
  setTimeout(() => location.reload(), 600);
};
window.completeJob = async (id) => {
  await bookingsAPI.updateStatus(id, 'completed');
  showToast('Job completed', 'success');
  setTimeout(() => location.reload(), 600);
};
const STAFF_MILEAGE_NAMES = {
  'pkg-10k':'10,000 km Service','pkg-20k':'20,000 km Service','pkg-30k':'30,000 km Service',
  'pkg-40k':'40,000 km Service','pkg-50k':'50,000 km Service','pkg-60k':'60,000 km Major Service',
  'pkg-70k':'70,000 km Service','pkg-80k':'80,000 km Service','pkg-90k':'90,000 km Service',
  'pkg-100k':'100,000 km Overhaul',
};

const SVG_CLIPBOARD = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
const SVG_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const SVG_CHECK_CIRCLE = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
const SVG_CALENDAR = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
const SVG_HOURGLASS = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14M5 22h14M19 2v4a7 7 0 0 1-7 7 7 7 0 0 1-7-7V2M5 22v-4a7 7 0 0 1 7-7 7 7 0 0 1 7 7v4"/></svg>`;
const SVG_WRENCH = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
const SVG_REVENUE = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
const SVG_USERS = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;

function staffSvcLabel(b) {
  if (b.service?.name) return `<span style="display:inline-flex;align-items:center;gap:8px">${renderServiceIconHtml(b.service,'1.1rem')} ${b.service.name}</span>`;
  const ids = b.serviceIds || (b.serviceId ? [b.serviceId] : []);
  const mId = ids.find(id => STAFF_MILEAGE_NAMES[id]);
  if (mId) return `🛣️ ${STAFF_MILEAGE_NAMES[mId]}`;
  if (ids.length > 1) return `🔧 ${ids.length} Services`;
  return '';
}

window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('staff')) return;
  initSidebar();

  const user = auth.current();
  document.getElementById('staff-name').textContent   = user?.firstName || 'Staff';
  document.getElementById('staff-avatar').textContent = (user?.firstName || 'S').charAt(0);

  const role = (user?.staffRole || '').toLowerCase();
  
  let welcomeIcon = '';
  let badgeHTML = '';

  if (role === 'manager') {
    welcomeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary); vertical-align: middle;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18v2H3z"/></svg>`;
    badgeHTML = `<span class="badge badge-red" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; font-weight: 600;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18v2H3z"/></svg>
      Manager
    </span>`;
  } else if (role === 'mechanic') {
    welcomeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary); vertical-align: middle;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
    badgeHTML = `<span class="badge badge-blue" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; font-weight: 600;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      Mechanic
    </span>`;
  } else {
    welcomeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary); vertical-align: middle;"><path d="M2 18a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-2H2v2z"/><path d="M12 2a10 10 0 0 0-10 10h20A10 10 0 0 0 12 2z"/><path d="M12 2v10"/></svg>`;
    badgeHTML = `<span class="badge badge-yellow" style="padding: 4px 8px; font-weight: 600;">No Role Assigned</span>`;
  }

  const welcomeIconContainer = document.getElementById('staff-welcome-icon');
  if (welcomeIconContainer) {
    welcomeIconContainer.innerHTML = welcomeIcon;
  }
  document.getElementById('staff-role-tag').innerHTML = badgeHTML;

  const allBookings = await bookingsAPI.allWithDetails();
  const myJobs  = allBookings.filter(b => b.assignedStaff === user.id);
  const today   = todayStr();

  if (role === 'manager') {
    document.getElementById('mechanic-layout').style.display = 'none';
    renderManagerDash(allBookings, myJobs, today);
  } else {
    document.getElementById('staff-main-layout').style.display = 'none';
    renderMechanicDash(myJobs, today);
  }
});

function renderMechanicDash(myJobs, today) {
  document.getElementById('staff-stats').innerHTML = [
    { l:'Assigned to Me', v:myJobs.length,                                    i:SVG_CLIPBOARD, c:'blue'   },
    { l:'In Progress',    v:myJobs.filter(j=>j.status==='in_progress').length,i:SVG_CLOCK,     c:'yellow' },
    { l:'Completed',      v:myJobs.filter(j=>j.status==='completed').length,  i:SVG_CHECK_CIRCLE,c:'green'  },
    { l:'Today\'s Jobs',  v:myJobs.filter(j=>j.date===today).length,          i:SVG_CALENDAR,  c:'red'    },
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');

  const active = myJobs.filter(j => ['pending','in_progress'].includes(j.status));
  const jobsList = document.getElementById('staff-jobs-list');
  jobsList.innerHTML = active.length ? active.map(j => `
    <div style="padding:16px 0;border-bottom:1px solid var(--gray-100)">
      <div class="flex-between mb-8">
        <div><strong>${j.car?.emoji||'🚗'} ${j.car?.brand||''} ${j.car?.model||''} (${j.car?.year||''})</strong></div>
        ${statusBadge(j.status)}
      </div>
      <div style="font-size:.82rem;color:var(--gray-500);margin-bottom:6px">${staffSvcLabel(j)}</div>
      <div style="font-size:.78rem;color:var(--gray-400);display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${formatDate(j.date)} at ${j.time||'TBD'}  Customer: ${j.user?.firstName||''} ${j.user?.lastName||''}</div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        ${j.status==='pending'?`<button class="btn btn-primary btn-sm" style="display:inline-flex;align-items:center;gap:4px" onclick="startJob('${j.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Start Job</button>`:''}
        ${j.status==='in_progress'?`<button class="btn btn-success btn-sm" style="display:inline-flex;align-items:center;gap:4px" onclick="completeJob('${j.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Mark Complete</button>`:''}
        <span style="font-size:.78rem;color:var(--gray-500);align-self:center">EGP ${j.total||''}</span>
      </div>
    </div>`).join('')
  : '<div class="empty-state" style="padding:32px"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div><p>No active jobs assigned to you. Check back later!</p></div>';

  renderTodaySchedule(myJobs, today);
}

function renderManagerDash(allBookings, myJobs, today) {
  const allStaff  = (store.get(KEYS.USERS)||[]).filter(u=>u.role==='staff'||u.userType==='staff');
  const completed = allBookings.filter(b=>b.status==='completed');
  const totalRev  = completed.reduce((s,b)=>s+(b.total||0), 0);
  const pending   = allBookings.filter(b=>b.status==='pending').length;
  const inProg    = allBookings.filter(b=>b.status==='in_progress').length;

  const sidebarWidget = document.getElementById('mgr-sidebar-stats');
  if (sidebarWidget) {
    sidebarWidget.style.display = 'block';
    const todayCompleted = completed.filter(b => b.date === today);
    const todayRev = todayCompleted.reduce((s,b) => s+(b.total||0), 0);
    const thisMonth = new Date().toISOString().slice(0,7);
    const monthRev = completed.filter(b => b.date?.startsWith(thisMonth)).reduce((s,b) => s+(b.total||0), 0);
    document.getElementById('mgr-rev-today').textContent = `EGP ${todayRev.toLocaleString()}`;
    document.getElementById('mgr-rev-today-label').textContent = `from ${todayCompleted.length} completed job(s)`;
    document.getElementById('mgr-rev-month').textContent = `EGP ${monthRev.toLocaleString()}`;
    document.getElementById('mgr-pending-count').textContent = pending;
    document.getElementById('mgr-done-count').textContent = completed.length;
  }

  document.getElementById('staff-stats').innerHTML = [
    { l:'Total Bookings',   v:allBookings.length,  i:SVG_CLIPBOARD, c:'blue'   },
    { l:'Pending Jobs',     v:pending,             i:SVG_HOURGLASS, c:'yellow' },
    { l:'In Progress',      v:inProg,              i:SVG_WRENCH,    c:'red'    },
    { l:'Completed Today',  v:allBookings.filter(b=>b.status==='completed'&&b.date===today).length, i:SVG_CHECK_CIRCLE, c:'green' },
    { l:'Total Revenue',    v:'EGP '+totalRev.toLocaleString(), i:SVG_REVENUE, c:'blue'  },
    { l:'Team Size',        v:allStaff.length,     i:SVG_USERS,     c:'yellow' },
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');

  document.getElementById('staff-main-layout').innerHTML = `
    <div class="card">
      <div class="card-header"><h3 style="display:flex;align-items:center;gap:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Revenue by Service</h3></div>
      <div style="padding:0 24px 24px">
        ${(()=>{
          const svcRev = {};
          allBookings.forEach(b => {
            const n = staffSvcLabel(b).replace(/^[^\s]+ /,'') || 'Other';
            svcRev[n]=(svcRev[n]||0)+(b.total||0);
          });
          const maxR = Math.max(...Object.values(svcRev),1);
          return Object.entries(svcRev).sort((a,b_)=>b_[1]-a[1]).slice(0,6).map(([n,v])=>`
            <div style="margin-bottom:14px">
              <div class="flex-between mb-4" style="font-size:.83rem"><span>${n}</span><span style="font-weight:700;color:var(--primary)">EGP ${v.toLocaleString()}</span></div>
              <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(v/maxR*100)}%"></div></div>
            </div>`).join('') || '<p class="text-muted">No revenue data yet.</p>';
        })()}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px">
      <div class="card">
        <div class="card-header flex-between"><h3 style="display:flex;align-items:center;gap:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> Active Bookings</h3><span class="badge badge-yellow">${pending+inProg}</span></div>
        <div style="padding:0 24px 24px">
          ${allBookings.filter(b=>['pending','in_progress'].includes(b.status)).slice(0,8).map(b=>`
            <div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">
              <div class="flex-between mb-4">
                <strong style="font-size:.85rem">${b.car?.brand||''} ${b.car?.model||''}</strong>
                ${statusBadge(b.status)}
              </div>
              <div style="font-size:.78rem;color:var(--gray-500)">${staffSvcLabel(b)}  EGP ${b.total||''}</div>
              <div style="font-size:.74rem;color:var(--gray-400);display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 0 4 0a2 2 0 0 0-4 0zM3 16a2 2 0 1 0 4 0a2 2 0 0 0-4 0z"></path></svg> ${formatDate(b.date)} ${b.time||''}</div>
            </div>`).join('') || '<p class="text-muted" style="padding-top:12px">No active bookings.</p>'}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 style="display:flex;align-items:center;gap:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Team Performance</h3></div>
        <div style="padding:0 24px 24px">
          ${allStaff.length ? allStaff.map(u=>{
            const jobsDone = allBookings.filter(b=>b.assignedStaff===u.id&&b.status==='completed').length;
            const jobsActive = allBookings.filter(b=>b.assignedStaff===u.id&&b.status==='in_progress').length;
            return `<div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">
              <div class="flex-between mb-4">
                <div class="flex-gap">
                  <div class="nav-avatar" style="width:30px;height:30px;font-size:.75rem">${u.firstName.charAt(0)}</div>
                  <div>
                    <div style="font-weight:600;font-size:.85rem">${u.firstName} ${u.lastName}</div>
                    <div style="font-size:.73rem;color:var(--gray-400)">${u.staffRole||'No Role'}</div>
                  </div>
                </div>
                <div style="text-align:right;font-size:.78rem">
                  <div style="color:var(--success);display:flex;align-items:center;gap:4px;justify-content:flex-end"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${jobsDone} done</div>
                  <div style="color:var(--warning);display:flex;align-items:center;gap:4px;justify-content:flex-end"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> ${jobsActive} active</div>
                </div>
              </div>
            </div>`;
          }).join('') : '<p class="text-muted" style="padding-top:12px">No staff members yet.</p>'}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:24px">
      <div class="card-header"><h3 style="display:flex;align-items:center;gap:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Today's Full Schedule (${new Date().toLocaleDateString('en-EG',{weekday:'long',month:'short',day:'numeric'})})</h3></div>
      <div style="padding:0 24px 24px">
        ${(()=>{
          const todayJobs = allBookings.filter(b=>b.date===today).sort((a,b_)=>(a.time||'').localeCompare(b_.time||''));
          return todayJobs.length ? todayJobs.map(b=>`
            <div style="display:grid;grid-template-columns:60px 1fr auto;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
              <div style="font-weight:700;color:var(--primary);font-size:.82rem;padding-top:2px">${b.time||'TBD'}</div>
              <div>
                <div style="font-size:.85rem;font-weight:600">${staffSvcLabel(b)}</div>
                <div style="font-size:.75rem;color:var(--gray-400)">${b.car?.brand||''} ${b.car?.model||''}  ${b.user?.firstName||''} ${b.user?.lastName||''}</div>
              </div>
              <div>${statusBadge(b.status)}</div>
            </div>`).join('')
          : '<p class="text-muted" style="padding-top:12px">No jobs scheduled for today.</p>';
        })()}
      </div>
    </div>`;
  
  renderTodaySchedule(myJobs, today);
}

function renderTodaySchedule(myJobs, today) {
  const sched = document.getElementById('today-schedule');
  if (!sched) return;
  const todayJobs = myJobs.filter(j=>j.date===today).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  sched.innerHTML = todayJobs.length ? todayJobs.map(j=>`
    <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--gray-100)">
      <div style="font-size:.75rem;font-weight:700;color:var(--primary);min-width:52px;padding-top:2px">${j.time||'TBD'}</div>
      <div>
        <div style="font-size:.83rem;font-weight:600">${staffSvcLabel(j)}</div>
        <div style="font-size:.73rem;color:var(--gray-400)">${j.car?.brand||''} ${j.car?.model||''}</div>
      </div>
    </div>`).join('')
  : '<p style="color:var(--gray-400);font-size:.85rem">No jobs today.</p>';
}

window.startJob = async (id) => {
  await bookingsAPI.updateStatus(id, 'in_progress');
  showToast('Job started', 'success');
  setTimeout(() => location.reload(), 600);
};
window.completeJob = async (id) => {
  await bookingsAPI.updateStatus(id, 'completed');
  showToast('Job completed', 'success');
  setTimeout(() => location.reload(), 600);
};
