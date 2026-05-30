// cars.js

// Using global getCarImage(brand, model) helper from shared.js



// ─── INIT TABS ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initTabs('cars-tabs');
  buildCatalogue();
  buildMyCars();
  buildAddModal();
});

// ─── CATALOGUE ────────────────────────────────────────────────
let catalogueData = []; // flat list of {brand, model, years}
Object.entries(CARS_DB).forEach(([brand, data]) => {
  Object.entries(data.models).forEach(([model, years]) => {
    catalogueData.push({ brand, model, emoji: data.emoji, logo: data.logo, years });
  });
});

function buildCatalogue() {
  // Populate brand filter
  const bFilter = document.getElementById('brand-filter');
  Object.keys(CARS_DB).forEach(b => {
    const o = document.createElement('option'); o.value = b; o.textContent = b; bFilter.appendChild(o);
  });

  // Populate year filter
  const yFilter = document.getElementById('year-filter');
  const years = [...new Set(catalogueData.flatMap(c => c.years))].sort((a, b) => b - a);
  years.forEach(y => { const o = document.createElement('option'); o.value = y; o.textContent = y; yFilter.appendChild(o); });

  // Pre-apply brand from URL ?brand=Toyota
  const urlBrand = new URLSearchParams(location.search).get('brand');
  if (urlBrand && CARS_DB[urlBrand]) {
    bFilter.value = urlBrand;
  }

  renderCatalogue();

  document.getElementById('car-search').addEventListener('input', renderCatalogue);
  bFilter.addEventListener('change', renderCatalogue);
  yFilter.addEventListener('change', renderCatalogue);
}

function renderCatalogue() {
  const q = document.getElementById('car-search').value.toLowerCase();
  const brand = document.getElementById('brand-filter').value;
  const year = document.getElementById('year-filter').value;
  let data = catalogueData;
  if (q) data = data.filter(c => (c.brand + ' ' + c.model).toLowerCase().includes(q));
  if (brand) data = data.filter(c => c.brand === brand);
  if (year) data = data.filter(c => c.years.includes(parseInt(year)));
  document.getElementById('cars-count').textContent = `Showing ${data.length} vehicles`;
  const grid = document.getElementById('catalogue-grid');
  grid.innerHTML = '';
  data.slice(0, 60).forEach(c => {
    const div = document.createElement('div');
    div.className = 'cat-car-card';
    const latestYear = Math.max(...c.years);
    const oldestYear = Math.min(...c.years);
    div.innerHTML = `
      <div class="cat-car-img" style="background-image: url('${getCarImage(c.brand, c.model)}'); background-size: cover; background-position: center; border-bottom: 3px solid var(--primary);">
        <div class="cat-brand-logo" style="position:absolute; top:8px; right:8px; background:rgba(255,255,255,0.9); padding:4px; border-radius:4px; display:flex; align-items:center; justify-content:center;">${getBrandLogoHtml(c.brand, '28px')}</div>
        <span class="cat-car-brand-tag">${c.brand}</span>
      </div>
      <div class="cat-car-body">
        <div class="cat-car-name">${c.model}</div>
        <div class="cat-car-year">${oldestYear} – ${latestYear}</div>
        <div class="cat-car-actions">
          <button class="btn btn-outline btn-sm" onclick="showCarDetail('${c.brand}','${c.model}',${JSON.stringify(c.years).replace(/'/g, '')})">View Details</button>
          <a href="booking.ejs" class="btn btn-primary btn-sm">Book</a>
        </div>
      </div>`;
    grid.appendChild(div);
  });
}

window.showCarDetail = (brand, model, years) => {
  document.getElementById('cat-modal-title').textContent = `${brand} — ${model}`;
  document.getElementById('cat-modal-body').innerHTML = `
    <div style="text-align:center;margin-bottom:24px">
      <img src="${getCarImage(brand, model)}" alt="${brand} ${model}" style="width:100%; height:220px; object-fit:cover; border-radius:12px; margin-bottom: 16px;">
      <div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-bottom:8px">
        ${getBrandLogoHtml(brand, '35px')}
        <div style="font-size:1.5rem;font-weight:800;line-height:1">${brand} ${model}</div>
      </div>
      <div style="color:var(--gray-500);font-size:.9rem">${Math.min(...years)} – ${Math.max(...years)}</div>
    </div>
    <h4 style="margin-bottom:12px">Available Model Years</h4>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${[...years].reverse().map(y => `<span class="badge badge-blue">${y}</span>`).join('')}
    </div>
    <div class="alert alert-success" style="margin-top:20px">✅ This vehicle is supported for all AutoServe services.</div>`;
  document.getElementById('cat-book-btn').href = 'booking.ejs';
  openModal('cat-detail-modal');
};

// ─── MY VEHICLES ──────────────────────────────────────────────
async function buildMyCars() {
  const wrap = document.getElementById('my-cars-auth-wrap');
  const user = auth.current();
  if (!user) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔒</div>
        <h3>Login to See Your Vehicles</h3>
        <p>Your personal vehicles appear here after you sign in.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px">
          <a href="login.ejs" class="btn btn-primary">Login</a>
          <a href="login.ejs#register" class="btn btn-outline">Create Account</a>
        </div>
      </div>`;
    return;
  }

  const myCars = await carsAPI.forUser(user.id);
  const header = `
    <div class="flex-between mb-24" style="flex-wrap:wrap;gap:12px">
      <h3>My Vehicles (${myCars.length})</h3>
      <button class="btn btn-primary" onclick="openModal('add-car-modal')">+ Add Vehicle</button>
    </div>`;

  if (!myCars.length) {
    wrap.innerHTML = header + `
      <div class="empty-state">
        <div class="empty-icon">🚗</div>
        <h3>No Vehicles Yet</h3>
        <p>Add your first vehicle to start booking services.</p>
        <button class="btn btn-primary mt-16" onclick="openModal('add-car-modal')">+ Add Your First Car</button>
      </div>`;
    return;
  }

  wrap.innerHTML = header + `<div style="display:flex;flex-direction:column;gap:16px" id="my-cars-list"></div>`;
  renderMyCars(myCars);
}

function renderMyCars(cars) {
  const list = document.getElementById('my-cars-list');
  if (!list) return;
  list.innerHTML = cars.map(c => `
    <div class="my-car-card">
      <div class="my-car-emoji" style="border-radius:8px; overflow:hidden;">
        <img src="${getCarImage(c.brand, c.model)}" alt="${c.brand} ${c.model}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div class="my-car-info">
        <h3>${c.brand} ${c.model} (${c.year})</h3>
        <div class="my-car-meta">
          <span>🔖 ${c.plate}</span>
          <span>🎨 ${c.color}</span>
        </div>
      </div>
      <div class="my-car-actions">
        <a href="car-details.ejs?id=${c.id}" class="btn btn-outline btn-sm">View Details</a>
        <a href="booking.ejs?car=${c.id}" class="btn btn-primary btn-sm">Book Service</a>
        <button class="btn btn-danger btn-sm" onclick="confirmRemoveCar('${c.id}')">✕</button>
      </div>
    </div>`).join('');
}

window.confirmRemoveCar = async (id) => {
  const car = getById(KEYS.CARS, id);
  if (!car) return;
  if (!confirm(`Remove ${car.brand} ${car.model} from your vehicles?`)) return;
  await carsAPI.remove(id);
  showToast(`${car.brand} ${car.model} removed.`, 'success');
  buildMyCars();
};

// ─── ADD CAR MODAL ────────────────────────────────────────────
function buildAddModal() {
  const brandSel = document.getElementById('ac-brand');
  const modelSel = document.getElementById('ac-model');
  const yearSel = document.getElementById('ac-year');
  if (!brandSel) return;

  Object.keys(CARS_DB).forEach(b => {
    const o = document.createElement('option'); o.value = b; o.textContent = b; brandSel.appendChild(o);
  });

  brandSel.addEventListener('change', () => {
    modelSel.innerHTML = '<option value="">Select model…</option>';
    yearSel.innerHTML = '<option value="">Select year…</option>';
    modelSel.disabled = !brandSel.value;
    yearSel.disabled = true;
    document.getElementById('car-not-found').style.display = 'none';
    if (!brandSel.value) return;
    const models = Object.keys(CARS_DB[brandSel.value]?.models || {});
    models.forEach(m => { const o = document.createElement('option'); o.value = m; o.textContent = m; modelSel.appendChild(o); });
  });

  modelSel.addEventListener('change', () => {
    yearSel.innerHTML = '<option value="">Select year…</option>';
    yearSel.disabled = !modelSel.value;
    if (!brandSel.value || !modelSel.value) return;
    const yrs = CARS_DB[brandSel.value]?.models[modelSel.value] || [];
    [...yrs].reverse().forEach(y => { const o = document.createElement('option'); o.value = y; o.textContent = y; yearSel.appendChild(o); });
  });

  document.getElementById('add-car-btn')?.addEventListener('click', async () => {
    const brand = brandSel.value;
    const model = modelSel.value;
    const year = yearSel.value;
    const plate = document.getElementById('ac-plate').value.trim();
    const color = document.getElementById('ac-color').value.trim();
    const alert = document.getElementById('add-car-alert');

    if (!auth.isLoggedIn()) { alert.innerHTML = '<div class="alert alert-danger">Please login first.</div>'; return; }
    if (!brand) { alert.innerHTML = '<div class="alert alert-danger">Please select a brand.</div>'; return; }
    if (!model) { alert.innerHTML = '<div class="alert alert-danger">Please select a model.</div>'; return; }
    if (!year) { alert.innerHTML = '<div class="alert alert-danger">Please select a year.</div>'; return; }
    if (!plate) { alert.innerHTML = '<div class="alert alert-danger">Please enter license plate.</div>'; return; }
    if (!color) { alert.innerHTML = '<div class="alert alert-danger">Please enter color.</div>'; return; }

    await carsAPI.add({ brand, model, year: parseInt(year), plate, color, emoji: CARS_DB[brand]?.emoji || '🚗' });
    closeModal('add-car-modal');
    showToast(`${brand} ${model} added to your vehicles! 🚗`, 'success');
    brandSel.value = ''; modelSel.innerHTML = '<option value="">Select model…</option>'; modelSel.disabled = true;
    yearSel.innerHTML = '<option value="">Select year…</option>'; yearSel.disabled = true;
    document.getElementById('ac-plate').value = document.getElementById('ac-color').value = '';
    alert.innerHTML = '';
    buildMyCars();
  });
}

