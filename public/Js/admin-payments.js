
window.addEventListener('DOMContentLoaded', async () => {
  seedData(); if (!requireRole('admin')) return; initSidebar();
  await renderAll();
  document.getElementById('cp-save').addEventListener('click', addCoupon);
});
async function renderAll() {
  const allB = await bookingsAPI.allWithDetails();
  const completed = allB.filter(b=>b.status==='completed');
  const totalRev  = completed.reduce((s,b)=>s+(b.total||0),0);
  const avg       = completed.length ? Math.round(totalRev/completed.length) : 0;
  document.getElementById('pay-stats').innerHTML = [
    {l:'Total Revenue',   v:'EGP '+totalRev.toLocaleString(), i:SVG_ICONS.revenue, c:'green'},
    {l:'Transactions',    v:completed.length, i:SVG_ICONS.clipboard, c:'blue'},
    {l:'Avg per Booking', v:'EGP '+avg, i:SVG_ICONS.trendingUp, c:'yellow'},
    {l:'Pending',         v:'EGP '+allB.filter(b=>b.status==='pending').reduce((s,b)=>s+(b.total||0),0), i:SVG_ICONS.clock, c:'red'},
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
  const PMILEAGE = {
    'pkg-10k':'10,000 km','pkg-20k':'20,000 km','pkg-30k':'30,000 km','pkg-40k':'40,000 km',
    'pkg-50k':'50,000 km','pkg-60k':'60,000 km','pkg-70k':'70,000 km','pkg-80k':'80,000 km',
    'pkg-90k':'90,000 km','pkg-100k':'100,000 km',
  };
  const methods = ['Cash','Card','Bank Transfer','InstaPay'];
  document.getElementById('pay-tbody').innerHTML = completed.map((b,i)=>{
    const ids = b.serviceIds || (b.serviceId ? [b.serviceId] : []);
    const mId = ids.find(id => PMILEAGE[id]);
    const svcName = b.service?.name || (mId ? PMILEAGE[mId]+' Service' : ids[0] || '');
    const amt = (b.total != null && b.total !== '') ? b.total : 0;
    return `
    <tr>
      <td><code style="font-size:.72rem">${b.id.slice(-8)}</code></td>
      <td>${b.user?.firstName||''} ${b.user?.lastName||''}</td>
      <td>${svcName}</td>
      <td>${formatDate(b.date)}</td>
      <td style="font-weight:800;color:var(--primary)">EGP ${amt.toLocaleString()}</td>
      <td>${b.paymentMethod || 'Cash'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="6"><div class="empty-state" style="padding:24px"><p>No transactions yet.</p></div></td></tr>';
  const cpList = await couponsAPI.getAll();
  document.getElementById('coupons-list').innerHTML = cpList.map(c=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100)">
      <div>
        <div style="font-family:monospace;font-weight:700;font-size:.85rem">${c.code}</div>
        <div style="font-size:.72rem;color:var(--gray-500)">${c.discount}% off  Min EGP ${c.minOrder||0}</div>
      </div>
      <div class="flex-gap" style="gap:6px">
        <span class="badge ${c.active?'badge-green':'badge-gray'}">${c.active?'Active':'Inactive'}</span>
        <button class="btn btn-danger btn-sm" onclick="removeCoupon('${c._id || c.id}')">${SVG_ICONS.trash}</button>
      </div>
    </div>`).join('') || '<p style="color:var(--gray-400);font-size:.85rem">No coupons yet.</p>';
}
window.removeCoupon = async (id) => {
  try {
    await couponsAPI.remove(id);
    await renderAll(); 
    showToast('Coupon removed','success');
  } catch(e) {
    showToast('Failed to remove coupon', 'error');
  }
};
async function addCoupon() {
  const code = document.getElementById('cp-code').value.trim().toUpperCase();
  const disc = parseInt(document.getElementById('cp-disc').value)||0;
  const min  = parseInt(document.getElementById('cp-min').value)||0;
  const exp  = document.getElementById('cp-exp').value;
  if (!code||!disc) { showToast('Code and discount required','error'); return; }
  try {
    await couponsAPI.create({ code, discount: disc, minOrder: min, exp });
    closeModal('coupon-modal');
    await renderAll(); 
    showToast(`Coupon "${code}" added!`,'success');
  } catch(e) {
    showToast(e.message || 'Failed to add coupon', 'error');
  }
}
