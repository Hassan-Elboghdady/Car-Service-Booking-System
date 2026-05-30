// admin-inventory.js
window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();
  await seedInventory();
  await renderAll();
  document.getElementById('inv-search').addEventListener('input', function() { renderList(this.value.toLowerCase()); });
  document.getElementById('inv-save').addEventListener('click', addItem);
});

async function seedInventory() {
  const existing = await inventoryAPI.getAll();
  // Only skip if we already have items
  if (existing.length > 0) return;
  const items = [
    // Oils & Lubricants
    { name:'Engine Oil 5W-30 (1L)',          icon:'✅', cat:'oils',      unit:'quarts',  cost:120,  qty:80,  lowAt:15, supplier:'Castrol',  minOrder:12, notes:'Mineral base. For petrol engines.' },
    { name:'Engine Oil 5W-40 Synthetic (1L)',icon:'✅', cat:'oils',      unit:'quarts',  cost:185,  qty:60,  lowAt:12, supplier:'Mobil 1',   minOrder:12, notes:'Full synthetic. Petrol & diesel.' },
    { name:'Engine Oil 10W-40 (1L)',         icon:'✅', cat:'oils',      unit:'quarts',  cost:95,   qty:100, lowAt:20, supplier:'Shell',     minOrder:24, notes:'Semi-synthetic multi-grade.' },
    { name:'Gear Box Oil ATF (1L)',          icon:'✅', cat:'oils',      unit:'liters',  cost:140,  qty:40,  lowAt:8,  supplier:'Valvoline', minOrder:6,  notes:'Automatic transmission fluid.' },
    { name:'Power Steering Fluid (500ml)',   icon:'✅', cat:'oils',      unit:'bottles', cost:75,   qty:30,  lowAt:6,  supplier:'Prestone', minOrder:6,  notes:'Universal PSF.' },
    // Filters
    { name:'Oil Filter (Universal)',         icon:'✅', cat:'filters',   unit:'pcs',     cost:55,   qty:120, lowAt:20, supplier:'Mann',      minOrder:20, notes:'Fits Toyota, Hyundai, MG, Nissan.' },
    { name:'Air Filter (Panel)',             icon:'✅', cat:'filters',   unit:'pcs',     cost:90,   qty:80,  lowAt:15, supplier:'K&N',       minOrder:10, notes:'High-flow panel filter.' },
    { name:'Cabin Air Filter',               icon:'✅', cat:'filters',   unit:'pcs',     cost:75,   qty:60,  lowAt:10, supplier:'Mann',      minOrder:10, notes:'Pollen/dust cabin filter.' },
    { name:'Fuel Filter',                    icon:'✅', cat:'filters',   unit:'pcs',     cost:110,  qty:40,  lowAt:8,  supplier:'Bosch',     minOrder:6,  notes:'In-line fuel filter.' },
    // Brakes & Tyres
    { name:'Brake Pads (Front)  Economy',  icon:'✅', cat:'brakes',    unit:'sets',    cost:350,  qty:30,  lowAt:6,  supplier:'Brembo',    minOrder:4,  notes:'For Yaris, Spark, i10.' },
    { name:'Brake Pads (Front)  Mid',      icon:'✅', cat:'brakes',    unit:'sets',    cost:480,  qty:24,  lowAt:5,  supplier:'Brembo',    minOrder:4,  notes:'For Corolla, Elantra, MG ZS.' },
    { name:'Brake Pads (Rear)',              icon:'✅', cat:'brakes',    unit:'sets',    cost:290,  qty:20,  lowAt:4,  supplier:'Brembo',    minOrder:4,  notes:'Universal rear set.' },
    { name:'Brake Disc (Front) Pair',       icon:'✅', cat:'brakes',    unit:'pairs',   cost:680,  qty:16,  lowAt:3,  supplier:'ATE',       minOrder:2,  notes:'Ventilated front discs.' },
    { name:'Brake Fluid DOT 4 (500ml)',     icon:'✅', cat:'fluids',    unit:'bottles', cost:65,   qty:50,  lowAt:10, supplier:'ATE',       minOrder:12, notes:'DOT 4 specification.' },
    // Electrical & Battery
    { name:'Car Battery 55Ah',               icon:'✅', cat:'electrical',unit:'pcs',     cost:1200, qty:15,  lowAt:3,  supplier:'Varta',     minOrder:2,  notes:'12V 55Ah. Economy cars.' },
    { name:'Car Battery 70Ah',               icon:'✅', cat:'electrical',unit:'pcs',     cost:1600, qty:10,  lowAt:2,  supplier:'Bosch',     minOrder:2,  notes:'12V 70Ah. Mid-range cars.' },
    { name:'Spark Plugs (Iridium) x4',      icon:'📋', cat:'electrical',unit:'sets',    cost:320,  qty:40,  lowAt:8,  supplier:'NGK',       minOrder:5,  notes:'Iridium IX. 4-cylinder engines.' },
    { name:'Spark Plugs (Platinum) x4',     icon:'📋', cat:'electrical',unit:'sets',    cost:240,  qty:50,  lowAt:10, supplier:'Denso',     minOrder:5,  notes:'Platinum. Standard replacement.' },
    { name:'Alternator Belt',                icon:'✅', cat:'electrical',unit:'pcs',     cost:180,  qty:25,  lowAt:5,  supplier:'Gates',     minOrder:4,  notes:'V-ribbed serpentine belt.' },
    // Fluids & Coolants
    { name:'Coolant Concentrate (1L)',       icon:'✅', cat:'fluids',    unit:'liters',  cost:85,   qty:60,  lowAt:12, supplier:'Prestone', minOrder:12, notes:'Mix 50/50 with distilled water.' },
    { name:'Coolant Ready-Mix (5L)',         icon:'✅', cat:'fluids',    unit:'jugs',    cost:220,  qty:30,  lowAt:6,  supplier:'Mobil',     minOrder:4,  notes:'Pre-mixed. Ready to pour.' },
    { name:'Windscreen Washer Fluid (5L)',   icon:'✅', cat:'fluids',    unit:'jugs',    cost:75,   qty:40,  lowAt:8,  supplier:'Rain-X',    minOrder:6,  notes:'Anti-streak formula.' },
    { name:'AC Refrigerant R-134a (250g)',  icon:'✅', cat:'fluids',    unit:'cans',    cost:195,  qty:24,  lowAt:5,  supplier:'Liqui Moly',minOrder:4,  notes:'Automotive AC refrigerant.' },
    // Belts & Hoses
    { name:'Timing Belt Kit (Economy)',      icon:'✅', cat:'belts',     unit:'kits',    cost:680,  qty:12,  lowAt:3,  supplier:'Gates',     minOrder:2,  notes:'Belt + tensioner + idler. Yaris/Spark.' },
    { name:'Timing Belt Kit (Mid)',          icon:'✅', cat:'belts',     unit:'kits',    cost:950,  qty:10,  lowAt:2,  supplier:'Dayco',     minOrder:2,  notes:'Corolla/Elantra/MG ZS.' },
    { name:'Serpentine Belt',                icon:'✅', cat:'belts',     unit:'pcs',     cost:210,  qty:20,  lowAt:4,  supplier:'Gates',     minOrder:4,  notes:'Multi-rib drive belt.' },
    { name:'Radiator Hose (Upper)',          icon:'✅', cat:'belts',     unit:'pcs',     cost:145,  qty:20,  lowAt:4,  supplier:'Behr',      minOrder:4,  notes:'Upper radiator hose.' },
    // Cleaning & Detailing
    { name:'Car Shampoo (5L)',               icon:'✅', cat:'cleaning',  unit:'jugs',    cost:120,  qty:20,  lowAt:4,  supplier:'Meguiars',  minOrder:4,  notes:'pH neutral car wash.' },
    { name:'Microfiber Cloths (10-pack)',    icon:'✅', cat:'cleaning',  unit:'packs',   cost:85,   qty:30,  lowAt:5,  supplier:'Chemical Guys',minOrder:5,'notes':'Professional-grade detailing cloths.' },
    { name:'Tyre Shine Spray (500ml)',       icon:'✅', cat:'cleaning',  unit:'bottles', cost:95,   qty:25,  lowAt:5,  supplier:'Armor All', minOrder:6,  notes:'Long-lasting tyre dressing.' },
    { name:'Interior Cleaner (500ml)',       icon:'✅', cat:'cleaning',  unit:'bottles', cost:80,   qty:20,  lowAt:4,  supplier:'Meguiars',  minOrder:6,  notes:'Multi-surface interior spray.' },
    { name:'Engine Degreaser (500ml)',       icon:'✅', cat:'cleaning',  unit:'bottles', cost:110,  qty:18,  lowAt:4,  supplier:'WD-40',     minOrder:6,  notes:'Citrus-based engine cleaner.' },
    // Spare Parts
    { name:'Wiper Blade (Front) 24"',       icon:'✅', cat:'parts',     unit:'pcs',     cost:140,  qty:30,  lowAt:5,  supplier:'Bosch',     minOrder:6,  notes:'Flat beam style. Universal 24".' },
    { name:'Wiper Blade (Rear) 14"',        icon:'✅', cat:'parts',     unit:'pcs',     cost:90,   qty:20,  lowAt:4,  supplier:'Valeo',     minOrder:6,  notes:'Rear wiper. Universal 14".' },
    { name:'Thermostat (Universal)',         icon:'✅', cat:'parts',     unit:'pcs',     cost:95,   qty:15,  lowAt:3,  supplier:'Gates',     minOrder:5,  notes:'82C rating. Standard fitment.' },
    { name:'PCV Valve',                     icon:'✅', cat:'parts',     unit:'pcs',     cost:65,   qty:20,  lowAt:4,  supplier:'Febi',      minOrder:5,  notes:'Crankcase ventilation valve.' },
  ];
  for (const item of items) {
    try { await inventoryAPI.add(item); } catch(e){}
  }
}

async function getItems() { return await inventoryAPI.getAll(); }



async function renderAll() {
  const items = await getItems();
  const low   = items.filter(i=>i.qty<=i.lowAt);
  document.getElementById('inv-stats').innerHTML = [
    {l:'Total Items',   v:items.length,  i:SVG_ICONS.clipboard, c:'blue'},
    {l:'Low Stock',     v:low.length,    i:SVG_ICONS.clipboard, c:'yellow'},
    {l:'Well Stocked',  v:items.length-low.length, i:SVG_ICONS.clipboard, c:'green'},
    {l:'Total Qty',     v:items.reduce((a,i)=>a+i.qty,0), i:SVG_ICONS.checkCircle, c:'red'},
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
  await renderList(); await renderLowStock();
}

async function renderList(q='') {
  const catLabel = { oils:'Oils', filters:'Filters', brakes:'Brakes', electrical:'Electrical', fluids:'Fluids', cleaning:'Cleaning', belts:'Belts', parts:'Parts', tools:'Tools', other:'Other' };
  const catColor = { oils:'badge-yellow', filters:'badge-blue', brakes:'badge-red', electrical:'badge-purple', fluids:'badge-blue', cleaning:'badge-green', belts:'badge-gray', parts:'badge-gray', tools:'badge-gray', other:'badge-gray' };
  // Category-specific SVG icons and background colors
  const catSvg = {
    oils: { bg:'#fef3c7', fg:'#d97706', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>' },
    filters: { bg:'#dbeafe', fg:'#2563eb', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>' },
    brakes: { bg:'#fee2e2', fg:'#dc2626', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line></svg>' },
    electrical: { bg:'#f3e8ff', fg:'#7c3aed', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' },
    fluids: { bg:'#cffafe', fg:'#0891b2', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>' },
    cleaning: { bg:'#d1fae5', fg:'#059669', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16l-1 4 4-1 11-11-3-3L5 16z"></path><path d="M14.5 5.5l3 3"></path><path d="M12 22h9"></path></svg>' },
    belts: { bg:'#f3f4f6', fg:'#4b5563', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>' },
    parts: { bg:'#f3f4f6', fg:'#4b5563', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' },
    tools: { bg:'#f3f4f6', fg:'#4b5563', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>' },
    other: { bg:'#f3f4f6', fg:'#6b7280', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>' }
  };
  const items = (await getItems()).filter(i => !q || i.name.toLowerCase().includes(q) || (i.supplier||'').toLowerCase().includes(q));
  document.getElementById('inv-list').innerHTML = items.length ? items.map(i => {
    const isLow = i.qty <= i.lowAt;
    const catIcon = catSvg[i.cat] || catSvg.other;
    return `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--gray-100)">
        <div style="width:40px;height:40px;border-radius:10px;background:${catIcon.bg};color:${catIcon.fg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${catIcon.svg}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.9rem;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            ${i.name}
            <span class="badge ${catColor[i.cat]||'badge-gray'}" style="font-size:.65rem">${catLabel[i.cat]||i.cat||'Other'}</span>
          </div>
          <div style="font-size:.73rem;color:var(--gray-500);margin-top:2px;display:flex;gap:10px;flex-wrap:wrap">
            <span>${i.unit}</span>
            ${i.supplier ? `<span style="display:inline-flex;align-items:center;gap:4px"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> ${i.supplier}</span>` : ''}
            ${i.cost ? `<span style="color:var(--primary);font-weight:600">EGP ${i.cost}/${i.unit}</span>` : ''}
          </div>
        </div>
        ${isLow ? '<span class="badge badge-yellow">Low</span>' : '<span class="badge badge-green">OK</span>'}
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:1rem" onclick="adj('${i._id}',-1)">-</button>
          <span style="font-weight:700;min-width:28px;text-align:center">${i.qty}</span>
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:1rem" onclick="adj('${i._id}',1)">+</button>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeItem('${i._id}')">${SVG_ICONS.trash}</button>
      </div>`;
  }).join('') : '<p style="color:var(--gray-400);font-size:.85rem;padding:20px 0">No items found.</p>';
}


async function renderLowStock() {
  const low = (await getItems()).filter(i=>i.qty<=i.lowAt);
  document.getElementById('low-stock-list').innerHTML = low.length
    ? low.map(i=>`<div style="padding:8px 0;border-bottom:1px solid var(--gray-100)">
        <div class="flex-gap"><span style="color:var(--warning)">${SVG_ICONS.alert}</span><span style="font-size:.83rem;font-weight:600">${i.name}</span></div>
        <div style="font-size:.73rem;color:var(--gray-500)">Qty: ${i.qty} / Alert: ${i.lowAt}</div>
      </div>`).join('')
    : '<p style="color:var(--success);font-size:.83rem">✓ All stocked!</p>';
}

window.adj = async (id, delta) => {
  await inventoryAPI.adjust(id, delta);
  await renderAll();
};
window.removeItem = async (id) => {
  if (!confirm('Remove this item?')) return;
  await inventoryAPI.remove(id);
  await renderAll(); showToast('Item removed','success');
};
async function addItem() {
  const name     = document.getElementById('inv-name').value.trim();
  const icon     = document.getElementById('inv-icon')?.value?.trim() || '';
  const cat      = document.getElementById('inv-cat').value || 'other';
  const unit     = document.getElementById('inv-unit').value.trim() || 'pcs';
  const cost     = parseFloat(document.getElementById('inv-cost').value) || 0;
  const qty      = parseInt(document.getElementById('inv-qty').value) || 0;
  const lowAt    = parseInt(document.getElementById('inv-low').value) || 5;
  const supplier = document.getElementById('inv-supplier').value.trim();
  const minOrder = parseInt(document.getElementById('inv-minorder').value) || 1;
  const notes    = document.getElementById('inv-notes').value.trim();
  if (!name) { showToast('Item name is required', 'error'); return; }
  const items = getItems();
  
  if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
    showToast(`Inventory item "${name}" already exists!`, 'error');
    return;
  }

  try {
    await inventoryAPI.add({ name, icon, cat, unit, cost, qty, lowAt, supplier, minOrder, notes });
    closeModal('inv-modal');
    // reset form
    ['inv-name','inv-icon','inv-unit','inv-cost','inv-qty','inv-low','inv-supplier','inv-minorder','inv-notes'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    document.getElementById('inv-cat').value = 'oils';
    await renderAll(); showToast(`"${name}" added to inventory!`, 'success');
  } catch(e) {
    showToast(`Error adding: ${e.message}`, 'error');
  }
}
