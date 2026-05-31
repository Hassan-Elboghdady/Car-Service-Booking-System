// my-bookings.js
'use strict';

let allUserBookings = [];
let activeFilter    = 'all';
let selectedStar    = 0;

// All known services (fetched once on load)
let allKnownServices = [];

window.addEventListener('DOMContentLoaded', async () => {
  const user = auth.current();
  if (!user) { showAuthGuard('bookings-auth-guard', 'Login to see and manage your bookings.'); return; }
  if ((user.role === 'staff' || user.userType === 'staff') && user.role !== 'admin') {
    showToast('Staff cannot access customer bookings. Use the Staff Portal.', 'warning');
    setTimeout(() => location.href = 'staff-dashboard.ejs', 1000);
    return;
  }

  // Pre-load services catalogue
  allKnownServices = getAllServices();

  document.getElementById('bookings-content').style.display = 'block';
  allUserBookings = await bookingsAPI.forUser(user.id);
  await renderBookings();

  document.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('[data-status]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.status;
      await renderBookings();
    });
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────

/** Resolve service names for a booking (supports serviceIds array + legacy serviceId) */
function resolveServices(b) {
  const ids = (b.serviceIds && b.serviceIds.length) ? b.serviceIds : (b.serviceId ? [b.serviceId] : []);
  return ids.map(id => allKnownServices.find(s => s.id === id)).filter(Boolean);
}

/** Check if booking is more than 9 hours away */
function isEditable(b) {
  if (b.status !== 'pending') return false;
  const timeStr = b.time || '08:00 AM';
  const [timePart, modifier] = timeStr.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  const bookingDT = new Date(`${b.date}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`);
  const hoursUntil = (bookingDT - Date.now()) / (1000 * 60 * 60);
  return hoursUntil > 9;
}

// ── Render ─────────────────────────────────────────────────────────────────

async function renderBookings() {
  const list = document.getElementById('bookings-list');
  const user = auth.current();
  let filtered = activeFilter === 'all' ? allUserBookings : allUserBookings.filter(b => b.status === activeFilter);

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔧</div><h3>No bookings found</h3>
      <p>${activeFilter === 'all' ? 'You have no bookings yet.' : 'No ' + activeFilter + ' bookings.'}</p>
      <a href="booking.ejs" class="btn btn-primary mt-16">Book Now</a></div>`;
    return;
  }

  const myReviews = (await reviewsAPI.getAll()).filter(r => (r.userId?._id || r.userId) === user.id);
  const allIssues = getAll(KEYS.ISSUES) || [];

  list.innerHTML = filtered.map(b => {
    const car     = b.car || {};
    const svcs    = resolveServices(b);
    const svc     = svcs[0] || b.service || {};           // fallback for display
    const multiSvc = svcs.length > 1;

    // Service title: all names joined, emoji only if single service
    const svcTitle = multiSvc
      ? svcs.map(s => s.name).join(', ')
      : `${svc.emoji || svc.icon || ''} ${svc.name || ''}`.trim();

    const alreadyReviewed = myReviews.some(r => r.bookingId === b.id);
    const report = allIssues.find(i => i.bookingId === b.id && i.userId === user.id);
    const canEdit = isEditable(b);

    const reportHtml = report ? `
      <div style="margin-top:10px;padding:10px;background:var(--gray-50);border-radius:8px;font-size:.8rem;border:1px solid var(--gray-100)">
        <strong>⚠️ Your Report (${report.type}):</strong> ${report.desc}
        ${report.adminReply
          ? `<div style="margin-top:6px;padding:8px;background:#fff0f2;border-radius:6px;border-left:3px solid var(--primary)"><strong>💬 Admin Reply:</strong> ${report.adminReply}</div>`
          : '<div style="color:var(--gray-400);margin-top:4px">⏳ Awaiting admin reply</div>'}
      </div>` : '';

    return `
      <div class="booking-card status-${b.status}">
        <div class="bk-top">
          <div class="bk-service">${svcTitle}</div>
          ${statusBadge(b.status)}
        </div>
        <div class="bk-meta">
          <span>${car.brand || ''} ${car.model || ''} (${car.year || ''})</span>
          <span>📅 ${formatDate(b.date)} at ${b.time || ''}</span>
          <span>💰 EGP ${b.total || svc.price || ''}</span>
        </div>
        ${reportHtml}
        <div class="bk-actions">
          <button class="btn btn-outline btn-sm" onclick="viewDetail('${b.id}')">Details</button>
          <a href="tracker.ejs?id=${b.id}" class="btn btn-ghost btn-sm">Track</a>
          ${canEdit
            ? `<button class="btn btn-primary btn-sm" onclick="openEditModal('${b.id}')">✏️ Edit</button>`
            : (b.status === 'pending' ? `<span style="font-size:.75rem;color:var(--gray-400)">Edit locked (≤9h)</span>` : '')}
          ${b.status === 'completed' && !alreadyReviewed
            ? `<button class="btn btn-primary btn-sm" onclick="openReviewModal('${b.id}')">⭐ Review</button>` : ''}
          ${b.status === 'completed' && alreadyReviewed
            ? `<span class="badge badge-green">✓ Reviewed</span>` : ''}
          ${b.status === 'pending'
            ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${b.id}')">Cancel</button>` : ''}
          ${!report && b.status !== 'cancelled'
            ? `<button class="btn btn-ghost btn-sm" onclick="openReportModal('${b.id}')">Report</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── EDIT MODAL ─────────────────────────────────────────────────────────────

window.openEditModal = (bookingId) => {
  const b = allUserBookings.find(x => x.id === bookingId);
  if (!b) return;

  const svcs = resolveServices(b);
  const currentSvcIds = svcs.map(s => s.id);
  const car = b.car || {};

  // Build service checkboxes instead of dropdown to allow multiple
  const svcCheckboxes = allKnownServices.map(s => {
    let price = s.price || 0;
    if (s.cat === 'mileage') price = getMileagePriceForCar(s.id, null, car) || 0;
    const isChecked = currentSvcIds.includes(s.id) ? 'checked' : '';
    return `
      <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;margin-bottom:6px">
        <input type="checkbox" class="edit-svc-cb" value="${s.id}" data-cat="${s.cat||''}" data-price="${price}" ${isChecked} />
        ${s.name} (EGP ${price})
      </label>
    `;
  }).join('');

  // Payment method options
  const pmOptions = ['Cash', 'Card (Visa/MC)', 'Bank Transfer', 'InstaPay'].map(pm => 
    `<option value="${pm}" ${b.paymentMethod === pm ? 'selected' : ''}>${pm}</option>`
  ).join('');

  // Tomorrow min date
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const el = document.getElementById('edit-modal-overlay');
  if (el) el.remove();

  const overlay = document.createElement('div');
  overlay.id = 'edit-modal-overlay';
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal" style="max-width:520px;max-height:90vh;display:flex;flex-direction:column">
      <div class="modal-header">
        <h3>✏️ Edit Booking</h3>
        <button class="modal-close" onclick="document.getElementById('edit-modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body" style="overflow-y:auto;flex:1">
        <p style="font-size:.82rem;color:var(--gray-400);margin-bottom:16px">
          You can edit this booking up to 9 hours before your appointment.
        </p>
        <div class="form-group">
          <label class="form-label">Services (Max 1 mileage package)</label>
          <div style="max-height:150px;overflow-y:auto;border:1px solid var(--gray-200);border-radius:6px;padding:8px">
            ${svcCheckboxes}
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input class="form-control" type="date" id="edit-date" value="${b.date}" min="${minDate}"/>
          </div>
          <div class="form-group">
            <label class="form-label">Time *</label>
            <select class="form-control" id="edit-time">
              ${['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM']
                .map(t => `<option ${t === b.time ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Payment Method</label>
          <select class="form-control" id="edit-payment">${pmOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-control" id="edit-notes" rows="3">${b.notes || ''}</textarea>
        </div>
        <div id="edit-alert"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="document.getElementById('edit-modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="submitEdit('${bookingId}')">Save Changes</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
};

window.submitEdit = async (bookingId) => {
  const alertEl = document.getElementById('edit-alert');
  const date    = document.getElementById('edit-date').value;
  const time    = document.getElementById('edit-time').value;
  const notes   = document.getElementById('edit-notes').value.trim();
  const paymentMethod = document.getElementById('edit-payment').value;
  
  // Get checked services
  const checked = Array.from(document.querySelectorAll('.edit-svc-cb:checked'));
  if (!checked.length) { alertEl.innerHTML = '<div class="alert alert-danger">Please select at least one service.</div>'; return; }
  
  // Check mileage constraint
  const mileageCount = checked.filter(cb => cb.dataset.cat === 'mileage').length;
  if (mileageCount > 1) { alertEl.innerHTML = '<div class="alert alert-danger">Only one mileage package allowed per booking.</div>'; return; }
  
  const svcIds = checked.map(cb => cb.value);
  const total = checked.reduce((sum, cb) => sum + parseFloat(cb.dataset.price), 0);
  
  if (!date) { alertEl.innerHTML = '<div class="alert alert-danger">Please select a date.</div>'; return; }
  if (!time) { alertEl.innerHTML = '<div class="alert alert-danger">Please select a time.</div>'; return; }

  try {
    const updated = await bookingsAPI.editBooking(bookingId, { date, time, serviceId: svcIds[0], serviceIds: svcIds, notes, total, paymentMethod });
    document.getElementById('edit-modal-overlay').remove();
    // Update local data
    const idx = allUserBookings.findIndex(x => x.id === bookingId);
    if (idx >= 0 && updated) {
      allUserBookings[idx] = { ...allUserBookings[idx], ...updated, serviceIds: svcIds, paymentMethod };
    }
    await renderBookings();
    showToast('Booking updated successfully! ✅', 'success');
  } catch (e) {
    alertEl.innerHTML = `<div class="alert alert-danger">${e?.data?.message || e.message || 'Could not save changes.'}</div>`;
  }
};

// ── REVIEW MODAL ────────────────────────────────────────────────────────────

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
        <button class="modal-close" onclick="document.getElementById('review-modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:.88rem;color:var(--gray-500);margin-bottom:16px">How was your experience?</p>
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
    s.textContent  = v <= n ? '★' : '☆';
    s.style.color  = v <= n ? '#fbbf24' : 'var(--gray-300)';
    s.style.transform = v <= n ? 'scale(1.1)' : 'scale(1)';
  });
};

window.submitReview = async (bookingId) => {
  const text    = document.getElementById('review-text').value.trim();
  const alertEl = document.getElementById('review-alert');
  if (!selectedStar) { alertEl.innerHTML='<div class="alert alert-danger">Please select a star rating.</div>'; return; }
  if (!text)         { alertEl.innerHTML='<div class="alert alert-danger">Please write a short review.</div>'; return; }
  const user = auth.current();
  try {
    await reviewsAPI.add({ bookingId, rating: selectedStar, text });
    notify({ message: `New review from ${user.firstName} — ${selectedStar}⭐`, type: 'info', icon: '📋' });
    document.getElementById('review-modal-overlay').remove();
    selectedStar = 0;
    showToast('Review submitted! Thank you 🎉', 'success');
    allUserBookings = await bookingsAPI.forUser(user.id);
    await renderBookings();
  } catch(e) {
    alertEl.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
  }
};

// ── REPORT MODAL ────────────────────────────────────────────────────────────

window.openReportModal = (bookingId) => {
  const el = document.getElementById('report-modal-overlay');
  if (el) el.remove();
  const overlay = document.createElement('div');
  overlay.id = 'report-modal-overlay';
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <h3>⚠️ Report an Issue</h3>
        <button class="modal-close" onclick="document.getElementById('report-modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:.88rem;color:var(--gray-500);margin-bottom:16px">Describe your issue and the admin will reply soon.</p>
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
  const issues = getAll(KEYS.ISSUES) || [];
  issues.push({ id: genId('iss'), userId: user.id, bookingId, type, desc, status: 'open', adminReply: '', createdAt: new Date().toISOString() });
  saveAll(KEYS.ISSUES, issues);
  notify({ message: `Customer ${user.firstName} reported: ${type}`, type: 'warning', icon: '⚠️' });
  document.getElementById('report-modal-overlay').remove();
  showToast('Issue reported! Admin will reply soon.', 'success');
  allUserBookings = await bookingsAPI.forUser(user.id);
  await renderBookings();
};

// ── DETAIL MODAL ────────────────────────────────────────────────────────────

window.viewDetail = (id) => {
  const b = allUserBookings.find(x => x.id === id);
  if (!b) return;
  const car  = b.car || {};
  const svcs = resolveServices(b);
  const svc  = svcs[0] || b.service || {};

  const svcRows = svcs.length
    ? svcs.map(s => `<div style="font-weight:600">${s.emoji || ''} ${s.name}</div>`).join('')
    : `<div style="font-weight:600">${svc.name || '—'}</div>`;

  document.getElementById('detail-modal-body').innerHTML = `
    <div style="background:linear-gradient(135deg,var(--primary),var(--primary-dark));border-radius:var(--radius-sm);padding:20px;color:#fff;margin-bottom:20px">
      <div style="font-size:1.1rem;font-weight:700">${svcs.length > 1 ? svcs.map(s=>s.name).join(' + ') : (svc.name || '')}</div>
      <div style="opacity:.8;font-size:.85rem">Booking #${b.id.slice(-8)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Vehicle</div><div style="font-weight:600">${car.brand || ''} ${car.model || ''} ${car.year || ''}</div></div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">License Plate</div><div style="font-weight:600">${car.plate || ''}</div></div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Service(s)</div>${svcRows}</div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Date</div><div style="font-weight:600">${formatDate(b.date)}</div></div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Time</div><div style="font-weight:600">${b.time || ''}</div></div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Status</div>${statusBadge(b.status)}</div>
      <div><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Payment Method</div><div style="font-weight:600">${b.paymentMethod || 'Cash'}</div></div>
      <div style="grid-column:1/-1"><div style="font-size:.75rem;color:var(--gray-400);margin-bottom:3px">Total</div><div style="font-weight:800;color:var(--primary)">EGP ${b.total || svc.price || ''}</div></div>
    </div>
    ${b.notes ? `<div class="divider"></div><div style="font-size:.85rem"><strong>Notes:</strong> ${b.notes}</div>` : ''}`;
  document.getElementById('detail-track-btn').href = `tracker.ejs?id=${b.id}`;
  openModal('detail-modal');
};

// ── CANCEL ──────────────────────────────────────────────────────────────────

window.cancelBooking = async (id) => {
  if (!confirm('Cancel this booking?')) return;
  await bookingsAPI.updateStatus(id, 'cancelled');
  const b = allUserBookings.find(x => x.id === id);
  if (b) b.status = 'cancelled';
  await renderBookings();
  showToast('Booking cancelled.', 'success');
};
