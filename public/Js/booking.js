
'use strict';
let currentStep = 1;
let booking = {
  carId: null,
  serviceIds: [],
  date: null,
  time: null,
  notes: null,
  total: 0,
};
let userCars = [];
let activeFilter = 'all';
window.addEventListener('DOMContentLoaded', async () => {
  const user = auth.current();
  if (!user) {
    showAuthGuard('booking-auth-guard', 'You need to login or register to book a service.');
    return;
  }
  if ((user.role === 'staff' || user.userType === 'staff') && user.role !== 'admin') {
    showToast('Staff cannot make bookings. Use the Staff Portal.', 'warning');
    setTimeout(() => location.href = 'staff-dashboard.ejs', 1000);
    return;
  }
  document.getElementById('booking-wizard').style.display = 'block';
  userCars = await carsAPI.forUser(user.id);
  const params = new URLSearchParams(location.search);
  if (params.get('service')) booking.serviceIds = [params.get('service')];
  if (params.get('car'))     booking.carId = params.get('car');
  renderStep1();
  renderStep2();
  setupStep3();
  setupNav();
  buildAddCarModal();
});
function renderStep1() {
  const el = document.getElementById('step1-cars');
  if (!userCars.length) {
    el.innerHTML = `<div class="empty-state" style="padding:32px"><div class="empty-icon">🔧</div><h3>No Vehicles Added</h3><p>Add your car below to continue booking.</p></div>`;
    return;
  }
  el.innerHTML = userCars.map(c => {
    const brandLogo = getBrandLogoHtml(c.brand, '44px');
    const carId = c._id || c.id;
    return `
    <div class="car-select-card ${carId===booking.carId?'selected':''}" onclick="selectCar('${carId}')">
      <div class="car-select-emoji">${brandLogo}</div>
      <div class="car-select-info">
        <h4>${c.brand} ${c.model} (${c.year})</h4>
        <p>${c.plate} | ${c.color}</p>
      </div>
      <div class="car-select-check">${carId===booking.carId?'✓':''}</div>
    </div>`;
  }).join('');
}
window.selectCar = (id) => {
  booking.carId = id;
  renderStep1();
  renderStep2(); 
  updateSidebar();
};
function renderStep2(filter) {
  if (filter !== undefined) activeFilter = filter;
  const searchQ = (document.getElementById('svc-search')?.value || '').toLowerCase();
  let svcs = getAllServices();
  if (activeFilter !== 'all') svcs = svcs.filter(s => s.cat === activeFilter);
  if (searchQ) svcs = svcs.filter(s => s.name.toLowerCase().includes(searchQ) || (s.desc||'').toLowerCase().includes(searchQ));
  const el = document.getElementById('step2-services');
  if (!el) return;
  el.innerHTML = svcs.map(s => {
    const sel = booking.serviceIds.includes(s.id);
    const isMileage = s.cat === 'mileage';
    let priceHtml = '';
    if (isMileage) {
      const price = getMileagePriceForCar(s.id);
      priceHtml = price
        ? `<div class="svc-select-price">EGP ${price.toLocaleString()}</div>`
        : `<div style="font-size:.75rem;color:var(--gray-500);font-style:italic">Select car first</div>`;
    } else {
      priceHtml = `<div class="svc-select-price">EGP ${s.price}</div>`;
    }
    return `
      <div class="svc-select-card ${sel?'selected':''} ${isMileage?'mileage-card':''}" onclick="toggleService('${s.id}')">
        <div class="svc-select-icon">${isMileage ? `<span style="font-size:2rem;line-height:1">${s.emoji||'🛣️'}</span>` : renderServiceIconHtml(s,'2rem')}</div>
        <div class="svc-select-info">
          <h4>${s.name} ${s.popular?'<span class="badge badge-red" style="font-size:.65rem">Popular</span>':''} ${isMileage&&sel?'<span class="badge badge-green" style="font-size:.65rem">✓ Selected</span>':''}</h4>
          <p>${s.desc?.slice(0,70)||''}  ${SVG_ICONS.clock} ${s.duration}</p>
          ${isMileage?'<p style="font-size:.7rem;color:var(--info,#3b82f6)">Only one mileage package may be selected</p>':''}
        </div>
        <div style="text-align:right;flex-shrink:0">
          ${priceHtml}
        </div>
      </div>`;
  }).join('') || '<p class="text-muted">No services found for this filter.</p>';
  document.querySelectorAll('.svc-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === activeFilter);
    if (!btn.hasAttribute('data-bound')) {
      btn.setAttribute('data-bound', '1');
      btn.addEventListener('click', () => renderStep2(btn.dataset.cat));
    }
  });
  const searchEl = document.getElementById('svc-search');
  if (searchEl && !searchEl.hasAttribute('data-bound')) {
    searchEl.setAttribute('data-bound', '1');
    searchEl.addEventListener('input', () => renderStep2());
  }
  updateSelectedCount();
}
window.toggleService = (id) => {
  const allSvcs = getAllServices();
  const svc = allSvcs.find(s => s.id === id);
  const isMileage = svc && svc.cat === 'mileage';
  if (isMileage) {
    const alreadySel = booking.serviceIds.includes(id);
    booking.serviceIds = booking.serviceIds.filter(sid => {
      const s = allSvcs.find(x => x.id === sid);
      return !s || s.cat !== 'mileage';
    });
    if (!alreadySel) booking.serviceIds.push(id);
  } else {
    const idx = booking.serviceIds.indexOf(id);
    if (idx >= 0) booking.serviceIds.splice(idx, 1);
    else booking.serviceIds.push(id);
  }
  renderStep2();
  updateSidebar();
};
window.clearServices = () => {
  booking.serviceIds = [];
  renderStep2();
  updateSidebar();
};
function updateSelectedCount() {
  const count = booking.serviceIds.length;
  const el = document.getElementById('svc-selected-count');
  const btn = document.getElementById('clear-svcs-btn');
  if (el) el.textContent = count ? `${count} service${count>1?'s':''} selected` : 'No services selected';
  if (btn) btn.style.display = count ? 'block' : 'none';
}
function setupStep3() {
  const dateEl = document.getElementById('bk-date');
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  dateEl.min = tomorrow.toISOString().split('T')[0];
  dateEl.addEventListener('change', () => { booking.date = dateEl.value; updateSidebar(); });
  document.getElementById('bk-time').addEventListener('change', e => { booking.time = e.target.value; updateSidebar(); });
  document.getElementById('bk-notes').addEventListener('input', e => { booking.notes = e.target.value; });
  document.getElementById('apply-coupon-btn')?.addEventListener('click', () => {
    const code = document.getElementById('bk-coupon').value.trim().toUpperCase();
    const couponEl = document.getElementById('coupon-result');
    const coupons = { 'SAVE20': 20, 'FIRST10': 10, 'AUTO50': 50 };
    const disc = coupons[code];
    if (disc) {
      booking.discount = disc;
      couponEl.innerHTML = `<div class="alert alert-success">✓ ${disc}% discount applied!</div>`;
      updateSidebar();
    } else {
      couponEl.innerHTML = `<div class="alert alert-danger">❌ Invalid coupon code.</div>`;
    }
  });
}
function setupNav() {
  document.getElementById('next-btn').addEventListener('click', nextStep);
  document.getElementById('prev-btn').addEventListener('click', prevStep);
}
async function nextStep() {
  if (currentStep === 1) {
    if (!booking.carId) { showToast('Please select your vehicle.', 'warning'); return; }
  } else if (currentStep === 2) {
    if (!booking.serviceIds.length) { showToast('Please select at least one service.', 'warning'); return; }
    const allSvcs = getAllServices();
    const hasMileage = booking.serviceIds.some(id => allSvcs.find(s=>s.id===id)?.cat==='mileage');
    if (hasMileage && !booking.carId) { showToast('Please go back and select a car first to get mileage pricing.','warning'); return; }
  } else if (currentStep === 3) {
    if (!booking.date) { showToast('Please select a date.', 'warning'); return; }
    if (!booking.time) { showToast('Please select a time.', 'warning'); return; }
    const existingBookings = await bookingsAPI.forUser(auth.current()?.id || '');
    const duplicate = existingBookings.find(b =>
      b.date === booking.date && (b.status === 'pending' || b.status === 'in_progress')
    );
    if (duplicate) {
      showToast('You already have a booking on this date! Redirecting to My Bookings to edit it.', 'warning');
      setTimeout(() => location.href = 'my-bookings.ejs', 2000);
      return;
    }
    renderConfirm();
  } else if (currentStep === 4) {
    confirmBooking(); return;
  }
  goToStep(currentStep + 1);
}
function prevStep() { goToStep(currentStep - 1); }
function goToStep(n) {
  document.querySelectorAll('.wizard-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-' + n)?.classList.add('active');
  document.querySelectorAll('.wizard-step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.toggle('active', sn === n);
    s.classList.toggle('done', sn < n);
  });
  document.querySelectorAll('.wizard-connector').forEach((c, i) => c.classList.toggle('done', i < n - 1));
  currentStep = n;
  document.getElementById('prev-btn').style.display = n > 1 ? 'block' : 'none';
  document.getElementById('next-btn').textContent = n === 4 ? 'Confirm Booking' : 'Continue';
}
function renderConfirm() {
  const car = booking.carId ? userCars.find(c => (c._id || c.id) === booking.carId) : {};
  const allSvcs = getAllServices();
  const selectedSvcs = booking.serviceIds.map(id => allSvcs.find(s => s.id === id)).filter(Boolean);
  let subtotal = 0;
  const svcRows = selectedSvcs.map(s => {
    let price = s.price || 0;
    if (s.cat === 'mileage') {
      price = getMileagePriceForCar(s.id) || 0;
    }
    subtotal += price;
    return `<div class="sum-row" style="padding-left:12px"><span style="display:inline-flex;align-items:center;gap:8px">${renderServiceIconHtml(s,'1.2rem')} ${s.name}</span><span>EGP ${price.toLocaleString()}</span></div>`;
  }).join('');
  const discount = booking.discount ? Math.round(subtotal * booking.discount / 100) : 0;
  const total = subtotal - discount;
  booking.total = total;
  document.getElementById('step4-summary').innerHTML = `
    <div class="sum-row"><span>Vehicle</span><strong>${getBrandLogoHtml(car.brand)} ${car.brand||''} ${car.model||''} (${car.year||''})</strong></div>
    <div class="sum-row"><span>Plate / Color</span><strong>${car.plate||''}  ${car.color||''}</strong></div>
    <div class="divider"></div>
    <div class="sum-row"><span>Services (${selectedSvcs.length})</span><strong></strong></div>
    ${svcRows}
    <div class="divider"></div>
    <div class="sum-row"><span>Date & Time</span><strong>${formatDate(booking.date)} at ${booking.time}</strong></div>
    ${booking.notes?`<div class="sum-row"><span>Notes</span><strong>${booking.notes}</strong></div>`:''}
    <div class="divider"></div>
    <div class="sum-row"><span>Subtotal</span><strong>EGP ${subtotal.toLocaleString()}</strong></div>
    ${discount?`<div class="sum-row" style="color:var(--success)"><span>Discount (${booking.discount}%)</span><strong>-EGP ${discount}</strong></div>`:''}
    <div class="sum-row"><span class="sum-total">Total</span><span class="sum-total">EGP ${total.toLocaleString()}</span></div>`;
}
async function confirmBooking() {
  const allSvcs = getAllServices();
  const selectedSvcs = booking.serviceIds.map(id => allSvcs.find(s => s.id === id)).filter(Boolean);
  const car = booking.carId ? userCars.find(c => (c._id || c.id) === booking.carId) : null;
  const paymentMethod = document.getElementById('bk-payment').value;
  const firstB = await bookingsAPI.create({
    carId: booking.carId,
    serviceId: booking.serviceIds[0],
    serviceIds: booking.serviceIds,
    date: booking.date,
    time: booking.time,
    notes: booking.notes || '',
    total: booking.total,
    discount: booking.discount,
    paymentMethod,
  });
  if (!firstB) { showToast('Error creating booking. Please try again.', 'error'); return; }
  const receiptLines = selectedSvcs.map(s => {
    const price = s.cat === 'mileage' ? getMileagePriceForCar(s.id) : s.price;
    return `<tr><td>${s.name}</td><td style="text-align:right">EGP ${(price||0).toLocaleString()}</td></tr>`;
  }).join('');
  const receiptHTML = `
    <div id="print-receipt" style="max-width:520px;margin:0 auto;font-family:Poppins,sans-serif">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:1.4rem;font-weight:800;color:#e60023">AutoServe</div>
        <div style="font-size:.8rem;color:#666">Booking Receipt  ${new Date().toLocaleDateString('en-EG')}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:.88rem">
        <thead><tr style="border-bottom:2px solid #e60023">
          <th style="text-align:left;padding:6px 0">Service</th>
          <th style="text-align:right;padding:6px 0">Price</th>
        </tr></thead>
        <tbody style="color:#333">
          ${receiptLines}
        </tbody>
        <tfoot>
          <tr style="border-top:2px solid #e60023;font-weight:700">
            <td style="padding:8px 0">Total</td>
            <td style="text-align:right;color:#e60023">EGP ${booking.total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:18px;font-size:.78rem;color:#888">
        📅 ${formatDate(booking.date)} at ${booking.time} &nbsp;|&nbsp;
        🚙 ${car ? `${car.brand} ${car.model} (${car.year})` : ''} &nbsp;|&nbsp;
        🔢 Booking #${firstB.id.slice(-6).toUpperCase()} &nbsp;|&nbsp;
        💳 ${paymentMethod}
      </div>
      <div style="margin-top:12px;font-size:.75rem;color:#aaa;text-align:center">Thank you for choosing AutoServe  30-day service warranty included.</div>
    </div>`;
  document.getElementById('booking-wizard').innerHTML = `
    <div class="booking-success">
      <div class="success-icon">✅</div>
      <h2>Booking Confirmed!</h2>
      <p>You booked <strong>${selectedSvcs.length} service${selectedSvcs.length>1?'s':''}</strong> for <strong>${formatDate(booking.date)}</strong> at <strong>${booking.time}</strong>.</p>
      <p style="margin-top:8px;color:var(--success)">You earned <strong>10 loyalty points</strong> for this booking! 🎉</p>
      <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius-md);padding:24px;margin-top:28px;text-align:left">${receiptHTML}</div>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:28px">
        <a href="my-bookings.ejs" class="btn btn-primary btn-lg">View My Bookings</a>
        <a href="tracker.ejs?id=${firstB.id}" class="btn btn-outline btn-lg">Track Service</a>
        <button class="btn btn-ghost btn-lg" onclick="window.printReceipt()">🚗 Print Receipt</button>
      </div>
    </div>`;
  window.printReceipt = () => {
    const w = window.open('', '_blank', 'width=680,height=800');
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt  AutoServe</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>body{font-family:Poppins,sans-serif;padding:40px;max-width:560px;margin:auto}table{width:100%;border-collapse:collapse}th,td{padding:8px 4px}</style>
      </head><body>${document.getElementById('print-receipt').innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };
}
function updateSidebar() {
  const car = booking.carId ? userCars.find(c => (c._id || c.id) === booking.carId) : null;
  const allSvcs = getAllServices();
  const selectedSvcs = booking.serviceIds.map(id => allSvcs.find(s => s.id === id)).filter(Boolean);
  let subtotal = 0;
  selectedSvcs.forEach(s => {
    subtotal += s.cat === 'mileage' ? (getMileagePriceForCar(s.id)||0) : (s.price||0);
  });
  const discount = booking.discount ? Math.round(subtotal * booking.discount / 100) : 0;
  document.getElementById('sidebar-summary').innerHTML = `
    <div class="ss-item"><span class="ss-label">Vehicle</span><span>${car ? `${getBrandLogoHtml(car.brand, '18px')} ${car.brand} ${car.model} (${car.year})` : ''}</span></div>
    <div class="ss-item"><span class="ss-label">Services</span><span>${selectedSvcs.length ? selectedSvcs.map(s=>s.name).join(', ') : ''}</span></div>
    <div class="ss-item"><span class="ss-label">Date</span><span>${booking.date ? formatDate(booking.date) : ''}</span></div>
    <div class="ss-item"><span class="ss-label">Time</span><span>${booking.time || ''}</span></div>
    ${subtotal ? `<div class="ss-item"><span class="ss-label">Total</span><span style="font-weight:800;color:var(--primary)">EGP ${(subtotal-discount).toLocaleString()}</span></div>` : ''}`;
}
function abIsValidPlate(plate) {
  const cleaned = String(plate || '').replace(/\s+/g, '');
  if (!/^[\p{Script=Arabic}0-9]{1,7}$/u.test(cleaned)) return false;
  const letters = (cleaned.match(/\p{Script=Arabic}/gu) || []).length;
  const digits  = (cleaned.match(/[0-9]/g) || []).length;
  return letters <= 3 && digits <= 4;
}
function abExtractArabicLetters(s) {
  return (String(s).match(/\p{Script=Arabic}/gu) || []).slice(0, 3);
}
function abShowFieldErr(inputId, msg) {
  const alertEl = document.getElementById('ab-alert');
  const el = document.getElementById(inputId);
  if (el) {
    el.classList.add('is-invalid');
    let errDiv = el.parentElement.querySelector('.form-error');
    if (!errDiv) { errDiv = document.createElement('div'); errDiv.className = 'form-error'; el.parentElement.appendChild(errDiv); }
    errDiv.textContent = msg;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (alertEl) alertEl.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
}
function abClearErrors() {
  const alertEl = document.getElementById('ab-alert');
  if (alertEl) alertEl.innerHTML = '';
  ['ab-brand','ab-model','ab-year','ab-plate-numbers','ab-plate-letters','ab-color','ab-color-custom'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.classList.remove('is-invalid');
    const e = el.parentElement.querySelector('.form-error'); if (e) e.remove();
  });
}
function buildAddCarModal() {
  const bSel = document.getElementById('ab-brand');
  const mSel = document.getElementById('ab-model');
  const ySel = document.getElementById('ab-year');
  if (!bSel) return;
  Object.keys(CARS_DB).forEach(b => {
    const o = document.createElement('option'); o.value = b; o.textContent = b; bSel.appendChild(o);
  });
  bSel.addEventListener('change', () => {
    mSel.innerHTML = '<option value="">Select model…</option>';
    ySel.innerHTML = '<option value="">Select year…</option>';
    mSel.disabled = !bSel.value; ySel.disabled = true;
    Object.keys(CARS_DB[bSel.value]?.models || {}).forEach(m => {
      const o = document.createElement('option'); o.value = m; o.textContent = m; mSel.appendChild(o);
    });
  });
  mSel.addEventListener('change', () => {
    ySel.innerHTML = '<option value="">Select year…</option>'; ySel.disabled = !mSel.value;
    (CARS_DB[bSel.value]?.models[mSel.value] || []).slice().reverse().forEach(y => {
      const o = document.createElement('option'); o.value = y; o.textContent = y; ySel.appendChild(o);
    });
  });
  const plateNumEl = document.getElementById('ab-plate-numbers');
  const plateLetEl = document.getElementById('ab-plate-letters');
  const plateHidEl = document.getElementById('ab-plate');
  function formatAbPlateLetters() {
    if (!plateLetEl) return;
    const letters = abExtractArabicLetters(plateLetEl.value);
    plateLetEl.dataset.raw = letters.join('');
    plateLetEl.value = letters.join(' ');
  }
  function formatAbPlateNumbers() {
    if (!plateNumEl) return;
    plateNumEl.value = (plateNumEl.value || '').replace(/\D/g, '').slice(0, 4);
  }
  if (plateLetEl) {
    plateLetEl.addEventListener('input', formatAbPlateLetters);
    plateLetEl.addEventListener('paste', () => setTimeout(formatAbPlateLetters, 0));
  }
  if (plateNumEl) {
    plateNumEl.addEventListener('input', formatAbPlateNumbers);
    plateNumEl.addEventListener('paste', () => setTimeout(formatAbPlateNumbers, 0));
  }
  const colorSel = document.getElementById('ab-color');
  const colorCustomWrap = document.getElementById('ab-color-custom-wrap');
  const colorCustomInput = document.getElementById('ab-color-custom');
  colorSel?.addEventListener('change', () => {
    const showCustom = colorSel.value === 'Other';
    if (colorCustomWrap) colorCustomWrap.style.display = showCustom ? 'block' : 'none';
    if (!showCustom && colorCustomInput) colorCustomInput.value = '';
  });
  document.getElementById('add-car-from-booking')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('add-car-from-booking')) {
      abClearErrors();
    }
  });
  document.getElementById('ab-save')?.addEventListener('click', async () => {
    abClearErrors();
    const b = bSel.value;
    const m = mSel.value;
    const y = ySel.value;
    const plateNumbers = plateNumEl?.value.trim() || '';
    const plateLettersRaw = plateLetEl?.dataset?.raw || '';
    const plate = (plateLettersRaw + plateNumbers).trim();
    const color = colorSel?.value || '';
    const customColor = colorCustomInput?.value.trim() || '';
    if (!b) { abShowFieldErr('ab-brand', 'Please select your car brand.'); return; }
    if (!m) { abShowFieldErr('ab-model', 'Please select your car model.'); return; }
    if (!y) { abShowFieldErr('ab-year',  'Please select the car year.'); return; }
    if (!plateNumbers && !plateLettersRaw) { abShowFieldErr('ab-plate-numbers', 'Please enter your license plate.'); return; }
    if (!abIsValidPlate(plate)) { abShowFieldErr('ab-plate-numbers', 'License plate must use up to 3 Arabic letters and up to 4 digits.'); return; }
    if (!color) { abShowFieldErr('ab-color', 'Please select your car color.'); return; }
    if (color === 'Other' && !customColor) { abShowFieldErr('ab-color-custom', 'Please enter your custom color.'); return; }
    const finalColor = color === 'Other' ? customColor : color;
    const finalPlate = plate.replace(/\s+/g, '');
    const car = await carsAPI.add({
      brand: b, model: m, year: parseInt(y),
      plate: finalPlate, color: finalColor,
      emoji: CARS_DB[b]?.emoji || '🚗'
    });
    userCars = await carsAPI.forUser(auth.current()?.id || '');
    booking.carId = car._id || car.id;
    closeModal('add-car-from-booking');
    renderStep1(); renderStep2(); updateSidebar();
    showToast(`${b} ${m} (${y}) added!`, 'success');
  });
}
