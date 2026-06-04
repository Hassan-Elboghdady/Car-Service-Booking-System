// staff-schedule.js  Fixed time matching + mileage service names
'use strict';

const SCHED_MILEAGE = {
  'pkg-10k':'10k km Service','pkg-20k':'20k km Service','pkg-30k':'30k km Service',
  'pkg-40k':'40k km Service','pkg-50k':'50k km Service','pkg-60k':'60k Major',
  'pkg-70k':'70k km Service','pkg-80k':'80k km Service','pkg-90k':'90k km Service',
  'pkg-100k':'100k Overhaul',
};
function schedSvc(b) {
  if (b.service?.name) return `<span style="display:inline-flex;align-items:center;gap:8px">${renderServiceIconHtml(b.service,'1rem')} ${b.service.name.slice(0,16)}</span>`;
  const ids = b.serviceIds || (b.serviceId ? [b.serviceId] : []);
  const mId = ids.find(id => SCHED_MILEAGE[id]);
  if (mId) return `🛣️ ${SCHED_MILEAGE[mId]}`;
  return '🔧 Service';
}

window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('staff')) return;
  initSidebar();

  const dateEl = document.getElementById('sched-week');
  dateEl.value = todayStr();
  await render(todayStr());
  dateEl.addEventListener('change', async () => await render(dateEl.value));
});

async function render(anchor) {
  const user   = auth.current();
  const role   = (user?.staffRole || '').toLowerCase();

  // Manager sees ALL bookings; Mechanic sees only their own
  const allB   = await bookingsAPI.allWithDetails();
  const myJobs = role === 'manager'
    ? allB.filter(b => b.status !== 'cancelled')
    : allB.filter(b => b.assignedStaff === user.id);

  // Build week days starting Sunday
  const anc  = new Date(anchor + 'T00:00:00');
  const day  = anc.getDay();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(anc);
    d.setDate(anc.getDate() - day + i);
    days.push(d);
  }

  // Time slots in 24h format (stored format in booking)
  const HOUR_SLOTS = [
    '08:00','09:00','10:00','11:00','12:00',
    '13:00','14:00','15:00','16:00','17:00',
  ];
  // Display labels (12h format)
  const HOUR_LABELS = [
    '8 AM','9 AM','10 AM','11 AM','12 PM',
    '1 PM','2 PM','3 PM','4 PM','5 PM',
  ];

  const el = document.getElementById('week-schedule');

  // Helper: normalise stored time to HH:MM 24h
  function norm(t) {
    if (!t) return '';
    t = t.trim();
    // Already 24h like "10:00"
    if (/^\d{1,2}:\d{2}$/.test(t) && !t.match(/[APap]/)) {
      const [h, m] = t.split(':');
      return `${h.padStart(2,'0')}:${m}`;
    }
    // 12h format "10:00 AM" / "01:00 PM"
    const pm = /pm/i.test(t);
    const nums = t.replace(/[^0-9:]/g, '');
    let [h, m] = nums.split(':').map(Number);
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${String(m||0).padStart(2,'0')}`;
  }

  el.innerHTML = `
    <div style="overflow-x:auto">
      <table style="min-width:700px;border-collapse:collapse">
        <thead>
          <tr style="background:var(--gray-50)">
            <th style="width:64px;padding:10px 8px;font-size:.75rem;color:var(--gray-500)">Time</th>
            ${days.map(d => {
              const s       = d.toISOString().split('T')[0];
              const isToday = s === todayStr();
              return `<th style="padding:10px 8px;text-align:center;font-size:.78rem;${isToday?'background:var(--primary-bg);color:var(--primary);font-weight:800':''}">${d.toLocaleDateString('en-EG',{weekday:'short'})} <br> <span style="font-size:.72rem">${d.getDate()}</span></th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${HOUR_SLOTS.map((slot, idx) => `
            <tr style="border-top:1px solid var(--gray-100)">
              <td style="font-size:.73rem;color:var(--gray-400);font-weight:600;padding:6px 8px;vertical-align:top">${HOUR_LABELS[idx]}</td>
              ${days.map(d => {
                const ds = d.toISOString().split('T')[0];
                // Find all jobs on this day at this hour slot
                const jobs = myJobs.filter(j => {
                  if (j.date !== ds) return false;
                  const t = norm(j.time);
                  return t.startsWith(slot.slice(0,2));
                });
                return `<td style="height:52px;vertical-align:top;padding:3px;min-width:90px">
                  ${jobs.map(j => `
                    <div style="background:${j.status==='completed'?'var(--success)':j.status==='in_progress'?'#f97316':'var(--primary)'};color:#fff;border-radius:5px;padding:3px 6px;font-size:.68rem;margin-bottom:2px;cursor:default;line-height:1.3" title="${schedSvc(j)}">
                      ${schedSvc(j)}
                    </div>`).join('')}
                </td>`;
              }).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="display:flex;gap:16px;margin-top:16px;font-size:.78rem;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:6px"><div style="width:14px;height:14px;background:var(--primary);border-radius:3px"></div> Pending</div>
      <div style="display:flex;align-items:center;gap:6px"><div style="width:14px;height:14px;background:#f97316;border-radius:3px"></div> In Progress</div>
      <div style="display:flex;align-items:center;gap:6px"><div style="width:14px;height:14px;background:var(--success);border-radius:3px"></div> Completed</div>
      ${role === 'manager' ? '<span style="color:var(--gray-400);margin-left:auto">Showing all shop bookings</span>' : ''}
    </div>`;
}
