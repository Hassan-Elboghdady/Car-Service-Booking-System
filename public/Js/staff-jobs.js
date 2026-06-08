'use strict';
const JOB_MILEAGE = {
  'pkg-10k':'10,000 km Service','pkg-20k':'20,000 km Service','pkg-30k':'30,000 km Service',
  'pkg-40k':'40,000 km Service','pkg-50k':'50,000 km Service','pkg-60k':'60,000 km Service',
  'pkg-70k':'70,000 km Service','pkg-80k':'80,000 km Service','pkg-90k':'90,000 km Service',
  'pkg-100k':'100,000 km Overhaul',
};
function jobSvcLabel(b) {
  if (b.service?.name) return `<span style="display:inline-flex;align-items:center;gap:8px">${renderServiceIconHtml(b.service,'1.1rem')} ${b.service.name}</span>`;
  const ids = b.serviceIds || (b.serviceId ? [b.serviceId] : []);
  const mId = ids.find(id => JOB_MILEAGE[id]);
  if (mId) return `🛣️ ${JOB_MILEAGE[mId]}`;
  if (ids.length > 1) return `🔧 ${ids.length} Services`;
  return '';
}
let jTab = 'mine';
let jFilter = 'all';
window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('staff')) return;
  const staffUser = auth.current() || {};
  if (!staffUser.isRoleAssigned && !staffUser.staffRole) {
    const grid = document.getElementById('jobs-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="padding:48px">
          <div class="empty-icon">⏳</div>
          <h3>No Role Assigned</h3>
          <p>Your account is pending role assignment by an admin. Please contact your manager.</p>
          <a href="staff-dashboard.ejs" class="btn btn-primary mt-16">Back to Dashboard</a>
        </div>`;
    }
    return;
  }
  initSidebar();
  document.querySelectorAll('[data-jtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-jtab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      jTab = btn.dataset.jtab;
      renderJobs();
    });
  });
  document.querySelectorAll('[data-jf]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-jf]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      jFilter = btn.dataset.jf;
      renderJobs();
    });
  });
  await renderJobs();
});
async function renderJobs() {
  const user = auth.current();
  const allB = await bookingsAPI.allWithDetails();
  const grid = document.getElementById('jobs-grid');
  const statusFilters = document.getElementById('status-filters');
  if (jTab === 'available') {
    statusFilters.style.display = 'none';
    const avail = allB.filter(b => b.status === 'pending' && !b.assignedStaff);
    if (!avail.length) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔧</div><h3>No available jobs right now</h3><p>All pending jobs are assigned. Check back later.</p></div>';
      return;
    }
    grid.innerHTML = avail.map(j => {
      const daysUntil = daysDiff(j.date);
      const urgency = daysUntil < 0 ? 'overdue' : daysUntil === 0 ? 'today' : daysUntil <= 2 ? 'soon' : 'upcoming';
      const urgencyColor = { overdue:'var(--danger)', today:'var(--primary)', soon:'var(--warning)', upcoming:'var(--success)' };
      const urgencyLabel = { overdue:`🚨 Overdue by ${Math.abs(daysUntil)} day(s)`, today:'⚡ Due Today', soon:`⏳ Due in ${daysUntil} day(s)`, upcoming:`⏳ Due in ${daysUntil} day(s)` };
      return `
        <div class="card card-body" style="margin-bottom:16px;border-left:4px solid ${urgencyColor[urgency]}">
          <div class="flex-between mb-12">
            <h4>${jobSvcLabel(j)}</h4>
            <span style="font-size:.78rem;font-weight:700;color:${urgencyColor[urgency]}">${urgencyLabel[urgency]}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.83rem;margin-bottom:14px">
            <div><span style="color:var(--gray-400)">Vehicle</span><br><strong>${j.car?.emoji||'🚗'} ${j.car?.brand||''} ${j.car?.model||''} (${j.car?.year||''})</strong></div>
            <div><span style="color:var(--gray-400)">Plate</span><br><strong>${j.car?.plate||''}</strong></div>
            <div><span style="color:var(--gray-400)">Date & Time</span><br><strong>${formatDate(j.date)} at ${j.time||'TBD'}</strong></div>
            <div><span style="color:var(--gray-400)">Total</span><br><strong style="color:var(--primary)">EGP ${j.total||''}</strong></div>
          </div>
          ${j.notes ? `<div style="background:var(--gray-50);border-radius:var(--radius-xs);padding:10px;font-size:.8rem;margin-bottom:14px"><strong>Notes:</strong> ${j.notes}</div>` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="claimJob('${j.id}')">📋 Claim This Job</button>
          </div>
        </div>`;
    }).join('');
    return;
  }
  statusFilters.style.display = '';
  let jobs = allB.filter(b => b.assignedStaff === user.id);
  if (jFilter !== 'all') jobs = jobs.filter(j => j.status === jFilter);
  if (!jobs.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔧</div><h3>No jobs found</h3><p>Switch to "Available Jobs" to claim new ones.</p></div>';
    return;
  }
  grid.innerHTML = jobs.map(j => `
    <div class="card card-body" style="margin-bottom:16px;border-left:4px solid ${j.status==='in_progress'?'var(--primary)':j.status==='completed'?'var(--success)':'var(--gray-300)'}">
      <div class="flex-between mb-12">
        <h4>${jobSvcLabel(j)}</h4>
        ${statusBadge(j.status)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.83rem;margin-bottom:14px">
        <div><span style="color:var(--gray-400)">Vehicle</span><br><strong>${j.car?.emoji||'🚗'} ${j.car?.brand||''} ${j.car?.model||''} (${j.car?.year||''})</strong></div>
        <div><span style="color:var(--gray-400)">Plate</span><br><strong>${j.car?.plate||''}</strong></div>
        <div><span style="color:var(--gray-400)">Date</span><br><strong>${formatDate(j.date)}</strong></div>
        <div><span style="color:var(--gray-400)">Time</span><br><strong>${j.time||''}</strong></div>
      </div>
      ${j.notes ? `<div style="background:var(--gray-50);border-radius:var(--radius-xs);padding:10px;font-size:.8rem;margin-bottom:14px"><strong>Notes:</strong> ${j.notes}</div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${j.status==='pending'    ? `<button class="btn btn-primary btn-sm" onclick="start('${j.id}')">🔧 Start Job</button>` : ''}
        ${j.status==='in_progress'? `<button class="btn btn-success btn-sm" onclick="complete('${j.id}')">✅ Mark Complete</button>` : ''}
        <a href="staff-issues.ejs?bid=${j.id}" class="btn btn-ghost btn-sm">⚠️ Report Issue</a>
      </div>
    </div>`).join('');
}
function daysDiff(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d     = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}
window.claimJob = async (id) => {
  const user = auth.current() || {};
  if (!user.isRoleAssigned && !user.staffRole) {
    showToast('You need an assigned role to claim jobs.', 'error');
    return;
  }
  try {
    await api.put(`/bookings/${id}/assign`, { staffId: user.id || user._id });
    showToast('Job claimed! It is now in your My Jobs tab. ✅', 'success');
    await renderJobs();
  } catch (err) {
    showToast(err.message || 'Failed to claim job', 'error');
  }
};
window.start    = async (id) => { await bookingsAPI.updateStatus(id, 'in_progress'); showToast('Job started! 🔧', 'success'); await renderJobs(); };
window.complete = async (id) => { await bookingsAPI.updateStatus(id, 'completed');   showToast('Job complete! 🚗', 'success'); await renderJobs(); };
