// services.js
'use strict';

// --- MILEAGE PACKAGES (10k ? 100k) ---------------------------
const MILEAGE_PKGS = [
  {
    id: 'pkg-10k', name: '10,000 km Service', emoji: '🛣️', duration: '2h', popular: true,
    tagline: 'Essential routine service',
    desc: 'The standard every-10,000-km check. Keeps your engine healthy and catches small issues early.',
    includes: ['Engine oil change (grade by model)', 'Oil filter replacement', 'Engine air filter inspection', 'Tyre rotation & pressure check', 'All fluid levels top-up', 'Visual inspection report'],
    pricing: { economy: 550, mid: 750, highend: 1100 },
    models: { economy: 'Yaris, Spark, Accent, i10, Sunny, MG3, MG5', mid: 'Corolla, Camry, Elantra, MG ZS, MG HS, Altima, X-Trail, Captiva, Malibu', highend: 'Land Cruiser, Prado, Patrol, Santa Fe, Tahoe, Traverse, MG7' },
  },
  {
    id: 'pkg-20k', name: '20,000 km Service', emoji: '🛣️', duration: '3h', popular: false,
    tagline: 'Full health check service',
    desc: 'Everything in 10k + cabin filter, brake inspection, battery test and full fluid check.',
    includes: ['All 10k items', 'Cabin air filter replacement', 'Brake pad & disc inspection', 'Coolant level & condition check', 'Power steering fluid check', 'Battery voltage & health test'],
    pricing: { economy: 850, mid: 1150, highend: 1700 },
    models: { economy: 'Yaris, Spark, Accent, i10, Sunny, MG3, MG5', mid: 'Corolla, Camry, Elantra, MG ZS, Altima, X-Trail, Captiva', highend: 'Land Cruiser, Prado, Patrol, Santa Fe, Tahoe, MG7' },
  },
  {
    id: 'pkg-30k', name: '30,000 km Service', emoji: '🛣️', duration: '4.5h', popular: false,
    tagline: 'Major periodic service',
    desc: 'Everything in 20k + spark plugs, transmission fluid check, drive belt & full OBD diagnostics.',
    includes: ['All 20k items', 'Spark plug replacement', 'Transmission fluid inspection', 'Drive belt inspection', 'Hose & clamp check', 'Full OBD-II diagnostics scan'],
    pricing: { economy: 1250, mid: 1700, highend: 2500 },
    models: { economy: 'Yaris, Spark, Accent, i10, Sunny, MG3, Cruze', mid: 'Corolla, Camry, MG ZS, MG HS, Altima, Elantra, Navara', highend: 'Land Cruiser, Patrol, Prado, Santa Fe, Tahoe, Traverse, MG7' },
  },
  {
    id: 'pkg-40k', name: '40,000 km Service', emoji: '🛣️', duration: '5h', popular: false,
    tagline: 'Intermediate deep service',
    desc: 'Everything in 30k + fuel filter replacement, throttle body cleaning, AC filter check.',
    includes: ['All 30k items', 'Fuel filter replacement', 'Throttle body cleaning', 'AC cabin filter replacement', 'Fuel system inspection', 'Tyre balancing'],
    pricing: { economy: 1500, mid: 2000, highend: 3000 },
    models: { economy: 'Yaris, Spark, Accent, i10, MG3, Cruze', mid: 'Corolla, Camry, MG ZS, Elantra, Altima, Captiva', highend: 'Land Cruiser, Patrol, Prado, Santa Fe, MG7, Tahoe' },
  },
  {
    id: 'pkg-50k', name: '50,000 km Service', emoji: '🛣️', duration: '5.5h', popular: false,
    tagline: 'Half-century full check',
    desc: 'Everything in 40k + brake fluid flush, cooling system service, wheel alignment & PCV valve.',
    includes: ['All 40k items', 'Brake fluid flush', 'Coolant system flush & refill', 'Wheel alignment & balancing', 'PCV valve inspection', 'Wiper blade replacement'],
    pricing: { economy: 1800, mid: 2400, highend: 3600 },
    models: { economy: 'Yaris, Spark, Accent, i10, Sunny, MG3', mid: 'Corolla, Camry, Elantra, MG ZS, Altima, Malibu', highend: 'Land Cruiser, Patrol, Prado, Santa Fe, Traverse' },
  },
  {
    id: 'pkg-60k', name: '60,000 km Major Service', emoji: '🛣️', duration: '7h', popular: false,
    tagline: 'Comprehensive overhaul',
    desc: 'The big 60k service. Timing belt, gearbox fluid, full brake system, AC recharge & alignment.',
    includes: ['All 50k items', 'Timing belt & tensioner (if applicable)', 'Gearbox / transfer case fluid service', 'Full brake system service', 'AC gas recharge & inspection', 'Full undercarriage inspection'],
    pricing: { economy: 2200, mid: 2900, highend: 4500 },
    models: { economy: 'Yaris, Spark, Accent, i10, MG3', mid: 'Corolla, Camry, MG ZS, Elantra, X-Trail, Malibu', highend: 'Land Cruiser, Patrol, Prado, Santa Fe, Tahoe, Traverse' },
  },
  {
    id: 'pkg-70k', name: '70,000 km Service', emoji: '🛣️', duration: '6h', popular: false,
    tagline: 'Post-60k follow-up',
    desc: 'Everything in 60k + spark plugs (2nd set), injector cleaning, power steering fluid flush.',
    includes: ['All 60k items', 'Spark plug replacement (2nd cycle)', 'Fuel injector cleaning', 'Power steering fluid flush', 'Air intake cleaning', 'Battery full inspection & load test'],
    pricing: { economy: 2500, mid: 3300, highend: 5000 },
    models: { economy: 'Yaris, Spark, Accent, i10, MG3', mid: 'Corolla, Camry, MG ZS, Altima, Elantra, Captiva', highend: 'Land Cruiser, Patrol, Prado, Santa Fe, Tahoe, MG7' },
  },
  {
    id: 'pkg-80k', name: '80,000 km Service', emoji: '🛣️', duration: '6.5h', popular: false,
    tagline: 'High-mileage thorough check',
    desc: 'Everything in 70k + transmission service, suspension inspection, fuel pressure test.',
    includes: ['All 70k items', 'Transmission fluid change', 'Suspension & steering inspection', 'Fuel pressure test', 'Drive shaft boots inspection', 'Exhaust system inspection'],
    pricing: { economy: 2800, mid: 3700, highend: 5500 },
    models: { economy: 'Yaris, Spark, Accent, i10, Sunny', mid: 'Corolla, Camry, MG ZS, Altima, X-Trail, Malibu', highend: 'Land Cruiser, Patrol, Prado, Santa Fe, Tahoe' },
  },
  {
    id: 'pkg-90k', name: '90,000 km Service', emoji: '🛣️', duration: '7h', popular: false,
    tagline: 'Pre-100k overhaul',
    desc: 'Everything in 80k + coolant flush, brake master cylinder check, full safety inspection.',
    includes: ['All 80k items', 'Full coolant system flush', 'Brake master cylinder inspection', 'Differential fluid service (4WD)', 'Full safety & lights inspection', 'Serpentine belt replacement'],
    pricing: { economy: 3100, mid: 4100, highend: 6200 },
    models: { economy: 'Yaris, Spark, Accent, i10, MG3', mid: 'Corolla, Camry, Elantra, MG ZS, Altima', highend: 'Land Cruiser, Patrol, Prado, Santa Fe, Tahoe, MG7' },
  },
  {
    id: 'pkg-100k', name: '100,000 km Major Overhaul', emoji: '🛣️', duration: '9h+', popular: false,
    tagline: 'Full 100k birthday service',
    desc: 'The most comprehensive package. Every system inspected and refreshed  your car feels brand new.',
    includes: ['All 90k items', 'Timing belt + water pump + tensioner', 'Clutch inspection (manual)', 'Engine top-end inspection', 'Full alignment & 4-wheel balancing', 'Comprehensive diagnostic report'],
    pricing: { economy: 4000, mid: 5500, highend: 8500 },
    models: { economy: 'Yaris, Spark, Accent, i10, Sunny, MG3', mid: 'Corolla, Camry, Elantra, MG ZS, Altima, Malibu', highend: 'Land Cruiser, Patrol, Prado, Santa Fe, Tahoe, MG7, Traverse' },
  },
];

// --- CATALOGUE RENDER -----------------------------------------
let currentCat = 'all';

async function loadCustomServicesFromDb() {
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
    console.warn('Could not load services from database.', error);
  }
}

function renderServices(cat) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  const svcs = getServices();
  const filtered = cat === 'all' ? svcs : svcs.filter(s => s.cat === cat);
  grid.innerHTML = '';

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:60px 20px"><div class="empty-icon">🔧?</div><p>No services found in this category.</p></div>`;
    return;
  }

  filtered.forEach(svc => {
    const catLabel = { maintenance: 'Maintenance', cleaning: 'Cleaning', repair: 'Repair' }[svc.cat] || svc.cat;
    const catIcon  = { maintenance: SVG_ICONS.checkCircle, cleaning: SVG_ICONS.checkCircle, repair: SVG_ICONS.checkCircle }[svc.cat] || SVG_ICONS.checkCircle;
    const catGrad  = {
      maintenance: 'linear-gradient(135deg,#fff5f5,#ffe4e8)',
      repair:      'linear-gradient(135deg,#fff1f1,#fde8e8)',
      cleaning:    'linear-gradient(135deg,#f0fff4,#e0f7fa)',
    }[svc.cat] || 'linear-gradient(135deg,#f5f5f5,#e8e8e8)';
    const div = document.createElement('div');
    div.className = 'svc-card animate-fade-in';
    div.innerHTML = `
        <div class="svc-card-img" style="background:${catGrad};">
          <img src="${getServiceImageUrl(svc)}" alt="${svc.name}" onerror="this.onerror=null;this.src='/services/default-service.jpeg'" />
          <span style="position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);color:#fff;font-size:.68rem;font-weight:700;padding:4px 11px;border-radius:99px;letter-spacing:.4px;">${catIcon} ${catLabel}</span>
          ${svc.popular ? '<span class="badge badge-red" style="position:absolute;top:10px;right:10px;">Popular</span>' : ''}
        </div>

      <div class="svc-card-body">
        <h3>${svc.name}</h3>
        <p>${svc.desc || ''}</p>
        <div class="svc-card-meta">
          <div class="svc-price">EGP ${svc.price.toLocaleString()}</div>
          <div class="svc-duration" style="display:inline-flex;align-items:center;gap:6px;">${SVG_ICONS.clock} ${svc.duration}</div>
        </div>
        <a href="booking.ejs?service=${svc.id}" class="btn btn-primary btn-sm btn-block" style="margin-top:14px"
           onclick="gateBooking(event,'booking.ejs?service=${svc.id}')">Book Now →</a>
      </div>`;
    grid.appendChild(div);
  });
}

// --- MILEAGE PACKAGES RENDER ----------------------------------
function renderMileagePkgs() {
  const grid = document.getElementById('mileage-grid');
  if (!grid) return;

  // Merge built-in MILEAGE_PKGS with any admin-added custom packages
  const customPkgs  = store.get('as_mileage_pkgs')    || [];
  const adminPrices = store.get('as_mileage_prices')  || {};
  const hiddenIds   = store.get('as_hidden_builtins') || [];

  // Generate model strings based on current tiers
  const tierModels = (function() {
    const tiers = store.get('as_car_tiers') || (typeof CAR_TIER !== 'undefined' ? CAR_TIER : {});
    const eco=[], mid=[], prem=[];
    for(let m in tiers){
      if(tiers[m]===1) eco.push(m);
      if(tiers[m]===2) mid.push(m);
      if(tiers[m]===3) prem.push(m);
    }
    return {
      economy: eco.length ? eco.slice(0, 8).join(', ') + (eco.length>8?', ...':'') : 'Economy cars',
      mid: mid.length ? mid.slice(0, 8).join(', ') + (mid.length>8?', ...':'') : 'Mid-range cars',
      highend: prem.length ? prem.slice(0, 8).join(', ') + (prem.length>8?', ...':'') : 'Premium cars'
    };
  })();

  // Filter out hidden built-ins, apply admin-edited prices and dynamic models
  const builtIn = MILEAGE_PKGS
    .filter(p => !hiddenIds.includes(p.id))
    .map(p => {
      const ap = adminPrices[p.id];
      if (!ap) return { ...p, models: tierModels };
      return { ...p, models: tierModels, pricing: { economy: ap[1]||p.pricing.economy, mid: ap[2]||p.pricing.mid, highend: ap[3]||p.pricing.highend } };
    });

  // Build extra custom package cards
  const extras = customPkgs.map(c => {
    const ap = adminPrices[c.id] || {};
    return {
      id: c.id, name: c.name, emoji: '🛣️', duration: c.dur || '', popular: false,
      tagline: c.desc || 'Custom mileage service package',
      desc: c.desc || 'Admin-defined mileage service package.',
      includes: (c.includes && c.includes.length > 0) ? c.includes : ['See service advisor for full details'],
      pricing: { economy: ap[1]||0, mid: ap[2]||0, highend: ap[3]||0 },
      models: tierModels,
    };
  });

  const allPkgs = [...builtIn, ...extras].sort((a, b) => {
    const kA = parseInt((a.id||'').replace(/\D/g,'')) || 0;
    const kB = parseInt((b.id||'').replace(/\D/g,'')) || 0;
    return kA - kB;
  });

  grid.innerHTML = allPkgs.map(pkg => `
    <div class="mileage-pkg-card ${pkg.popular ? 'mileage-popular' : ''}">
      ${pkg.popular ? '<div class="mileage-pop-badge">Most Popular ⭐</div>' : ''}

      <div class="mpkg-header">
        ${renderServiceIconHtml(pkg,'3.5rem')}
        <div class="mpkg-name">${pkg.name}</div>
        <div class="mpkg-tagline">${pkg.tagline}</div>
        <div class="mpkg-duration">⏱️ ${pkg.duration}</div>
      </div>

      <div class="mpkg-body">
        <p class="mpkg-desc">${pkg.desc}</p>

        <div class="mpkg-price-tiers">
          <div class="mpkg-tier economy">
            <div class="tier-label">Economy Cars</div>
            <div class="tier-price">${pkg.pricing.economy ? 'EGP ' + pkg.pricing.economy.toLocaleString() : 'Call us'}</div>
            <div class="tier-models">${pkg.models.economy}</div>
          </div>
          <div class="mpkg-tier mid">
            <div class="tier-label">Mid-Range</div>
            <div class="tier-price">${pkg.pricing.mid ? 'EGP ' + pkg.pricing.mid.toLocaleString() : 'Call us'}</div>
            <div class="tier-models">${pkg.models.mid}</div>
          </div>
          <div class="mpkg-tier premium">
            <div class="tier-label">Premium</div>
            <div class="tier-price">${pkg.pricing.highend ? 'EGP ' + pkg.pricing.highend.toLocaleString() : 'Call us'}</div>
            <div class="tier-models">${pkg.models.highend}</div>
          </div>
        </div>

        <div class="mpkg-includes">
          <div class="mpkg-includes-title">📋 What's Included:</div>
          ${pkg.includes.map(item => `<div class="mpkg-include-item">✓ ${item}</div>`).join('')}
        </div>

        <a href="booking.ejs" class="btn btn-primary btn-block" style="margin-top:20px"
           onclick="gateBooking(event,'booking.ejs')">Book This Package →</a>
      </div>
    </div>`).join('');
}

// --- FILTER BUTTONS -------------------------------------------
document.querySelectorAll('.svc-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.svc-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    renderServices(currentCat);
  });
});

// --- BOOKING GATE ---------------------------------------------
window.gateBooking = (e, url) => {
  if (!auth.isLoggedIn()) {
    e.preventDefault();
    showToast('Please login or create an account to book a service.', 'warning');
    setTimeout(() => location.href = 'login.ejs', 800);
  }
};

// --- CUSTOM REQUEST -------------------------------------------
document.getElementById('custom-submit')?.addEventListener('click', () => {
  const name    = document.getElementById('c-name').value.trim();
  const phone   = document.getElementById('c-phone').value.trim();
  const svc     = document.getElementById('c-svc').value.trim();
  const alertEl = document.getElementById('custom-alert');
  if (!name || !phone || !svc) {
    alertEl.innerHTML = '<div class="alert alert-danger">Please fill in all required fields.</div>'; return;
  }
  alertEl.innerHTML = '<div class="alert alert-success">✅ Your request has been submitted! We\'ll contact you within 2 hours.</div>';
  ['c-name','c-phone','c-svc','c-car','c-details'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  showToast('Custom request sent! ✅', 'success');
  setTimeout(() => alertEl.innerHTML = '', 5000);
});

// --- INIT -----------------------------------------------------
loadCustomServicesFromDb().finally(() => {
  renderServices('all');
  renderMileagePkgs();
});
