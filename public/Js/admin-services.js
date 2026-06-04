// admin-services.js
'use strict';
let activeCat = 'all';
let editingId  = null;

// Live mileage prices (editable copy in memory, persisted to localStorage)
let liveMileagePrices = {};
// Live tier copy (editable)
let liveTiers = {};

async function loadServicesFromDb() {
  try {
    const services = await servicesAPI.getAll();
    if (!services || !services.length) return;

    const currentServices = getAll(KEYS.SERVICES_CUSTOM).length ? getAll(KEYS.SERVICES_CUSTOM) : SERVICES_DEFAULT;
    const customServices = services.filter(s => s.cat !== 'mileage');
    if (customServices.length) {
      const customById = new Map(customServices.map(s => [s.id, s]));
      const mergedServices = currentServices.map(s => customById.has(s.id) ? customById.get(s.id) : s);
      const newServices = customServices.filter(s => !currentServices.some(existing => existing.id === s.id));
      store.set(KEYS.SERVICES_CUSTOM, [...mergedServices, ...newServices]);
    }

    const mileageServices = services.filter(s => s.cat === 'mileage');
    if (mileageServices.length) {
      const pkgs = mileageServices.map(s => ({
        id: s.id,
        name: s.name,
        dur: s.duration || '',
        desc: s.desc || '',
        includes: Array.isArray(s.includes) ? s.includes : [],
      }));
      const prices = {};
      mileageServices.forEach((s) => {
        prices[s.id] = {
          1: s.priceByTier?.['1'] || 0,
          2: s.priceByTier?.['2'] || 0,
          3: s.priceByTier?.['3'] || 0,
        };
      });
      store.set('as_mileage_pkgs', pkgs);
      store.set('as_mileage_prices', prices);
    }
  } catch (error) {
    console.warn('Could not load admin services from database.', error);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();
  await loadServicesFromDb();

  // Deep-copy defaults so admin can edit them
  liveMileagePrices = JSON.parse(JSON.stringify(
    store.get('as_mileage_prices') || MILEAGE_PRICES
  ));
  liveTiers = JSON.parse(JSON.stringify(
    store.get('as_car_tiers') || CAR_TIER
  ));

  renderStats();
  renderServices();
  renderMileageTable();
  renderTierManager();
  updateMileageBadge();

  document.getElementById('svc-save-btn').addEventListener('click', saveService);
});

// --- TAB SWITCHING --------------------------------------------
window.setAdminCat = (btn, cat) => {
  document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeCat = cat;
  const isMileage = cat === 'mileage';
  document.getElementById('services-admin-grid').style.display = isMileage ? 'none' : '';
  document.getElementById('mileage-admin-section').style.display = isMileage ? 'block' : 'none';
  if (!isMileage) renderServices();
  else { renderMileageTable(); renderTierManager(); updateMileageBadge(); }
};

function getSvcs() { return getAll(KEYS.SERVICES_CUSTOM).length ? getAll(KEYS.SERVICES_CUSTOM) : SERVICES_DEFAULT; }

// --- GET MILEAGE PACKAGES (builtin + custom, minus hidden) ------
function getMileagePkgs() {
  const hidden = store.get('as_hidden_builtins') || [];
  const builtin = [
    { id:'pkg-10k',  name:'10,000 km Service',         dur:'2h'   },
    { id:'pkg-20k',  name:'20,000 km Service',         dur:'3h'   },
    { id:'pkg-30k',  name:'30,000 km Service',         dur:'4.5h' },
    { id:'pkg-40k',  name:'40,000 km Service',         dur:'5h'   },
    { id:'pkg-50k',  name:'50,000 km Service',         dur:'5.5h' },
    { id:'pkg-60k',  name:'60,000 km Major Service',   dur:'7h'   },
    { id:'pkg-70k',  name:'70,000 km Service',         dur:'6h'   },
    { id:'pkg-80k',  name:'80,000 km Service',         dur:'6.5h' },
    { id:'pkg-90k',  name:'90,000 km Service',         dur:'7h'   },
    { id:'pkg-100k', name:'100,000 km Major Overhaul', dur:'9h+'  },
  ].filter(b => !hidden.includes(b.id));
  const custom = store.get('as_mileage_pkgs') || [];
  return [...builtin, ...custom].sort((a,b) => {
    const kmA = parseInt((a.id||'').replace(/\D/g,''))||0;
    const kmB = parseInt((b.id||'').replace(/\D/g,''))||0;
    return kmA - kmB;
  });
}

// --- BADGE UPDATER -----------------------------------------
function updateMileageBadge() {
  const pkgs = getMileagePkgs();
  const badge = document.getElementById('mileage-badge');
  if (!badge) return;
  if (!pkgs.length) { badge.textContent = '0 Packages'; return; }
  // Extract numeric part (e.g. pkg-10k ? 10) then multiply by 1000 to get real km
  const kmValues = pkgs
    .map(p => parseInt((p.id||'').replace(/\D/g,'')) * 1000)
    .filter(Boolean)
    .sort((a,b) => a-b);
  const minKm = kmValues[0];
  const maxKm = kmValues[kmValues.length-1];
  const fmt = k => k >= 1000 ? (k/1000)+'k' : k;
  badge.textContent = `${pkgs.length} Package${pkgs.length!==1?'s':''}  ${fmt(minKm)}  ${fmt(maxKm)} km`;
}

// --- MILEAGE TABLE --------------------------------------------
function renderMileageTable() {
  const pkgs = getMileagePkgs();
  const tbody = document.getElementById('mileage-admin-tbody');
  if (!tbody) return;
  const customList = store.get('as_mileage_pkgs') || [];
  tbody.innerHTML = pkgs.map(pkg => {
    const p = (liveMileagePrices[pkg.id]) || {};
    const isCustom = !!customList.find(x => x.id === pkg.id);
    return `<tr>
      <td><strong>${pkg.name}</strong>${pkg.desc ? `<div style="font-size:.72rem;color:var(--gray-500);margin-top:2px">${pkg.desc.slice(0,60)}</div>` : ''}</td>
      <td><small>🕒 ${pkg.dur||pkg.duration||''}</small></td>
      <td><input type="number" class="form-control" style="width:100px;padding:5px 8px;font-size:.82rem"
          id="mp-eco-${pkg.id}" value="${p[1]||''}" placeholder="" min="0"/></td>
      <td><input type="number" class="form-control" style="width:100px;padding:5px 8px;font-size:.82rem"
          id="mp-mid-${pkg.id}" value="${p[2]||''}" placeholder="" min="0"/></td>
      <td><input type="number" class="form-control" style="width:100px;padding:5px 8px;font-size:.82rem"
          id="mp-prem-${pkg.id}" value="${p[3]||''}" placeholder="" min="0"/></td>
      <td>
        <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" style="padding:4px 8px;gap:4px" onclick="editMileagePkg('${pkg.id}')">${SVG_ICONS.edit} Edit</button>
          <button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:.72rem;gap:4px" onclick="resetMileagePkg('${pkg.id}')">${SVG_ICONS.reset} Reset</button>
          <button class="btn btn-danger btn-sm" style="padding:4px 8px" onclick="deleteMileagePkg('${pkg.id}','${isCustom}')">${SVG_ICONS.trash}</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

window.saveMileagePrices = () => {
  const pkgs = getMileagePkgs();
  pkgs.forEach(pkg => {
    const eco  = parseInt(document.getElementById(`mp-eco-${pkg.id}`)?.value) || 0;
    const mid  = parseInt(document.getElementById(`mp-mid-${pkg.id}`)?.value) || 0;
    const prem = parseInt(document.getElementById(`mp-prem-${pkg.id}`)?.value) || 0;
    liveMileagePrices[pkg.id] = { 1: eco, 2: mid, 3: prem };
  });
  store.set('as_mileage_prices', liveMileagePrices);
  showToast('Mileage prices saved! ?', 'success');
};

// --- ADD MILEAGE PACKAGE --------------------------------------
window.openAddMileageModal = () => {
  ['mp-name','mp-km','mp-dur','mp-eco','mp-mid','mp-prem','mp-desc','mp-includes'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  const saveBtn = document.querySelector('#add-mileage-modal .modal-footer .btn-primary');
  if (saveBtn) { saveBtn.textContent = 'Add Package'; saveBtn.onclick = addMileagePackage; }
  openModal('add-mileage-modal');
};

window.addMileagePackage = () => {
  const name = document.getElementById('mp-name').value.trim();
  const km   = parseInt(document.getElementById('mp-km').value) || 0;
  const dur  = document.getElementById('mp-dur').value.trim();
  const eco  = parseInt(document.getElementById('mp-eco').value) || 0;
  const mid  = parseInt(document.getElementById('mp-mid').value) || 0;
  const prem = parseInt(document.getElementById('mp-prem').value) || 0;
  const desc = document.getElementById('mp-desc').value.trim();
  const includesStr = document.getElementById('mp-includes').value;
  const includes = includesStr.split('\n').map(s=>s.trim()).filter(Boolean);
  if (!name) { showToast('Package name is required', 'error'); return; }
  if (!km)   { showToast('Mileage (km) is required', 'error'); return; }
  if (!dur)  { showToast('Duration is required', 'error'); return; }

  const id = `pkg-${km/1000}k`;
  const existing = getMileagePkgs().find(p => p.id === id);
  if (existing) { showToast(`A ${km/1000}k package already exists`, 'error'); return; }

  try {
    await servicesAPI.create({
      id,
      name,
      cat: 'mileage',
      duration: dur,
      desc,
      includes,
      priceByTier: { 1: eco, 2: mid, 3: prem },
    });
  } catch (error) {
    const message = error?.data?.message || error.message || 'Could not save mileage package to the database.';
    showToast(message, 'error');
    return;
  }

  const custom = store.get('as_mileage_pkgs') || [];
  custom.push({ id, name, dur, desc, includes });
  store.set('as_mileage_pkgs', custom);

  liveMileagePrices[id] = { 1: eco, 2: mid, 3: prem };
  store.set('as_mileage_prices', liveMileagePrices);

  closeModal('add-mileage-modal');
  ['mp-name','mp-km','mp-dur','mp-eco','mp-mid','mp-prem','mp-desc','mp-includes'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  renderMileageTable();
  updateMileageBadge();
  showToast(`${name} added! ✅`, 'success');
};

window.deleteMileagePkg = (id, isCustomStr) => {
  const isCustom = isCustomStr === 'true' || isCustomStr === true;
  if (!confirm('Delete this mileage package?')) return;
  if (isCustom) {
    const custom = (store.get('as_mileage_pkgs') || []).filter(p => p.id !== id);
    store.set('as_mileage_pkgs', custom);
  } else {
    // Hide built-in package by adding to hidden list
    const hidden = store.get('as_hidden_builtins') || [];
    if (!hidden.includes(id)) { hidden.push(id); store.set('as_hidden_builtins', hidden); }
  }
  delete liveMileagePrices[id];
  store.set('as_mileage_prices', liveMileagePrices);
  renderMileageTable();
  updateMileageBadge();
  showToast('Package removed', 'success');
};

window.editMileagePkg = (id) => {
  const pkg = getMileagePkgs().find(p => p.id === id);
  if (!pkg) return;
  const p = liveMileagePrices[id] || {};
  // Pre-fill the modal
  document.getElementById('mp-name').value = pkg.name;
  // Extract km from id (e.g. pkg-10k ? 10000)
  const kmNum = parseInt((id||'').replace(/\D/g,'')) * 1000;
  document.getElementById('mp-km').value   = kmNum || '';
  document.getElementById('mp-dur').value  = pkg.dur || pkg.duration || '';
  document.getElementById('mp-eco').value  = p[1] || '';
  document.getElementById('mp-mid').value  = p[2] || '';
  document.getElementById('mp-prem').value = p[3] || '';
  document.getElementById('mp-desc').value = pkg.desc || '';
  document.getElementById('mp-includes').value = (pkg.includes || []).join('\n');
  // Change save button to "Update"
  const saveBtn = document.querySelector('#add-mileage-modal .modal-footer .btn-primary');
  if (saveBtn) { saveBtn.textContent = 'Update Package'; saveBtn.onclick = () => updateMileagePkg(id); }
  openModal('add-mileage-modal');
};

window.updateMileagePkg = (id) => {
  const name = document.getElementById('mp-name').value.trim();
  const dur  = document.getElementById('mp-dur').value.trim();
  const eco  = parseInt(document.getElementById('mp-eco').value) || 0;
  const mid  = parseInt(document.getElementById('mp-mid').value) || 0;
  const prem = parseInt(document.getElementById('mp-prem').value) || 0;
  const desc = document.getElementById('mp-desc').value.trim();
  const includesStr = document.getElementById('mp-includes').value;
  const includes = includesStr.split('\n').map(s=>s.trim()).filter(Boolean);
  if (!name) { showToast('Package name is required', 'error'); return; }

  // Update custom list if custom
  const custom = store.get('as_mileage_pkgs') || [];
  const idx = custom.findIndex(p => p.id === id);
  if (idx !== -1) { custom[idx] = { ...custom[idx], name, dur, desc, includes }; store.set('as_mileage_pkgs', custom); }

  // Always update prices
  liveMileagePrices[id] = { 1: eco, 2: mid, 3: prem };
  store.set('as_mileage_prices', liveMileagePrices);

  closeModal('add-mileage-modal');
  // Restore save button
  const saveBtn = document.querySelector('#add-mileage-modal .modal-footer .btn-primary');
  if (saveBtn) { saveBtn.textContent = 'Add Package'; saveBtn.onclick = addMileagePackage; }
  ['mp-name','mp-km','mp-dur','mp-eco','mp-mid','mp-prem','mp-desc','mp-includes'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  renderMileageTable();
  updateMileageBadge();
  showToast(`"${name}" updated! ?`, 'success');
};

window.resetMileagePkg = (id) => {
  const customList = store.get('as_mileage_pkgs') || [];
  const isCustom = customList.some(p => p.id === id);
  if (!confirm('Reset this package\'s prices to defaults?')) return;
  if (isCustom) {
    renderMileageTable();
    showToast('Custom package prices restored to saved values', 'success');
    return;
  }
  delete liveMileagePrices[id];
  store.set('as_mileage_prices', liveMileagePrices);
  renderMileageTable();
  showToast('Prices reset to defaults', 'success');
};

// --- CAR TIER MANAGER -----------------------------------------
function renderTierManager() {
  const grid = document.getElementById('tier-manager-grid');
  if (!grid) return;

  // Build full model list from CARS_DB
  const allModels = [];
  Object.keys(CARS_DB).forEach(brand => {
    Object.keys(CARS_DB[brand].models).forEach(model => {
      allModels.push({ brand, model });
    });
  });

  const tierLabels = { 1: '🚗 Economy', 2: '🚗 Mid-Range', 3: '🚗 Premium' };
  const tierColors = { 1: '#dcfce7', 2: '#dbeafe', 3: '#f3e8ff' };

  grid.innerHTML = [1,2,3].map(tier => {
    const models = allModels.filter(m => (liveTiers[m.model]||1) === tier);
    return `
    <div style="background:${tierColors[tier]};border-radius:var(--radius-md);padding:16px">
      <div style="font-weight:700;margin-bottom:10px;font-size:.88rem">${tierLabels[tier]}</div>
      <div id="tier-list-${tier}" style="min-height:40px">
        ${models.map(m => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;background:rgba(255,255,255,.7);border-radius:6px;margin-bottom:6px;font-size:.8rem">
            <span>${m.brand} ${m.model}</span>
            <div style="display:flex;gap:4px">
              ${tier > 1 ? `<button class="btn btn-ghost btn-sm" style="padding:2px 7px;font-size:.7rem" onclick="moveTier('${m.model}',${tier-1})">↑</button>` : ''}
              ${tier < 3 ? `<button class="btn btn-ghost btn-sm" style="padding:2px 7px;font-size:.7rem" onclick="moveTier('${m.model}',${tier+1})">↓</button>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

window.moveTier = (model, newTier) => {
  liveTiers[model] = newTier;
  renderTierManager();
};

window.saveTiers = () => {
  store.set('as_car_tiers', liveTiers);
  // Also update the global CAR_TIER so prices reflect immediately
  Object.assign(CAR_TIER, liveTiers);
  showToast('Car tiers saved! 🚗', 'success');
};

// --- TOGGLE MILEAGE FIELDS in Add Service modal ---------------
window.toggleMileageFields = () => {
  const isMileage = document.getElementById('svc-cat').value === 'mileage';
  document.getElementById('svc-price-group').style.display  = isMileage ? 'none' : '';
  document.getElementById('svc-mileage-fields').style.display = isMileage ? 'block' : 'none';
};

// --- STATS ----------------------------------------------------
function renderStats() {
  const svcs = getSvcs();
  const mileagePkgs = getMileagePkgs();
  const cats = [
    { key:'maintenance', label:'Maintenance',   icon:SVG_ICONS.checkCircle, c:'blue'   },
    { key:'cleaning',    label:'Cleaning',       icon:SVG_ICONS.checkCircle, c:'green'  },
    { key:'repair',      label:'Repair',         icon:SVG_ICONS.checkCircle, c:'yellow' },
  ];
  document.getElementById('svc-stats').innerHTML = [
    { l:'Total Services', v:svcs.length + mileagePkgs.length, i:SVG_ICONS.clipboard, c:'red'    },
    ...cats.map(cat => ({ l:cat.label, v:svcs.filter(s => s.cat===cat.key).length, i:cat.icon, c:cat.c })),
    { l:'Mileage Pkgs',   v:mileagePkgs.length,                  i:SVG_ICONS.checkCircle, c:'purple' },
    { l:'Popular',        v:svcs.filter(s => s.popular).length,              i:SVG_ICONS.clipboard, c:'yellow' },
    { l:'Avg Price (EGP)',v:Math.round(svcs.reduce((a,s)=>a+(s.price||0),0)/Math.max(svcs.length,1)), i:SVG_ICONS.clipboard, c:'green' },
  ].map(s => `<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
}

function renderServices() {
  document.getElementById('services-admin-grid').style.display = '';
  document.getElementById('mileage-admin-section').style.display = 'none';
  let svcs = getSvcs();
  if (activeCat!=='all') svcs = svcs.filter(s=>s.cat===activeCat);
  const catLabel = { maintenance:'Maintenance', cleaning:'Cleaning', repair:'Repair' };
  const catColor = { maintenance:'badge-blue', cleaning:'badge-green', repair:'badge-yellow' };
  document.getElementById('services-admin-grid').innerHTML = svcs.map(s=>`
    <div class="svc-admin-card">
      <div class="svc-admin-icon">${renderServiceIconHtml(s,'1.4rem')}</div>
      <div class="svc-admin-info">
        <h4>${s.name} ${s.popular?'<span class="badge badge-yellow">Popular</span>':''}</h4>
        <div class="flex-gap" style="font-size:.78rem;color:var(--gray-500);flex-wrap:wrap;gap:8px;margin-top:4px">
          <span class="badge ${catColor[s.cat]||'badge-gray'}">${catLabel[s.cat]||s.cat}</span>
          <span>🕒 ${s.duration}</span>
          <span style="font-weight:700;color:var(--primary)">EGP ${s.price}</span>
        </div>
      </div>
      <div class="svc-admin-actions">
        <button class="btn btn-outline btn-sm" style="gap:4px" onclick="editService('${s.id}')">${SVG_ICONS.edit} Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteService('${s.id}')">${SVG_ICONS.trash}</button>
      </div>
    </div>`).join('');
}

window.editService = (id) => {
  const svc = getSvcs().find(s=>s.id===id); if(!svc) return;
  editingId = id;
  document.getElementById('svc-edit-id').value    = id;
  document.getElementById('svc-modal-title').textContent = 'Edit Service';
  document.getElementById('svc-name').value  = svc.name;
  document.getElementById('svc-icon').value  = svc.emoji||svc.icon||'';
  document.getElementById('svc-cat').value   = svc.cat;
  document.getElementById('svc-dur').value   = svc.duration;
  document.getElementById('svc-price').value = svc.price;
  document.getElementById('svc-desc').value  = svc.desc||'';
  document.getElementById('svc-includes').value = (svc.includes || []).join('\n');
  document.getElementById('svc-popular').checked = !!svc.popular;
  toggleMileageFields();
  openModal('svc-modal');
};

window.deleteService = (id) => {
  const svc = getSvcs().find(s=>s.id===id); if(!svc) return;
  if (!confirm(`Delete "${svc.name}"? This cannot be undone.`)) return;
  const list = getSvcs().filter(s=>s.id!==id);
  store.set(KEYS.SERVICES_CUSTOM, list);
  renderStats(); renderServices();
  showToast(`"${svc.name}" deleted.`,'success');
};

async function saveService() {
  const id        = document.getElementById('svc-edit-id').value || genId('s');
  const name      = document.getElementById('svc-name').value.trim();
  const iconValue = document.getElementById('svc-icon').value.trim();
  const icon      = normalizeServiceIcon(iconValue);
  const emoji     = icon ? (LEGACY_SERVICE_EMOJI[iconValue] ? iconValue : '') : iconValue;
  const cat       = document.getElementById('svc-cat').value;
  const dur       = document.getElementById('svc-dur').value.trim() || '1h';
  const desc      = document.getElementById('svc-desc').value.trim();
  const pop       = document.getElementById('svc-popular').checked;
  if (!name) { showToast('Service name is required','error'); return; }

  const isEditing = !!document.getElementById('svc-edit-id').value;
  const svcs = getSvcs();
  if (!isEditing && svcs.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast(`Service "${name}" already exists!`, 'error');
    return;
  }

  let price = 0;
  if (cat === 'mileage') {
    const km   = parseInt(document.getElementById('svc-km')?.value) || 0;
    const eco  = parseInt(document.getElementById('svc-price-eco')?.value) || 0;
    const mid  = parseInt(document.getElementById('svc-price-mid')?.value) || 0;
    const prem = parseInt(document.getElementById('svc-price-prem')?.value) || 0;
    if (!km) { showToast('Please enter the km milestone', 'error'); return; }
    const pkgId = `pkg-${km/1000}k`;
    const includesStr = document.getElementById('svc-includes')?.value || '';
    const includes = includesStr.split('\n').map(s=>s.trim()).filter(Boolean);
    const custom = store.get('as_mileage_pkgs') || [];
    if (custom.find(p=>p.id===pkgId)) { showToast(`A ${km/1000}k package already exists`, 'error'); return; }

    try {
      await servicesAPI.create({
        id: pkgId,
        name,
        cat: 'mileage',
        duration: dur,
        desc,
        includes,
        priceByTier: { 1: eco, 2: mid, 3: prem },
      });
    } catch (error) {
      const message = error?.data?.message || error.message || 'Could not save mileage package to the database.';
      showToast(message, 'error');
      return;
    }

    custom.push({ id: pkgId, name, dur, desc, includes });
    store.set('as_mileage_pkgs', custom);
    liveMileagePrices[pkgId] = { 1: eco, 2: mid, 3: prem };
    store.set('as_mileage_prices', liveMileagePrices);
    showToast(`Mileage package "${name}" saved! ✅`, 'success');
    closeModal('svc-modal'); editingId=null;
    document.getElementById('svc-edit-id').value='';
    document.getElementById('svc-modal-title').textContent='Add New Service';
    ['svc-name','svc-icon','svc-dur','svc-price','svc-desc','svc-km','svc-price-eco','svc-price-mid','svc-price-prem','svc-includes'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('svc-popular').checked=false;
    document.getElementById('svc-cat').value='maintenance';
    toggleMileageFields();
    renderMileageTable(); updateMileageBadge();
    return;
  }

  price = parseInt(document.getElementById('svc-price').value) || 0;

  const includesStr = document.getElementById('svc-includes')?.value || '';
  const includes = includesStr.split('\n').map(s=>s.trim()).filter(Boolean);

  const existing = svcs.find(s=>s.id===id);
  const newSvc = { id, name, icon, emoji, cat, duration:dur, price, desc, popular:pop, includes };

  if (!isEditing) {
    try {
      await servicesAPI.create({
        id,
        name,
        icon,
        emoji,
        cat,
        duration: dur,
        price,
        priceByTier: {},
        desc,
        popular: pop,
        includes,
      });
    } catch (error) {
      const message = error?.data?.message || error.message || 'Could not save service to the database.';
      showToast(message, 'error');
      return;
    }
  }

  if (existing) Object.assign(existing, newSvc);
  else svcs.push(newSvc);
  store.set(KEYS.SERVICES_CUSTOM, svcs);

  closeModal('svc-modal'); editingId=null;
  document.getElementById('svc-edit-id').value='';
  document.getElementById('svc-modal-title').textContent='Add New Service';
  ['svc-name','svc-icon','svc-dur','svc-price','svc-desc','svc-includes'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('svc-popular').checked=false;
  document.getElementById('svc-cat').value='maintenance';
  toggleMileageFields();
  renderStats(); renderServices();
  showToast(`"${name}" saved!`,'success');
}
