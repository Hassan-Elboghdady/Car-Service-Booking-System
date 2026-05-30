// admin-bookings.js
let allB = [];
let bmFilter = 'all';
let bmSearch = '';

// --- Mileage package name lookup -----------------------------
const MILEAGE_NAMES = {
  'pkg-10k':'10,000 km Service','pkg-20k':'20,000 km Service','pkg-30k':'30,000 km Service',
  'pkg-40k':'40,000 km Service','pkg-50k':'50,000 km Service','pkg-60k':'60,000 km Major Service',
  'pkg-70k':'70,000 km Service','pkg-80k':'80,000 km Service','pkg-90k':'90,000 km Service',
  'pkg-100k':'100,000 km Overhaul',
};
function getServiceLabel(b) {
  if (b.service?.name) return `<span style="font-size:1.1rem;margin-right:4px;vertical-align:middle;display:inline-block">${SVG_ICONS.checkCircle}</span> ${b.service.name}`;
  const ids = b.serviceIds || (b.serviceId ? [b.serviceId] : []);
  const mId = ids.find(id => MILEAGE_NAMES[id]);
  if (mId) return `<span style="font-size:1.1rem;margin-right:4px;vertical-align:middle;display:inline-block">${SVG_ICONS.clock}</span> ${MILEAGE_NAMES[mId]}`;
  if (ids.length > 1) return `<span style="font-size:1.1rem;margin-right:4px;vertical-align:middle;display:inline-block">${SVG_ICONS.clipboard}</span> ${ids.length} Services`;
  return '';
}

window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();
  allB = await bookingsAPI.allWithDetails();
  renderStats(); renderTable();

  document.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-status]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      bmFilter = btn.dataset.status; renderTable();
    });
  });
  document.getElementById('bm-search').addEventListener('input', function() { bmSearch=this.value.toLowerCase(); renderTable(); });
});

function renderStats() {
  const c = {pending:0,in_progress:0,completed:0,cancelled:0};
  allB.forEach(b=>{if(c[b.status]!==undefined)c[b.status]++;});
  document.getElementById('bm-stats').innerHTML = [
    {l:'All Bookings', v:allB.length, i:SVG_ICONS.clipboard, c:'red'},
    {l:'Pending', v:c.pending, i:SVG_ICONS.clock, c:'yellow'},
    {l:'In Progress', v:c.in_progress, i:SVG_ICONS.clipboard, c:'blue'},
    {l:'Completed', v:c.completed, i:SVG_ICONS.checkCircle, c:'green'},
    {l:'Rejected', v:c.cancelled, i:SVG_ICONS.crossCircle, c:'red'},
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
}

function renderTable() {
  let data = allB;
  if (bmFilter!=='all') data = data.filter(b=>b.status===bmFilter);
  if (bmSearch) data = data.filter(b=>(b.user?.firstName+' '+b.user?.lastName+' '+b.car?.brand+' '+b.car?.model).toLowerCase().includes(bmSearch));
  document.getElementById('bm-count').textContent = `Showing ${data.length} of ${allB.length} bookings`;

  const staffList = getAll(KEYS.USERS).filter(u => u.role === 'staff' || u.userType === 'staff');

  document.getElementById('bm-tbody').innerHTML = data.map(b=>`
    <tr>
      <td><code style="font-size:.72rem;color:var(--gray-500)">${b.id.slice(-8)}</code></td>
      <td>${b.user?.firstName||''} ${b.user?.lastName||''}</td>
      <td>${getBrandLogoHtml(b.car?.brand)} <strong>${b.car?.brand||''}</strong> ${b.car?.model||''}</td>
      <td>${getServiceLabel(b)}</td>
      <td>${formatDate(b.date)}<br><small style="color:var(--gray-500)">${b.time||''}</small></td>
      <td style="font-weight:700;color:var(--primary)">EGP ${b.total||''}</td>
      <td>
        <select class="form-control" style="padding:5px 10px;font-size:.78rem;width:auto" onchange="assignStaff('${b.id}',this.value)">
          <option value="">Assign</option>
          ${staffList.map(u=>`<option value="${u.id}" ${b.assignedStaff===u.id?'selected':''}>${u.firstName} ${u.lastName}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="form-control" style="padding:5px 10px;font-size:.78rem;width:auto" onchange="updateStatus('${b.id}',this.value)">
          ${['pending','in_progress','completed','cancelled'].map(s=>`<option value="${s}" ${b.status===s?'selected':''}>${(STATUS[s]||{label:s}).label}</option>`).join('')}
        </select>
      </td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewDetail('${b.id}')">View</button>
        ${b.status !== 'cancelled' && b.status !== 'completed'
          ? `<button class="btn btn-danger btn-sm" style="margin-left:6px" onclick="rejectBooking('${b.id}')">Reject</button>`
          : ''}
        <button class="btn btn-danger btn-sm" style="margin-left:6px;background:var(--gray-700);border-color:var(--gray-700)" onclick="removeBooking('${b.id}')">Remove</button>
      </td>
    </tr>`).join('');
}

window.removeBooking = async (id) => {
  const b = allB.find(x=>x.id===id); if(!b) return;
  const customerName = `${b.user?.firstName||''} ${b.user?.lastName||''}`.trim();
  if (!confirm(`Permanently remove this booking for ${customerName || 'this customer'}? This cannot be undone.`)) return;
  await bookingsAPI.remove(id);
  allB = await bookingsAPI.allWithDetails();
  renderStats(); renderTable();
  showToast(`Booking removed permanently.`, 'success');
};

window.rejectBooking = async (id) => {
  const b = allB.find(x=>x.id===id); if(!b) return;
  const customerName = `${b.user?.firstName||''} ${b.user?.lastName||''}`.trim();
  if (!confirm(`Reject booking for ${customerName || 'this customer'}? This will set the status to Cancelled.`)) return;
  await bookingsAPI.updateStatus(id, 'cancelled');
  allB = await bookingsAPI.allWithDetails();
  renderStats(); renderTable();
  showToast(`Booking rejected for ${customerName || 'customer'}.`, 'warning');
};

window.updateStatus = async (id, status) => {
  await bookingsAPI.updateStatus(id, status);
  allB = await bookingsAPI.allWithDetails();
  renderTable(); showToast('Status updated','success');
};

window.assignStaff = async (id, staffId) => {
  await bookingsAPI.assignStaff(id, staffId);
  allB = await bookingsAPI.allWithDetails(); renderTable();
  showToast('Staff assigned','success');
};

window.viewDetail = (id) => {
  const b = allB.find(x=>x.id===id); if(!b) return;
  document.getElementById('bm-modal-body').innerHTML = `
    <div class="grid-2" style="gap:20px;margin-bottom:20px">
      <div>
        <h4 style="margin-bottom:12px">Customer</h4>
        <p><strong>${b.user?.firstName||''} ${b.user?.lastName||''}</strong></p>
        <p>${b.user?.email||''}</p>
        <p>${b.user?.phone||''}</p>
      </div>
      <div>
        <h4 style="margin-bottom:12px">Vehicle</h4>
        <p><strong>${getBrandLogoHtml(b.car?.brand)} ${b.car?.brand||''} ${b.car?.model||''} (${b.car?.year||''})</strong></p>
        <p>Plate: ${b.car?.plate||''}</p>
        <p>Color: ${b.car?.color||''}</p>
      </div>
    </div>
    <div class="grid-2" style="gap:20px">
      <div>
        <h4 style="margin-bottom:12px">Service Details</h4>
        <p>${b.service?.emoji||''} <strong>${b.service?.name||''}</strong></p>
        <p>Date: ${formatDate(b.date)} at ${b.time||''}</p>
        <p>Total: <strong style="color:var(--primary)">EGP ${b.total||''}</strong></p>
      </div>
      <div>
        <h4 style="margin-bottom:12px">Status & Staff</h4>
        ${statusBadge(b.status)}
        <p style="margin-top:8px">Assigned: <strong>${b.staff?.firstName||'Unassigned'} ${b.staff?.lastName||''}</strong></p>
        <p>Booked: ${formatDate(b.createdAt)}</p>
      </div>
    </div>
    ${b.notes?`<div class="divider"></div><p><strong>Notes:</strong> ${b.notes}</p>`:''}`;
  openModal('bm-modal');
};
