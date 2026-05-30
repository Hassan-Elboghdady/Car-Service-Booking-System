// admin-reviews.js
let rvFilter = 'all';

window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();
  await renderStats();
  await renderReviews();
  renderReports();
  renderStaffProblems();
  renderContactMsgs();

  document.querySelectorAll('[data-rv]').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('[data-rv]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rvFilter = btn.dataset.rv;
      await renderReviews();
    });
  });
});

function getReports() { return getAll(KEYS.ISSUES)  || []; }

// --- STATS ----------------------------------------------------
async function renderStats() {
  const revs = await reviewsAPI.getAll();
  const rpts = getReports();
  const avg  = revs.length ? (revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1) : '';
  document.getElementById('rv-stats').innerHTML = [
    { l: 'Total Reviews', v: revs.length,                                        i: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>', c: 'yellow' },
    { l: 'Approved',      v: revs.filter(r => r.status === 'approved').length,   i: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>', c: 'green'  },
    { l: 'Avg Rating',    v: avg + '/5',                                          i: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;fill:currentColor;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>', c: 'blue'   },
    { l: 'Open Reports',  v: rpts.filter(r => r.status === 'open').length,       i: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>', c: 'red'    },
  ].map(s => `<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
}

// --- CUSTOMER REVIEWS -----------------------------------------
async function renderReviews() {
  let revs = await reviewsAPI.getAll();
  if (rvFilter !== 'all') revs = revs.filter(r => rvFilter === 'approved' ? r.status === 'approved' : r.status !== 'approved');
  const el = document.getElementById('rv-list');
  if (!el) return;
  if (!revs.length) { el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔧</div><p>No reviews yet.</p></div>'; return; }
  el.innerHTML = [...revs].reverse().map(r => {
    const user = r.userId || {};
    return `<div style="padding:18px 0;border-bottom:1px solid var(--gray-100)">
      <div class="flex-between mb-8">
        <div class="flex-gap">
          <div class="nav-avatar" style="width:36px;height:36px;font-size:.8rem">${(user.firstName || 'U').charAt(0)}</div>
          <div><div style="font-weight:600;font-size:.88rem">${user.firstName || ''} ${user.lastName || ''}</div><div style="font-size:.72rem;color:var(--gray-500)">${formatDate(r.createdAt)}</div></div>
        </div>
        <div class="flex-gap">
          <span style="color:#fbbf24">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
          <span class="badge ${r.status === 'approved' ? 'badge-green' : 'badge-yellow'}">${r.status}</span>
        </div>
      </div>
      <p style="font-size:.85rem;margin-bottom:12px">"${r.text}"</p>
      <div class="flex-gap">
        ${r.status !== 'approved' ? `<button class="btn btn-success btn-sm" onclick="approveReview('${r._id}')">Approve</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="removeReview('${r._id}')">Remove</button>
      </div>
    </div>`;
  }).join('');
}

window.approveReview = async (id) => {
  await reviewsAPI.updateStatus(id, 'approved');
  await renderStats(); await renderReviews(); showToast('Review approved!', 'success');
};
window.removeReview = async (id) => {
  if (!confirm('Remove this review?')) return;
  await reviewsAPI.remove(id);
  await renderStats(); await renderReviews(); showToast('Review removed.', 'success');
};

// --- CUSTOMER REPORTS -----------------------------------------
function renderReports() {
  const el = document.getElementById('reports-list');
  if (!el) return;
  const rpts = [...getReports()].reverse();
  if (!rpts.length) { el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔧</div><p>No reports yet.</p></div>'; return; }
  el.innerHTML = rpts.map(r => {
    const user = getById(KEYS.USERS, r.userId) || {};
    const bk   = getById(KEYS.BOOKINGS, r.bookingId) || {};
    const svcs = getServices();
    const svc  = svcs.find(s => s.id === bk.serviceId) || {};
    const hasReply = r.adminReply && r.adminReply.trim();
    return `<div style="padding:18px;margin-bottom:12px;border:1px solid var(--gray-100);border-radius:10px;background:#fff">
      <div class="flex-between mb-8">
        <div class="flex-gap">
          <div class="nav-avatar" style="width:36px;height:36px;font-size:.8rem;background:var(--warning)">${(user.firstName || 'U').charAt(0)}</div>
          <div>
            <div style="font-weight:600;font-size:.88rem">${user.firstName || ''} ${user.lastName || ''}</div>
            <div style="font-size:.72rem;color:var(--gray-500)">${formatDate(r.createdAt)}  ${svc.name || 'Unknown Service'}</div>
          </div>
        </div>
        <div class="flex-gap">
          <span class="badge badge-yellow">${r.type}</span>
          <span class="badge ${hasReply ? 'badge-green' : 'badge-red'}">${hasReply ? 'Replied' : 'Open'}</span>
        </div>
      </div>
      <p style="font-size:.85rem;margin-bottom:12px;padding:10px;background:var(--gray-50);border-radius:8px">${r.desc}</p>
      ${hasReply
        ? `<div style="padding:10px;background:#fff0f2;border-radius:8px;border-left:3px solid var(--primary);font-size:.85rem"><strong>🚗 Admin Reply:</strong> ${r.adminReply}
           <button class="btn btn-ghost btn-sm" style="float:right;font-size:.72rem" onclick="editReply('${r.id}')">Edit</button></div>`
        : `<div style="display:flex;gap:8px;margin-top:8px">
             <input class="form-control" id="reply-${r.id}" placeholder="Type your reply to the customer" style="flex:1;font-size:.85rem">
             <button class="btn btn-primary btn-sm" onclick="sendReply('${r.id}')">Reply</button>
           </div>`}
    </div>`;
  }).join('');
}

window.sendReply = (id) => {
  const input = document.getElementById('reply-' + id);
  const reply = input ? input.value.trim() : '';
  if (!reply) { showToast('Please type a reply first.', 'error'); return; }
  const reports = getReports();
  const r = reports.find(x => x.id === id); if (!r) return;
  r.adminReply = reply; r.status = 'replied'; r.repliedAt = new Date().toISOString();
  saveAll(KEYS.ISSUES, reports);
  notify({ userId: r.userId, message: `Admin replied to your report: "${reply.slice(0, 60)}"`, type: 'info', icon: '🚗' });
  showToast('Reply sent to customer!', 'success');
  renderStats(); renderReports();
};

window.editReply = (id) => {
  const reports = getReports();
  const r = reports.find(x => x.id === id); if (!r) return;
  r.adminReply = ''; r.status = 'open';
  saveAll(KEYS.ISSUES, reports);
  renderReports();
};

// --- STAFF PROBLEMS -------------------------------------------
function renderStaffProblems() {
  const el = document.getElementById('staff-problems-list');
  if (!el) return;
  const problems = JSON.parse(localStorage.getItem('as_staff_issues') || '[]').reverse();
  if (!problems.length) { el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔧</div><p>No staff reports yet.</p></div>'; return; }
  el.innerHTML = problems.map(p => {
    const staff = getById(KEYS.USERS, p.staffId) || {};
    const hasReply = p.adminReply && p.adminReply.trim();
    return `<div style="padding:18px;margin-bottom:12px;border:1px solid var(--gray-100);border-radius:10px;background:#fff;border-left:3px solid var(--warning)">
      <div class="flex-between mb-8">
        <div class="flex-gap">
          <div class="nav-avatar" style="width:36px;height:36px;font-size:.8rem;background:var(--warning)">${(staff.firstName || 'S').charAt(0)}</div>
          <div>
            <div style="font-weight:600;font-size:.88rem">🚗 ${staff.firstName || ''} ${staff.lastName || ''} <span style="font-size:.72rem;color:var(--gray-400)">(Staff)</span></div>
            <div style="font-size:.72rem;color:var(--gray-500)">${formatDate(p.createdAt)}  ${p.type || 'General'}</div>
          </div>
        </div>
        <span class="badge ${hasReply ? 'badge-green' : 'badge-yellow'}">${hasReply ? 'Replied' : 'Pending'}</span>
      </div>
      <p style="font-size:.85rem;margin-bottom:12px;padding:10px;background:var(--gray-50);border-radius:8px">${p.desc}</p>
      ${hasReply
        ? `<div style="padding:10px;background:#fff0f2;border-radius:8px;border-left:3px solid var(--primary);font-size:.85rem"><strong>🚗 Admin Reply:</strong> ${p.adminReply}
           <button class="btn btn-ghost btn-sm" style="float:right;font-size:.72rem" onclick="editStaffReply('${p.id}')">Edit</button></div>`
        : `<div style="display:flex;gap:8px;margin-top:8px">
             <input class="form-control" id="sreply-${p.id}" placeholder="Reply to this staff member" style="flex:1;font-size:.85rem">
             <button class="btn btn-primary btn-sm" onclick="sendStaffReply('${p.id}')">Reply</button>
           </div>`}
    </div>`;
  }).join('');
}

window.sendStaffReply = (id) => {
  const input = document.getElementById('sreply-' + id);
  const reply = input ? input.value.trim() : '';
  if (!reply) { showToast('Please type a reply first.', 'error'); return; }
  const problems = JSON.parse(localStorage.getItem('as_staff_issues') || '[]');
  const p = problems.find(x => x.id === id); if (!p) return;
  p.adminReply = reply; p.repliedAt = new Date().toISOString();
  localStorage.setItem('as_staff_issues', JSON.stringify(problems));
  notify({ userId: p.staffId, message: `Admin replied to your report: "${reply.slice(0, 60)}"`, type: 'info', icon: '🚗' });
  showToast('Reply sent to staff!', 'success');
  renderStaffProblems();
};

window.editStaffReply = (id) => {
  const problems = JSON.parse(localStorage.getItem('as_staff_issues') || '[]');
  const p = problems.find(x => x.id === id); if (!p) return;
  p.adminReply = '';
  localStorage.setItem('as_staff_issues', JSON.stringify(problems));
  renderStaffProblems();
};

// --- CONTACT US MESSAGES --------------------------------------
function getContactMsgs() { return JSON.parse(localStorage.getItem('as_contact_msgs') || '[]'); }
function saveContactMsgs(msgs) { localStorage.setItem('as_contact_msgs', JSON.stringify(msgs)); }

function renderContactMsgs() {
  const el = document.getElementById('contact-msgs-list');
  if (!el) return;
  const msgs = [...getContactMsgs()].reverse();
  if (!msgs.length) { el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔧</div><p>No contact messages yet.</p></div>'; return; }
  el.innerHTML = msgs.map(m => {
    const hasReply = m.adminReply && m.adminReply.trim();
    return `<div style="padding:18px;margin-bottom:12px;border:1px solid var(--gray-100);border-radius:10px;background:#fff;${m.status === 'unread' ? 'border-left:3px solid var(--primary);' : ''}">
      <div class="flex-between mb-8">
        <div class="flex-gap">
          <div class="nav-avatar" style="width:36px;height:36px;font-size:.8rem;background:var(--primary);color:#fff">${m.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;font-size:.88rem">${m.name} ${m.status === 'unread' ? '<span class="badge badge-red" style="font-size:.65rem">New</span>' : ''}</div>
            <div style="font-size:.72rem;color:var(--gray-500)">${m.email}${m.phone ? '  ' + m.phone : ''}  ${formatDate(m.createdAt)}</div>
          </div>
        </div>
        <span class="badge badge-yellow">${m.subject}</span>
      </div>
      <p style="font-size:.85rem;margin-bottom:10px;padding:10px;background:var(--gray-50);border-radius:8px">${m.msg}</p>
      ${hasReply
        ? `<div style="padding:10px;background:#fff0f2;border-radius:8px;border-left:3px solid var(--primary);font-size:.85rem">
             <strong>🚗 Admin Reply:</strong> ${m.adminReply}
             <button class="btn btn-ghost btn-sm" style="float:right;font-size:.72rem" onclick="editContactReply('${m.id}')">Edit</button>
           </div>`
        : `<div style="display:flex;gap:8px;margin-top:8px">
             <input class="form-control" id="creply-${m.id}" placeholder="Type your reply" style="flex:1;font-size:.85rem">
             <button class="btn btn-primary btn-sm" onclick="sendContactReply('${m.id}')">Reply</button>
             <button class="btn btn-ghost btn-sm" onclick="markContactRead('${m.id}')">Mark Read</button>
           </div>`}
    </div>`;
  }).join('');
}

window.sendContactReply = (id) => {
  const input = document.getElementById('creply-' + id);
  const reply = input ? input.value.trim() : '';
  if (!reply) { showToast('Please type a reply first.', 'error'); return; }
  const msgs = getContactMsgs();
  const m = msgs.find(x => x.id === id); if (!m) return;
  m.adminReply = reply; m.status = 'replied'; m.repliedAt = new Date().toISOString();
  saveContactMsgs(msgs);
  if (m.userId && typeof notify === 'function') {
    notify({ userId: m.userId, message: `Admin replied to your contact message: "${reply.slice(0, 60)}"`, type: 'info', icon: '🚗' });
  }
  showToast('Reply sent to customer!', 'success');
  renderContactMsgs();
};

window.markContactRead = (id) => {
  const msgs = getContactMsgs();
  const m = msgs.find(x => x.id === id); if (!m) return;
  m.status = 'read'; saveContactMsgs(msgs); renderContactMsgs();
};

window.editContactReply = (id) => {
  const msgs = getContactMsgs();
  const m = msgs.find(x => x.id === id); if (!m) return;
  m.adminReply = ''; m.status = 'unread'; saveContactMsgs(msgs); renderContactMsgs();
};
