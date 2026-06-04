// admin-vehicles.js
async function loadBrandsFromDb() {
  try {
    const brands = await brandsAPI.getAll();
    if (!brands || !brands.length) return;

    const db = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
    brands.forEach((brand) => {
      db[brand.name] = {
        models: brand.models || {},
        logo: brand.logo || '',
        modelPictures: brand.modelPictures || {},
        emoji: brand.emoji || '🚗',
      };
    });

    localStorage.setItem('as_cars_db', JSON.stringify(db));
    Object.assign(CARS_DB, db);
  } catch (error) {
    console.warn('Could not load brands from database.', error);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  seedData(); if (!requireRole('admin')) return; initSidebar();
  await loadBrandsFromDb();
  
  // Re-load vehicles and bookings to reflect updates
  let cars = getAll(KEYS.CARS);
  let allB = getAll(KEYS.BOOKINGS);

  // Expose Modal Toggle functions globally
  window.toggleBrandLogoInput = () => {
    const method = document.getElementById('ab-logo-method').value;
    document.getElementById('ab-logo-url-group').style.display = method === 'url' ? 'block' : 'none';
    document.getElementById('ab-logo-file-group').style.display = method === 'upload' ? 'block' : 'none';
  };

  window.toggleCarPicInput = () => {
    const method = document.getElementById('ac-pic-method').value;
    document.getElementById('ac-pic-url-group').style.display = method === 'url' ? 'block' : 'none';
    document.getElementById('ac-pic-file-group').style.display = method === 'upload' ? 'block' : 'none';
  };

  function updateStats() {
    const uniqueBrands = [...new Set(cars.map(c=>c.brand))].length;
    document.getElementById('v-stats').innerHTML = [
      {
        l: 'Total Vehicles',
        v: cars.length,
        i: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
        c: 'red'
      },
      {
        l: 'Brands',
        v: uniqueBrands,
        i: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
        c: 'yellow'
      },
    ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
  }

  function render(q='') {
    const data = q ? cars.filter(c=>{
      const owner = getById(KEYS.USERS, c.owner)||{};
      const term = (c.brand+' '+c.model+' '+c.plate+' '+c.color+' '+c.year+' '+(owner.firstName||'')+' '+(owner.lastName||'')+' '+(owner.email||'')).toLowerCase();
      return term.includes(q);
    }) : cars;

    const trashIcon = SVG_ICONS.trash || '🗑️';

    document.getElementById('v-tbody').innerHTML = data.map(c=>{
      const owner = getById(KEYS.USERS, c.owner)||{};
      const bkCnt = allB.filter(b=>b.carId===c.id).length;
      return `<tr>
        <td><strong>${owner.firstName||''} ${owner.lastName||''}</strong><br><small>${owner.email||''}</small></td>
        <td>${getBrandLogoHtml(c.brand)} <strong>${c.brand}</strong></td>
        <td>${c.model}</td>
        <td>${c.year}</td>
        <td><span class="badge badge-gray">${c.plate}</span></td>
        <td><span style="display:inline-block;width:12px;height:12px;background:${c.color.toLowerCase()};border:1px solid #ccc;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>${c.color}</td>
        <td>${bkCnt}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="deleteCustomerVehicle('${c.id}')" style="padding:4px; min-height:0; color:var(--red); height:28px; width:28px; display:flex; align-items:center; justify-content:center;" title="Remove Registered Vehicle">
            ${trashIcon}
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  window.deleteCustomerVehicle = (carId) => {
    const car = getById(KEYS.CARS, carId);
    if (!car) return;
    const owner = getById(KEYS.USERS, car.owner) || {};
    if (!confirm(`Are you sure you want to remove the registered vehicle "${car.brand} ${car.model} (${car.year})" owned by ${owner.firstName || 'Customer'}?`)) return;

    let allCars = getAll(KEYS.CARS) || [];
    allCars = allCars.filter(x => x.id !== carId);
    saveAll(KEYS.CARS, allCars);
    cars = allCars;

    showToast('Vehicle removed successfully!', 'success');
    updateStats();
    render();
    renderReminders();
  };

  function renderReminders() {
    const reminders = cars.map(c => {
      const lastSvce = allB.filter(b=>b.carId===c.id&&b.status==='completed').sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
      const owner = getById(KEYS.USERS, c.owner)||{};
      if (!lastSvce) return null;
      const daysSince = Math.floor((Date.now() - new Date(lastSvce.date)) / 86400000);
      if (daysSince < 60) return null;
      return { car:c, owner, daysSince };
    }).filter(Boolean);

    document.getElementById('maintenance-reminders').innerHTML = reminders.length
      ? reminders.map(r=>`
        <div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">
          <div style="font-weight:600;font-size:.83rem;display:flex;align-items:center;">${getBrandLogoHtml(r.car.brand, '18px')} <span style="margin-left:4px">${r.car.brand} ${r.car.model}</span></div>
          <div style="font-size:.75rem;color:var(--gray-500);margin-left:22px;">${r.owner.firstName||''} • ${r.daysSince} days since service</div>
          <span class="badge ${r.daysSince>90?'badge-red':'badge-yellow'}" style="margin-top:4px;margin-left:22px;">${r.daysSince>90?'🚨 Overdue':'Due Soon'}</span>
        </div>`).join('')
      : '<p style="color:var(--success);font-size:.85rem;display:flex;align-items:center;gap:6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success)"><polyline points="20 6 9 17 4 12"></polyline></svg> All vehicles are up to date!</p>';
  }

  // --- PARSE SUPPORTED YEARS HELPER ---
  function parseSupportedYears(str) {
    if (!str) return [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
    const text = str.trim();
    if (text.includes('-')) {
      const parts = text.split('-').map(x => parseInt(x.trim())).filter(Boolean);
      if (parts.length === 2) {
        const start = Math.min(parts[0], parts[1]);
        const end = Math.max(parts[0], parts[1]);
        const years = [];
        for (let y = start; y <= end; y++) {
          years.push(y);
        }
        return years;
      }
    }
    const parsed = text.split(',').map(x => parseInt(x.trim())).filter(Boolean);
    if (parsed.length > 0) return parsed.sort((a,b)=>a-b);
    return [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  }

  // --- DYNAMIC MODEL ROWS IN BRAND MODAL ---
  let modelRowIndex = 0;
  window.addBrandModelRow = () => {
    const container = document.getElementById('ab-models-list');
    if (!container) return;
    const id = `model-row-${modelRowIndex++}`;
    const row = document.createElement('div');
    row.id = id;
    row.style.position = 'relative';
    row.style.border = '1px solid var(--gray-200)';
    row.style.padding = '12px';
    row.style.borderRadius = '8px';
    row.style.backgroundColor = 'rgba(255,255,255,0.02)';
    row.innerHTML = `
      <button type="button" class="btn btn-ghost btn-sm" onclick="removeBrandModelRow('${id}')" style="position:absolute; top:8px; right:8px; border:none; color:var(--red); font-size:1.1rem; padding:0; line-height:1; min-height:0; width:20px; height:20px; display:flex; align-items:center; justify-content:center; background:none; cursor:pointer;">✕</button>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:8px;">
        <div>
          <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">Model Name</label>
          <input type="text" class="form-control form-control-sm ab-model-name" placeholder="e.g. C-Class" style="padding:6px 10px; font-size:0.83rem;">
        </div>
        <div>
          <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">Years</label>
          <input type="text" class="form-control form-control-sm ab-model-years" placeholder="e.g. 2018-2026" style="padding:6px 10px; font-size:0.83rem;">
        </div>
      </div>
      <div>
        <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">Model Picture URL or File Upload</label>
        <div style="display:flex; gap:8px; align-items:center;">
          <input type="text" class="form-control form-control-sm ab-model-pic-url" placeholder="https://example.com/image.jpg" style="flex:1; padding:6px 10px; font-size:0.83rem;">
          <input type="file" class="ab-model-pic-file" accept="image/*" style="width:115px; font-size:0.7rem; color:var(--text-muted);">
        </div>
      </div>
    `;
    container.appendChild(row);
  };

  window.removeBrandModelRow = (id) => {
    const row = document.getElementById(id);
    if (row) row.remove();
  };

  // Intercept openModal to reset Brand builder
  const originalOpenModal = window.openModal;
  window.openModal = (id) => {
    if (id === 'brand-modal') {
      const list = document.getElementById('ab-models-list');
      if (list) {
        list.innerHTML = '';
        window.addBrandModelRow(); // Add initial blank row
      }
    }
    if (originalOpenModal) originalOpenModal(id);
  };

  const addBtn = document.getElementById('ab-add-model-btn');
  if (addBtn) {
    addBtn.onclick = () => window.addBrandModelRow();
  }

  // --- POPULATE MODALS ON LOAD/OPEN ---
  function initAddCarDropdowns() {
    const brandSel = document.getElementById('ac-brand');
    if (brandSel) {
      brandSel.innerHTML = '<option value="">Select Brand...</option>' + 
        Object.keys(CARS_DB).map(b => `<option value="${b}">${b}</option>`).join('');
    }
  }

  // --- SAVE BRAND ACTION ---
  document.getElementById('ab-save-btn').onclick = () => {
    const nameInput = document.getElementById('ab-name');
    const name = nameInput.value.trim();
    const isEditMode = nameInput.readOnly;
    const method = document.getElementById('ab-logo-method').value;
    const urlLogo = document.getElementById('ab-logo-url').value.trim();
    const fileLogo = document.getElementById('ab-logo-file').files[0];
    const alertEl = document.getElementById('ab-alert');

    if (!name) { alertEl.innerHTML = '<div class="alert alert-danger">Brand name is required.</div>'; return; }

    const db = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
    if (!isEditMode && db[name]) {
      alertEl.innerHTML = `<div class="alert alert-danger">Brand "${name}" already exists. Please edit the existing brand or choose a different name.</div>`;
      return;
    }

    const rows = document.querySelectorAll('#ab-models-list > div');
    if (rows.length === 0) { alertEl.innerHTML = '<div class="alert alert-danger">At least one model is required.</div>'; return; }

    const modelsObj = {};
    const modelPicturesObj = {};
    const filePromises = [];
    let hasDuplicateModel = false;

    rows.forEach(row => {
      const modelName = row.querySelector('.ab-model-name').value.trim();
      const yearsStr = row.querySelector('.ab-model-years').value.trim();
      const picUrl = row.querySelector('.ab-model-pic-url').value.trim();
      const picFile = row.querySelector('.ab-model-pic-file').files[0];

      if (!modelName) return;

      // Check if this model name exists under any OTHER brand
      const existingDb = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
      for (const [otherBrand, data] of Object.entries(existingDb)) {
        if (otherBrand !== name && data.models && data.models[modelName]) {
          alertEl.innerHTML = `<div class="alert alert-danger">Model "${modelName}" already exists under brand "${otherBrand}". A model can only belong to one brand.</div>`;
          hasDuplicateModel = true;
          return;
        }
      }

      const years = parseSupportedYears(yearsStr);
      modelsObj[modelName] = years;

      if (picFile) {
        const promise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            modelPicturesObj[modelName] = e.target.result;
            resolve();
          };
          reader.readAsDataURL(picFile);
        });
        filePromises.push(promise);
      } else if (picUrl) {
        modelPicturesObj[modelName] = picUrl;
      } else {
        modelPicturesObj[modelName] = '';
      }
    });

    if (hasDuplicateModel) return;

    const proceedSaveBrand = async (logoDataUrl) => {
      await Promise.all(filePromises);
      try {
        await brandsAPI.create({
          name,
          logo: logoDataUrl,
          emoji: '🚗',
          models: modelsObj,
          modelPictures: modelPicturesObj,
        });
      } catch (error) {
        const message = error?.data?.message || error.message || 'Could not save brand to the database.';
        alertEl.innerHTML = `<div class="alert alert-danger">${message}</div>`;
        return;
      }

      const db = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
      db[name] = {
        models: modelsObj,
        logo: logoDataUrl,
        modelPictures: modelPicturesObj,
        emoji: '🚗'
      };
      localStorage.setItem('as_cars_db', JSON.stringify(db));
      Object.assign(CARS_DB, db);

      closeModal('brand-modal');
      showToast(`Brand "${name}" saved successfully!`, 'success');

      // Reset
      const nameInput = document.getElementById('ab-name');
      nameInput.value = '';
      nameInput.readOnly = false;
      document.getElementById('ab-logo-url').value = '';
      document.getElementById('ab-logo-file').value = '';
      document.getElementById('ab-models-list').innerHTML = '';
      alertEl.innerHTML = '';

      initAddCarDropdowns();
      updateStats();
      window.renderDatabaseManager();
    };

    if (method === 'upload' && fileLogo) {
      const reader = new FileReader();
      reader.onload = (e) => proceedSaveBrand(e.target.result);
      reader.readAsDataURL(fileLogo);
    } else {
      proceedSaveBrand(urlLogo || '../../public/images/brands/' + name.toLowerCase() + '.png');
    }
  };

  // --- SAVE VEHICLE MODEL TO BRAND ACTION ---
  document.getElementById('ac-save-btn').onclick = () => {
    const brand = document.getElementById('ac-brand').value;
    const model = document.getElementById('ac-model').value.trim();
    const yearsStr = document.getElementById('ac-years').value.trim();
    const method = document.getElementById('ac-pic-method').value;
    const picUrl = document.getElementById('ac-pic-url').value.trim();
    const picFile = document.getElementById('ac-pic-file').files[0];
    const alertEl = document.getElementById('ac-alert');

    if (!brand) { alertEl.innerHTML = '<div class="alert alert-danger">Brand selection is required.</div>'; return; }
    if (!model) { alertEl.innerHTML = '<div class="alert alert-danger">Model name is required.</div>'; return; }

    const dbCheck = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
    // Check if model exists under the SAME brand
    if (dbCheck[brand] && dbCheck[brand].models && dbCheck[brand].models[model]) {
      alertEl.innerHTML = `<div class="alert alert-danger">Model "${model}" already exists under brand "${brand}".</div>`;
      return;
    }
    // Check if model exists under ANY OTHER brand
    for (const [otherBrand, data] of Object.entries(dbCheck)) {
      if (otherBrand !== brand && data.models && data.models[model]) {
        alertEl.innerHTML = `<div class="alert alert-danger">Model "${model}" already exists under brand "${otherBrand}". A model can only belong to one brand.</div>`;
        return;
      }
    }

    const years = parseSupportedYears(yearsStr);

    const saveModelData = (pictureDataUrl) => {
      const db = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
      if (!db[brand]) {
        db[brand] = { models: {}, logo: '', modelPictures: {}, emoji: '🚗' };
      }
      if (!db[brand].models) db[brand].models = {};
      if (!db[brand].modelPictures) db[brand].modelPictures = {};

      db[brand].models[model] = years;
      db[brand].modelPictures[model] = pictureDataUrl || '';

      localStorage.setItem('as_cars_db', JSON.stringify(db));
      Object.assign(CARS_DB, db);

      closeModal('car-modal');
      showToast(`Model "${model}" added to "${brand}" successfully!`, 'success');

      // Reset
      document.getElementById('ac-model').value = '';
      document.getElementById('ac-years').value = '';
      document.getElementById('ac-pic-url').value = '';
      document.getElementById('ac-pic-file').value = '';
      alertEl.innerHTML = '';

      initAddCarDropdowns();
      updateStats();
      window.renderDatabaseManager();
    };

    if (method === 'upload' && picFile) {
      const reader = new FileReader();
      reader.onload = (e) => saveModelData(e.target.result);
      reader.readAsDataURL(picFile);
    } else {
      saveModelData(picUrl);
    }
  };

  // --- CAR DATABASE MANAGER FUNCTIONS ---
  window.openBrandModalForAdd = () => {
    const modalTitle = document.getElementById('brand-modal').querySelector('.modal-title');
    if (modalTitle) modalTitle.textContent = 'Add New Car Brand';

    const nameInput = document.getElementById('ab-name');
    nameInput.value = '';
    nameInput.readOnly = false;

    document.getElementById('ab-logo-url').value = '';
    document.getElementById('ab-logo-file').value = '';
    document.getElementById('ab-logo-method').value = 'url';
    window.toggleBrandLogoInput();

    const list = document.getElementById('ab-models-list');
    list.innerHTML = '';
    window.addBrandModelRow();

    openModal('brand-modal');
  };

  window.openBrandModalForEdit = (brandName) => {
    const brandData = CARS_DB[brandName];
    if (!brandData) return;

    const modalTitle = document.getElementById('brand-modal').querySelector('.modal-title');
    if (modalTitle) modalTitle.textContent = `Edit Car Brand: ${brandName}`;

    const nameInput = document.getElementById('ab-name');
    nameInput.value = brandName;
    nameInput.readOnly = true;

    document.getElementById('ab-logo-method').value = 'url';
    window.toggleBrandLogoInput();
    document.getElementById('ab-logo-url').value = brandData.logo || '';
    document.getElementById('ab-logo-file').value = '';

    const list = document.getElementById('ab-models-list');
    list.innerHTML = '';
    
    const models = brandData.models || {};
    const modelPics = brandData.modelPictures || {};
    
    Object.entries(models).forEach(([modelName, years]) => {
      const id = `model-row-${modelRowIndex++}`;
      const row = document.createElement('div');
      row.id = id;
      row.style.position = 'relative';
      row.style.border = '1px solid var(--gray-200)';
      row.style.padding = '12px';
      row.style.borderRadius = '8px';
      row.style.backgroundColor = 'rgba(255,255,255,0.02)';
      row.style.marginBottom = '10px';
      
      const yearsStr = Array.isArray(years) ? `${years[0]}-${years[years.length - 1]}` : years;
      const picUrl = modelPics[modelName] || '';

      row.innerHTML = `
        <button type="button" class="btn btn-ghost btn-sm" onclick="removeBrandModelRow('${id}')" style="position:absolute; top:8px; right:8px; border:none; color:var(--red); font-size:1.1rem; padding:0; line-height:1; min-height:0; width:20px; height:20px; display:flex; align-items:center; justify-content:center; background:none; cursor:pointer;">✕</button>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:8px;">
          <div>
            <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">Model Name</label>
            <input type="text" class="form-control form-control-sm ab-model-name" value="${modelName}" style="padding:6px 10px; font-size:0.83rem;">
          </div>
          <div>
            <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">Years</label>
            <input type="text" class="form-control form-control-sm ab-model-years" value="${yearsStr}" placeholder="e.g. 2018-2026" style="padding:6px 10px; font-size:0.83rem;">
          </div>
        </div>
        <div>
          <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">Model Picture URL or File Upload</label>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" class="form-control form-control-sm ab-model-pic-url" value="${picUrl}" placeholder="https://example.com/image.jpg" style="flex:1; padding:6px 10px; font-size:0.83rem;">
            <input type="file" class="ab-model-pic-file" accept="image/*" style="width:115px; font-size:0.7rem; color:var(--text-muted);">
          </div>
        </div>
      `;
      list.appendChild(row);
    });

    if (Object.keys(models).length === 0) {
      window.addBrandModelRow();
    }

    openModal('brand-modal');
  };

  window.openCarModalForAdd = () => {
    initAddCarDropdowns();
    const brandSel = document.getElementById('ac-brand');
    if (brandSel) {
      brandSel.value = '';
      brandSel.disabled = false;
    }
    document.getElementById('ac-model').value = '';
    document.getElementById('ac-years').value = '';
    document.getElementById('ac-pic-url').value = '';
    document.getElementById('ac-pic-file').value = '';
    document.getElementById('ac-pic-method').value = 'url';
    window.toggleCarPicInput();
    openModal('car-modal');
  };

  window.openCarModalForBrand = (brandName) => {
    initAddCarDropdowns();
    const brandSel = document.getElementById('ac-brand');
    if (brandSel) {
      brandSel.value = brandName;
      brandSel.disabled = true;
    }
    document.getElementById('ac-model').value = '';
    document.getElementById('ac-years').value = '';
    document.getElementById('ac-pic-url').value = '';
    document.getElementById('ac-pic-file').value = '';
    document.getElementById('ac-pic-method').value = 'url';
    window.toggleCarPicInput();
    openModal('car-modal');
  };

  window.renderDatabaseManager = () => {
    const grid = document.getElementById('db-brands-grid');
    if (!grid) return;

    const editIcon = SVG_ICONS.edit || '✏️';
    const trashIcon = SVG_ICONS.trash || '🗑️';

    grid.innerHTML = Object.entries(CARS_DB).map(([brandName, brandData]) => {
      const models = brandData.models || {};
      const modelPics = brandData.modelPictures || {};
      
      const modelsHtml = Object.entries(models).map(([modelName, years]) => {
        const yearsStr = Array.isArray(years) ? `${years[0]} - ${years[years.length - 1]}` : years;
        const pic = modelPics[modelName] || brandData.logo || '';
        const picHtml = pic ? `<img src="${pic}" alt="${modelName}" style="width:36px; height:36px; object-fit:contain; border-radius:4px; background:var(--gray-50); border:1px solid var(--gray-200);">` : `<span style="font-size:1.5rem">🚗</span>`;
        return `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--gray-100);">
            <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
              ${picHtml}
              <div style="min-width:0; flex:1;">
                <div style="font-weight:600; font-size:0.85rem; color:var(--text); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${modelName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${yearsStr}</div>
              </div>
            </div>
            <div style="display:flex; gap:4px; margin-left:8px; flex-shrink:0;">
              <button class="btn btn-ghost btn-sm" onclick="openModelEditModal('${brandName}', '${modelName}')" style="padding:4px; min-height:0; height:28px; width:28px; display:flex; align-items:center; justify-content:center; color:var(--primary);" title="Edit Model">${editIcon}</button>
              <button class="btn btn-ghost btn-sm" onclick="deleteModel('${brandName}', '${modelName}')" style="padding:4px; min-height:0; height:28px; width:28px; display:flex; align-items:center; justify-content:center; color:var(--red);" title="Delete Model">${trashIcon}</button>
            </div>
          </div>
        `;
      }).join('');

      const logoHtml = brandData.logo ? `<img src="${brandData.logo}" alt="${brandName}" style="height:32px; max-width:80px; object-fit:contain;">` : `<span style="font-size:1.8rem">🚗</span>`;

      return `
        <div class="card" style="border:1px solid var(--gray-200); box-shadow:none; display:flex; flex-direction:column; padding:16px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1.5px solid var(--gray-200); padding-bottom:12px; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              ${logoHtml}
              <h4 style="margin:0; font-size:1.05rem;">${brandName}</h4>
            </div>
            <div style="display:flex; gap:6px; margin-left:auto;">
              <button class="btn btn-outline btn-sm" onclick="openBrandModalForEdit('${brandName}')" style="padding:4px 8px; font-size:0.75rem; min-height:0; height:28px;">Edit</button>
              <button class="btn btn-outline btn-sm" onclick="deleteBrand('${brandName}')" style="padding:4px 8px; font-size:0.75rem; min-height:0; height:28px; color:var(--red); border-color:var(--red);">Delete</button>
            </div>
          </div>
          <div style="flex:1; display:flex; flex-direction:column; gap:4px; max-height:220px; overflow-y:auto; padding-right:4px;">
            ${modelsHtml || '<p style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">No models added yet.</p>'}
          </div>
          <button class="btn btn-ghost btn-sm" onclick="openCarModalForBrand('${brandName}')" style="margin-top:12px; width:100%; border:1px dashed var(--gray-300); font-size:0.8rem; height:32px; min-height:0; display:flex; align-items:center; justify-content:center;">+ Add Model</button>
        </div>
      `;
    }).join('');
  };

  window.deleteBrand = (brandName) => {
    if (!confirm(`Are you sure you want to delete the entire brand "${brandName}" and all of its models?`)) return;
    const db = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
    delete db[brandName];
    localStorage.setItem('as_cars_db', JSON.stringify(db));
    Object.assign(CARS_DB, db);
    
    showToast(`Brand "${brandName}" deleted successfully!`, 'success');
    window.renderDatabaseManager();
    initAddCarDropdowns();
    updateStats();
  };

  window.deleteModel = (brandName, modelName) => {
    if (!confirm(`Are you sure you want to delete the model "${modelName}" from "${brandName}"?`)) return;
    const db = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
    if (db[brandName] && db[brandName].models) {
      delete db[brandName].models[modelName];
    }
    if (db[brandName] && db[brandName].modelPictures) {
      delete db[brandName].modelPictures[modelName];
    }
    localStorage.setItem('as_cars_db', JSON.stringify(db));
    Object.assign(CARS_DB, db);
    
    showToast(`Model "${modelName}" deleted from "${brandName}"!`, 'success');
    window.renderDatabaseManager();
    updateStats();
  };

  window.openModelEditModal = (brandName, modelName) => {
    const brandData = CARS_DB[brandName];
    if (!brandData) return;
    const years = brandData.models[modelName];
    const pic = brandData.modelPictures ? brandData.modelPictures[modelName] : '';

    document.getElementById('em-brand-name').value = brandName;
    document.getElementById('em-model-name-orig').value = modelName;
    document.getElementById('em-model-name').value = modelName;
    
    const yearsStr = Array.isArray(years) ? `${years[0]}-${years[years.length - 1]}` : years;
    document.getElementById('em-years').value = yearsStr;

    document.getElementById('em-pic-method').value = 'url';
    window.toggleEditCarPicInput();

    document.getElementById('em-pic-url').value = pic || '';
    document.getElementById('em-pic-file').value = '';
    document.getElementById('em-alert').innerHTML = '';

    openModal('edit-model-modal');
  };

  window.toggleEditCarPicInput = () => {
    const method = document.getElementById('em-pic-method').value;
    document.getElementById('em-pic-url-group').style.display = method === 'url' ? 'block' : 'none';
    document.getElementById('em-pic-file-group').style.display = method === 'upload' ? 'block' : 'none';
  };

  document.getElementById('em-save-btn').onclick = () => {
    const brand = document.getElementById('em-brand-name').value;
    const modelOrig = document.getElementById('em-model-name-orig').value;
    const modelNew = document.getElementById('em-model-name').value.trim();
    const yearsStr = document.getElementById('em-years').value.trim();
    const method = document.getElementById('em-pic-method').value;
    const picUrl = document.getElementById('em-pic-url').value.trim();
    const picFile = document.getElementById('em-pic-file').files[0];
    const alertEl = document.getElementById('em-alert');

    if (!modelNew) { alertEl.innerHTML = '<div class="alert alert-danger">Model name is required.</div>'; return; }

    // If model name changed, check if the new name exists under any other brand
    if (modelOrig !== modelNew) {
      const dbCheck = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
      for (const [otherBrand, data] of Object.entries(dbCheck)) {
        if (data.models && data.models[modelNew]) {
          alertEl.innerHTML = `<div class="alert alert-danger">Model "${modelNew}" already exists under brand "${otherBrand}". A model can only belong to one brand.</div>`;
          return;
        }
      }
    }

    const years = parseSupportedYears(yearsStr);

    const saveEditedModel = (pictureDataUrl) => {
      const db = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
      if (!db[brand]) return;
      if (!db[brand].models) db[brand].models = {};
      if (!db[brand].modelPictures) db[brand].modelPictures = {};

      if (modelOrig !== modelNew) {
        delete db[brand].models[modelOrig];
        delete db[brand].modelPictures[modelOrig];
      }

      db[brand].models[modelNew] = years;
      if (pictureDataUrl !== undefined) {
        db[brand].modelPictures[modelNew] = pictureDataUrl;
      } else {
        db[brand].modelPictures[modelNew] = picUrl || db[brand].modelPictures[modelOrig] || '';
      }

      localStorage.setItem('as_cars_db', JSON.stringify(db));
      Object.assign(CARS_DB, db);

      closeModal('edit-model-modal');
      showToast(`Model "${modelNew}" updated successfully!`, 'success');

      window.renderDatabaseManager();
      updateStats();
    };

    if (method === 'upload' && picFile) {
      const reader = new FileReader();
      reader.onload = (e) => saveEditedModel(e.target.result);
      reader.readAsDataURL(picFile);
    } else {
      saveEditedModel(picUrl);
    }
  };

  // Run Initializations
  updateStats();
  render();
  renderReminders();
  initAddCarDropdowns();
  window.renderDatabaseManager();

  document.getElementById('v-search').addEventListener('input', function() { render(this.value.toLowerCase()); });
});
