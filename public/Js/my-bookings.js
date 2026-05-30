// my-bookings.js
let allUserBookings = [];
let activeFilter    = 'all';
let selectedStar    = 0;

window.addEventListener('DOMContentLoaded', async () => {
  const user = auth.current();
  if (!user) { showAuthGuard('bookings-auth-guard','Login to see and manage your bookings.'); return; }
  if ((user.role === 'staff' || user.userType === 'staff') && user.role !== 'admin') {
    showToast('Staff cannot access customer bookings. Use the Staff Portal.', 'warning');
    setTimeout(() => location.href = 'staff-dashboard.ejs', 1000);
    return;
  }
  document.getElementById('bookings-content').style.display = 'block';
  allUserBookings = await bookingsAPI.forUser(user.id);
  await renderBookings();
  document.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('[data-status]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.status;
      await renderBookings();
    });
  });
});



async function renderBookings() {
  const list = document.getElementById('bookings-list');
  const user = auth.current();
  let filtered = activeFilter==='all' ? allUserBookings : allUserBookings.filter(b=>b.status===activeFilter);
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔧</div><h3>No bookings found</h3>
      <p>${activeFilter==='all'?'You have no bookings yet.':'No '+activeFilter+' bookings.'}</p>
      <a href="booking.ejs" class="btn btn-primary mt-16">Book Now</a></div>`;
    return;
  }
  const myReviews = (await reviewsAPI.getAll()).filter(r=> (r.userId?._id || r.userId) === user.id);
  const allIssues = getAll(KEYS.ISSUES)||[];
  list.innerHTML = filtered.map(b => {
    const svc = b.service; const car = b.car;
    const alreadyReviewed = myReviews.some(r=>r.bookingId===b.id);
    const report = allIssues.find(i=>i.bookingId===b.id && i.userId===user.id);
    const reportHtml = report ? `
      <div style="margin-top:10px;padding:10px;background:var(--gray-50);border-radius:8px;font-size:.8rem;border:1px solid var(--gray-100)">
        <strong>🚗 Your Report (${report.type}):</strong> ${report.desc}
        ${report.adminReply
          ? `<div style="margin-top:6px;padding:8px;background:#fff0f2;border-radius:6px;border-left:3px solid var(--primary)"><strong>🚗 Admin Reply:</strong> ${report.adminReply}</div>`
          : '<div style="color:var(--gray-400);margin-top:4px">⏳ Awaiting admin reply</div>'}
      </div>` : '';
    return `
      <div class="booking-card status-${b.status}">
        <div class="bk-top">
          <div class="bk-service">${svc.emoji||svc.icon||''} ${svc.name||''}</div>
          ${statusBadge(b.status)}
        </div>
        <div class="bk-meta">
          <span>🚗 ${car.brand||''} ${car.model||''} (${car.year||''})</span>
          <span>🚗 ${formatDate(b.date)} at ${b.time||''}</span>
          <span>🚗 EGP ${b.total||svc.price||''}</span>
        </div>
        ${reportHtml}
        <div class="bk-actions">
          <button class="btn btn-outline btn-sm" onclick="viewDetail('${b.id}')">Details</button>
          <a href="tracker.ejs?id=${b.id}" class="btn btn-ghost btn-sm">Track 🚗</a>
          ${b.status==='completed' && !alreadyReviewed
            ? `<button class="btn btn-primary btn-sm" onclick="openReviewModal('${b.id}')">⭐ Leave Review</button>` : ''}
          ${b.status==='completed' && alreadyReviewed
            ? `<span class="badge badge-green">✓ Reviewed</span>` : ''}
          ${b.status==='pending'
            ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${b.id}')">Cancel</button>` : ''}
          ${!report && b.status!=='cancelled'
            ? `<button class="btn btn-ghost btn-sm" onclick="openReportModal('${b.id}')">🚗 Report</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

// --- REVIEW MODAL ----------------------------------------------
window.openReviewModal = (bookingId) => {
  const el = document.getElementById('review-modal-overlay');
  if (el) el.remove();
  selectedStar = 0;
  const overlay = document.createElement('div');
  overlay.id = 'review-modal-overlay';
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <h3>⭐ Leave a Review</h3>
        <button class="modal-close" onclick="document.getElementById('review-modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size:.88rem;color:var(--gray-500);margin-bottom:16px">How was your experience? Your review helps us improve.</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:20px" id="star-row">
          ${[1,2,3,4,5].map(n=>`<span data-star="${n}" style="font-size:2.4rem;cursor:pointer;transition:transform .15s" onclick="selectStar(${n})">★</span>`).join('')}
        </div>
        <div class="form-group">
          <textarea class="form-control" id="review-text" rows="3" placeholder="Tell us about your experience"></textarea>
        </div>
        <div id="review-alert"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="submitReview('${bookingId}')">Submit Review</button>
        <button class="btn btn-ghost" onclick="document.getElementById('review-modal-overlay').remove()">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
};

window.selectStar = (n) => {
  selectedStar = n;
  document.querySelectorAll('#star-row [data-star]').forEach(s => {
    const v = parseInt(s.dataset.star);
    s.textContent = v <= n ? '★' : '☆';
    s.style.color  = v <= n ? '#fbbf24' : 'var(--gray-300)';
    s.style.transform = v <= n ? 'scale(1.1)' : 'scale(1)';
  });
};

window.submitReview = async (bookingId) => {
  const text    = document.getElementById('review-text').value.trim();
  const alertEl = document.getElementById('review-alert');
  if (!selectedStar) { alertEl.innerHTML='<div class="alert alert-danger">Please select a star rating.</div>'; return; }
  if (!text)         { alertEl.innerHTML='<div class="alert alert-danger">Please write a short review.</div>'; return; }
  const user    = auth.current();
  try {
    await reviewsAPI.add({ bookingId, rating:selectedStar, text });
    notify({ message:`New review from ${user.firstName}  ${selectedStar}⭐`, type:'info', icon:'📋' });
    document.getElementById('review-modal-overlay').remove();
    selectedStar = 0;
    showToast('Review submitted! Thank you 🚗','success');
    allUserBookings = await bookingsAPI.forUser(user.id);
    await renderBookings();
  } catch(e) {
    alertEl.innerHTML=`<div class="alert alert-danger">${e.message}</div>`;
  }
};

// --- REPORT MODAL ----------------------------------------------
window.openReportModal = (bookingId) => {
  const el = document.getElementById('report-modal-overlay');
  if (el) el.remove();
  const overlay = document.createElement('div');
  overlay.id = 'report-modal-overlay';
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <h3>🚗 Report an Issue</h3>
        <button class="modal-close" onclick="document.getElementById('report-modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size:.88rem;color:var(--gray-500);margin-bottom:16px">Describe your issue and the admin will reply as soon as possible.</p>
        <div class="form-group">
          <label class="form-label">Issue Type</label>
          <select class="form-control" id="report-type">
            <option>Service Quality</option>
            <option>Wrong Service Done</option>
            <option>Damage to Vehicle</option>
            <option>Billing Issue</option>
            <option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <textarea class="form-control" id="report-desc" rows="3" placeholder="Describe the issue"></textarea>
        </div>
        <div id="report-alert"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="submitReport('${bookingId}')">Submit Report</button>
        <button class="btn btn-ghost" onclick="document.getElementById('report-modal-overlay').remove()">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
};

window.submitReport = async (bookingId) => {
  const desc    = document.getElementById('report-desc').value.trim();
  const type    = document.getElementById('report-type').value;
  const alertEl = document.getElementById('report-alert');
  if (!desc) { alertEl.innerHTML='<div class="alert alert-danger">Please describe the issue.</div>'; return; }
  const user   = auth.current();
  const issues = getAll(KEYS.ISSUES)||[];
  issues.push({ id:genId('iss'), userId:user.id, bookingId, type, desc, status:'open', adminReply:'', createdAt:new Date().toISOString() });
  saveAll(KEYS.ISSUES, issues);
  notify({ message:`Customer ${user.firstName} reported: ${type}`, type:'warning', icon:'✅' });
  document.getElementById('report-modal-overlay').remove();
  showToast('Issue reported! Admin will reply soon.','success');
  allUserBookings = await bookingsAPI.forUser(user.id);
  await renderBookings();
};

// --- DETAIL MODAL ----------------------------------------------
window.viewDetail = (id) => {
  const b = allUserBookings.find(x=>x.id===id); if(!b) return;
  const svc=b.service; const car=b.car;
  document.getElementById('detail-modal-body').innerHTML = `
    <div style="background:linear-gradient(135deg,var(--primary),var(--primary-dark));border-radius:var(--radius-sm);padding:20px;color:#fff;margin-bottom:20px">
      <div style="font-size:2rem">${svc.emoji||''}</div>
      <div style="font-size:1.1rem;font-weight:700;margin-top:8px">${svc.name||''}</div>
      <div style="opacity:.8;font-size:.85rem">Booking #${b.id.slice(-8)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Vehicle</div><div style="font-weight:600">${car.brand} ${car.model} ${car.year}</div></div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">License Plate</div><div style="font-weight:600">${car.plate}</div></div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Date</div><div style="font-weight:600">${formatDate(b.date)}</div></div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Time</div><div style="font-weight:600">${b.time||''}</div></div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Status</div>${statusBadge(b.status)}</div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Total</div><div style="font-weight:800;color:var(--primary)">EGP ${b.total||svc.price||''}</div></div>
    </div>
    ${b.notes?`<div class="divider"></div><div style="font-size:.85rem"><strong>Notes:</strong> ${b.notes}</div>`:''}`;
  document.getElementById('detail-track-btn').href = `tracker.ejs?id=${b.id}`;
  openModal('detail-modal');
};

window.cancelBooking = async (id) => {
  if (!confirm('Cancel this booking?')) return;
  await bookingsAPI.updateStatus(id, 'cancelled');
  const b = allUserBookings.find(x=>x.id===id); if(b) b.status='cancelled';
  await renderBookings();
  showToast('Booking cancelled.','success');
};
