// tracker.js
const TRACKER_STEPS = [
  { id:'received',    label:'Booking Received',   desc:'Your booking has been confirmed in our system.',    icon:'✅' },
  { id:'inspected',   label:'Vehicle Inspected',   desc:'Our technician has inspected your vehicle.',         icon:'✅' },
  { id:'in_service',  label:'Service In Progress', desc:'Your car is currently being serviced.',              icon:'✅' },
  { id:'qc',          label:'Quality Check',       desc:'Final quality control and inspection complete.',     icon:'📋' },
  { id:'ready',       label:'Ready for Pickup',    desc:'Your vehicle is ready! Come collect it.',           icon:'✅' },
];

function getStepIndex(status) {
  const map = { pending:1, in_progress:3, completed:5, cancelled:0 };
  return map[status] || 0;
}

window.addEventListener('DOMContentLoaded', async () => {
  const user = auth.current();
  if (!user) { showAuthGuard('tracker-auth-guard','Login to track your service status.'); return; }
  if ((user.role === 'staff' || user.userType === 'staff') && user.role !== 'admin') {
    showToast('Staff cannot access customer tracker. Use the Staff Portal.', 'warning');
    setTimeout(() => location.href = 'staff-dashboard.ejs', 1000);
    return;
  }
  document.getElementById('tracker-content').style.display = 'block';

  const userBookings = await bookingsAPI.forUser(user.id);

  const sel = document.getElementById('booking-selector');
  userBookings.forEach(b => {
    const o = document.createElement('option');
    o.value = b.id;
    o.textContent = `${b.service?.name||''}  ${formatDate(b.date)} (${(STATUS[b.status]||{}).label||b.status})`;
    sel.appendChild(o);
  });

  // Pre-select from URL param
  const params = new URLSearchParams(location.search);
  const paramId = params.get('id');
  if (paramId) { sel.value = paramId; loadTracker(paramId, userBookings); }

  sel.addEventListener('change', () => {
    if (sel.value) loadTracker(sel.value, userBookings);
    else { document.getElementById('tracker-panel').style.display='none'; document.getElementById('tracker-empty').style.display='block'; }
  });
});

function loadTracker(id, bookings) {
  const b = bookings.find(x=>x.id===id); if(!b) return;
  document.getElementById('tracker-panel').style.display = 'block';
  document.getElementById('tracker-empty').style.display = 'none';

  // Badge
  document.getElementById('tracker-status-badge').innerHTML = statusBadge(b.status);

  // Steps
  const stepIdx = getStepIndex(b.status);
  const stepsEl = document.getElementById('tracker-steps');
  stepsEl.innerHTML = TRACKER_STEPS.map((s, i) => {
    const idx  = i + 1;
    const done   = idx < stepIdx;
    const active = idx === stepIdx;
    const cls    = done ? 'done' : active ? 'active' : '';
    const timeStr= done||active ? getStepTime(b, idx) : '';
    return `
      <div class="tracker-step ${cls}">
        <div class="ts-left">
          <div class="ts-circle">
            ${done ? '' : `<span class="ts-icon">${s.icon}</span>`}
          </div>
          ${i < TRACKER_STEPS.length-1 ? '<div class="ts-line"></div>' : ''}
        </div>
        <div class="ts-body">
          <h4>${s.label}</h4>
          <p>${s.desc}</p>
          ${timeStr?`<div class="ts-time">⏱️ ${timeStr}</div>`:''}
        </div>
      </div>`;
  }).join('');

  // Info panel
  document.getElementById('tracker-info').innerHTML = `
    <div class="tracker-info-row"><span class="ti-label">Vehicle</span><span>${b.car?.brand||''} ${b.car?.model||''}</span></div>
    <div class="tracker-info-row"><span class="ti-label">Plate</span><span>${b.car?.plate||''}</span></div>
    <div class="tracker-info-row"><span class="ti-label">Service</span><span>${b.service?.emoji||''} ${b.service?.name||''}</span></div>
    <div class="tracker-info-row"><span class="ti-label">Booked Date</span><span>${formatDate(b.date)}</span></div>
    <div class="tracker-info-row"><span class="ti-label">Time Slot</span><span>${b.time||''}</span></div>
    <div class="tracker-info-row"><span class="ti-label">Total</span><span style="font-weight:800;color:var(--primary)">EGP ${b.total||b.service?.price||''}</span></div>`;

  // Timeline
  const now = new Date();
  const events = [
    { dot:'green', text:`Booking created`, time: formatDate(b.createdAt) },
    { dot:'blue',  text:'Booking confirmed by AutoServe', time: formatDate(b.date) },
  ];
  if(b.status==='in_progress') events.push({ dot:'red', text:'Service started', time:'In progress' });
  if(b.status==='completed')   { events.push({ dot:'red', text:'Service started', time: formatDate(b.date) }); events.push({ dot:'green', text:'Service completed ✅', time: formatDate(b.date) }); }
  document.getElementById('tracker-timeline').innerHTML = events.map(e=>`
    <div class="tl-item">
      <div class="tl-dot ${e.dot}"></div>
      <div><div class="tl-text">${e.text}</div><div class="tl-time">${e.time}</div></div>
    </div>`).join('');
}

function getStepTime(b, idx) {
  if (idx===1) return formatDate(b.createdAt)||'';
  if (idx===2) return formatDate(b.date)||'';
  if (idx===3 && b.status==='in_progress') return 'Now in progress';
  if (idx>=4  && b.status==='completed')   return formatDate(b.date)||'';
  return '';
}
