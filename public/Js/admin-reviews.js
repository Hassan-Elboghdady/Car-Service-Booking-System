// admin-reviews.js
let rvFilter = 'all';
let rvPage = 1;
const rvLimit = 5;
let rvMeta = { page: 1, pages: 1, total: 0, limit: rvLimit };

window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();
  await renderStats();
  await renderReviews();
  await renderReports();
  await renderStaffProblems();
  await renderContactMsgs();

  document.querySelectorAll('[data-rv]').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('[data-rv]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rvFilter = btn.dataset.rv;
      rvPage = 1;
      await renderReviews();
    });
  });
});

// --- STATS ----------------------------------------------------
async function renderStats() {
  const revs = await reviewsAPI.getAll();
  let rpts = [];
  try {
    const res = await api.get('/reports');
    rpts = res.data || [];
  } catch (e) {
    rpts = [];
  }
  const avg  = revs.length ? (revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1) : '';
  document.getElementById('rv-stats').innerHTML = [
    { l: 'Total Reviews', v: revs.length,                                        i: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>', c: 'yellow' },
    { l: 'Approved',      v: revs.filter(r => r.status === 'approved').length,   i: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>', c: 'green'  },
    { l: 'Avg Rating',    v: avg + '/5',                                          i: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;fill:currentColor;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>', c: 'blue'   },
    { l: 'Open Reports',  v: rpts.filter(r => r.status !== 'resolved').length,       i: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>', c: 'red'    },
  ].map(s => `<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
}

// --- CUSTOMER REVIEWS -----------------------------------------
async function renderReviews() {
  const response = await reviewsAPI.getPage(rvPage, rvLimit);
  let revs = response.data || [];
  rvMeta = response.meta || rvMeta;
  if (rvFilter !== 'all') revs = revs.filter(r => rvFilter === 'approved' ? r.status === 'approved' : r.status !== 'approved');
  const el = document.getElementById('rv-list');
  const pager = document.getElementById('rv-pager');
  if (!el) return;
  if (!revs.length) {
    el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔧</div><p>No reviews yet.</p></div>';
    if (pager) pager.innerHTML = '';
    return;
  }
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

  if (pager) {
    pager.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px">
        <div style="font-size:.82rem;color:var(--gray-500)">Page ${rvMeta.page || rvPage} of ${rvMeta.pages || 1} · ${rvMeta.total || 0} total reviews</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" ${rvPage <= 1 ? 'disabled' : ''} onclick="changeReviewPage(${rvPage - 1})">Previous</button>
          <button class="btn btn-ghost btn-sm" ${rvPage >= (rvMeta.pages || 1) ? 'disabled' : ''} onclick="changeReviewPage(${rvPage + 1})">Next</button>
        </div>
      </div>`;
  }
}

window.changeReviewPage = async (page) => {
  const nextPage = Math.max(1, page);
  if (nextPage === rvPage) return;
  rvPage = nextPage;
  await renderReviews();
};

window.approveReview = async (id) => {
  await reviewsAPI.updateStatus(id, 'approved');
  await renderStats(); await renderReviews(); showToast('Review approved!', 'success');
};
window.removeReview = async (id) => {
  if (!confirm('Remove this review?')) return;
  await reviewsAPI.remove(id);
  await renderStats(); await renderReviews(); showToast('Review removed.', 'success');
};

// --- HELPER FOR THREADS ---------------------------------------
function renderAdminThread(item, type) {
  const replies = item.replies || [];
  let allReplies = [...replies];
  if (allReplies.length === 0 && item.adminReply && item.adminReply.trim()) {
    allReplies.push({
      senderRole: 'admin',
      senderName: 'Admin',
      text: item.adminReply,
      createdAt: item.repliedAt || item.updatedAt || new Date()
    });
  }

  const threadHtml = allReplies.map(reply => {
    const isAdmin = reply.senderRole === 'admin';
    return `
      <div style="margin-top:6px;padding:8px;background:${isAdmin ? '#fff0f2' : '#f0f4f8'};border-radius:6px;border-left:3px solid ${isAdmin ? 'var(--primary)' : 'var(--info)'};font-size:.78rem">
        <strong>🚗 ${reply.senderName} (${reply.senderRole}):</strong> ${reply.text}
        <div style="font-size:.65rem;color:var(--gray-400);margin-top:2px">${formatDate(reply.createdAt)}</div>
      </div>
    `;
  }).join('');

  return `
    <div style="margin-top:10px;padding:10px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-100)">
      ${threadHtml}
      <div style="display:flex;gap:8px;margin-top:8px">
        <input class="form-control form-control-sm" id="reply-input-${type}-${item._id}" placeholder="Type message to reply..." style="flex:1;font-size:.78rem;padding:4px 8px;height:auto">
        <button class="btn btn-primary btn-sm" onclick="sendAdminThreadReply('${item._id}', '${type}')" style="padding:4px 8px;font-size:.78rem">Reply</button>
        ${type === 'contact' && !allReplies.length ? `<button class="btn btn-ghost btn-sm" onclick="markContactRead('${item._id}')" style="padding:4px 8px;font-size:.78rem">Mark Read</button>` : ''}
      </div>
    </div>
  `;
}

window.sendAdminThreadReply = async (id, type) => {
  const input = document.getElementById(`reply-input-${type}-${id}`);
  const reply = input ? input.value.trim() : '';
  if (!reply) { showToast('Please type a reply first.', 'error'); return; }
  try {
    if (type === 'report') {
      await api.put(`/reports/${id}/reply`, { reply });
      showToast('Reply sent to customer!', 'success');
      await renderStats(); await renderReports();
    } else if (type === 'issue') {
      await api.put(`/issues/${id}/reply`, { reply });
      showToast('Reply sent to staff!', 'success');
      await renderStaffProblems();
    } else if (type === 'contact') {
      await api.post(`/contact/${id}/reply`, { reply });
      showToast('Reply sent to customer!', 'success');
      await renderContactMsgs();
    }
  } catch (e) {
    showToast(e.message || 'Failed to send reply', 'error');
  }
};

// --- CUSTOMER REPORTS -----------------------------------------
async function renderReports() {
  const el = document.getElementById('reports-list');
  if (!el) return;
  let rpts = [];
  try {
    const res = await api.get('/reports');
    rpts = res.data || [];
  } catch (e) {
    rpts = [];
  }
  if (!rpts.length) { el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔧</div><p>No reports yet.</p></div>'; return; }
  el.innerHTML = rpts.map(r => {
    return `<div style="padding:18px;margin-bottom:12px;border:1px solid var(--gray-100);border-radius:10px;background:#fff">
      <div class="flex-between mb-8">
        <div class="flex-gap">
          <div class="nav-avatar" style="width:36px;height:36px;font-size:.8rem;background:var(--warning)">${(r.customerName || 'U').charAt(0)}</div>
          <div>
            <div style="font-weight:600;font-size:.88rem">${r.customerName || ''} <span style="font-weight:400;font-size:.75rem;color:var(--gray-500)">(${r.email || ''})</span></div>
            <div style="font-size:.72rem;color:var(--gray-500)">${formatDate(r.createdAt)} | Subject: <strong>${r.subject || ''}</strong></div>
          </div>
        </div>
        <div class="flex-gap">
          <span class="badge badge-yellow">${r.category || r.type || ''}</span>
          <select class="form-control form-control-sm" style="width:110px;font-size:.75rem;padding:2px 6px;height:auto;margin-left:8px" onchange="updateReportStatus('${r._id}', this.value)">
            <option value="pending" ${r.status==='pending'?'selected':''}>Pending</option>
            <option value="in_progress" ${r.status==='in_progress'?'selected':''}>In Progress</option>
            <option value="resolved" ${r.status==='resolved'?'selected':''}>Resolved</option>
          </select>
          <button class="btn btn-danger btn-sm" onclick="deleteReport('${r._id}')" style="padding:2px 6px;font-size:.72rem;margin-left:8px">Delete</button>
        </div>
      </div>
      <p style="font-size:.85rem;margin-bottom:12px;padding:10px;background:var(--gray-50);border-radius:8px">${r.desc}</p>
      ${renderAdminThread(r, 'report')}
    </div>`;
  }).join('');
}

window.updateReportStatus = async (id, status) => {
  try {
    await api.put(`/reports/${id}/status`, { status });
    showToast('Report status updated.', 'success');
    await renderReports();
  } catch (e) {
    showToast(e.message || 'Failed to update status', 'error');
  }
};

window.deleteReport = async (id) => {
  if (!confirm('Delete this report?')) return;
  try {
    await api.request(`/reports/${id}`, { method: 'DELETE' });
    showToast('Report deleted successfully.', 'success');
    await renderReports();
  } catch (e) {
    showToast(e.message || 'Failed to delete report', 'error');
  }
};

// --- STAFF PROBLEMS -------------------------------------------
async function renderStaffProblems() {
  const el = document.getElementById('staff-problems-list');
  if (!el) return;
  let problems = [];
  try {
    const res = await api.get('/issues/all');
    problems = res.data || [];
  } catch (e) {
    problems = [];
  }
  if (!problems.length) { el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔧</div><p>No staff reports yet.</p></div>'; return; }
  el.innerHTML = problems.map(p => {
    const staff = p.staffId || {};
    return `<div style="padding:18px;margin-bottom:12px;border:1px solid var(--gray-100);border-radius:10px;background:#fff;border-left:3px solid var(--warning)">
      <div class="flex-between mb-8">
        <div class="flex-gap">
          <div class="nav-avatar" style="width:36px;height:36px;font-size:.8rem;background:var(--warning)">${(staff.firstName || 'S').charAt(0)}</div>
          <div>
            <div style="font-weight:600;font-size:.88rem">🚗 ${staff.firstName || ''} ${staff.lastName || ''} <span style="font-size:.72rem;color:var(--gray-400)">(Staff ID: ${staff.email || ''})</span></div>
            <div style="font-size:.72rem;color:var(--gray-500)">${formatDate(p.createdAt)} | Title: <strong>${p.type || 'General'}</strong></div>
          </div>
        </div>
        <select class="form-control form-control-sm" style="width:110px;font-size:.75rem;padding:2px 6px;height:auto" onchange="updateStaffProblemStatus('${p._id}', this.value)">
          <option value="pending" ${p.status==='pending'?'selected':''}>Pending</option>
          <option value="in_progress" ${p.status==='in_progress'?'selected':''}>In Progress</option>
          <option value="resolved" ${p.status==='resolved'?'selected':''}>Resolved</option>
        </select>
      </div>
      <p style="font-size:.85rem;margin-bottom:12px;padding:10px;background:var(--gray-50);border-radius:8px">${p.desc}</p>
      ${renderAdminThread(p, 'issue')}
    </div>`;
  }).join('');
}

window.updateStaffProblemStatus = async (id, status) => {
  try {
    await api.put(`/issues/${id}/status`, { status });
    showToast('Staff problem status updated.', 'success');
    await renderStaffProblems();
  } catch (e) {
    showToast(e.message || 'Failed to update status', 'error');
  }
};

// --- CONTACT US MESSAGES --------------------------------------
async function renderContactMsgs() {
  const el = document.getElementById('contact-msgs-list');
  if (!el) return;
  let msgs = [];
  try {
    const res = await api.get('/contact');
    msgs = res.data || [];
  } catch (e) {
    msgs = [];
  }
  if (!msgs.length) { el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔧</div><p>No contact messages yet.</p></div>'; return; }
  el.innerHTML = msgs.map(m => {
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
      ${renderAdminThread(m, 'contact')}
    </div>`;
  }).join('');
}

window.markContactRead = async (id) => {
  try {
    await api.request(`/contact/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'read' }), headers: { 'Content-Type': 'application/json' } });
    await renderContactMsgs();
  } catch(e) { showToast(e.message || 'Failed to update status', 'error'); }
};
