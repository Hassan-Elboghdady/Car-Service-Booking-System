'use strict';
/* ============================================================
   AUTOSERVE — SHARED JS v2
   Data layer: auth, CRUD, CARS_DB, SERVICES, navbar, footer,
   toast, modal, validation — imported by every page
   ============================================================ */

// ─── STORAGE KEYS ────────────────────────────────────────────
const KEYS = {
  USERS: 'as_users', SESSION: 'as_session', CARS: 'as_cars',
  BOOKINGS: 'as_bookings', INVENTORY: 'as_inventory',
  REVIEWS: 'as_reviews', NOTIFICATIONS: 'as_notifications',
  STAFF_CODES: 'as_staff_codes', COUPONS: 'as_coupons',
  SERVICES_CUSTOM: 'as_services', CMS: 'as_cms',
  ISSUES: 'as_issues',
};

// ─── API FETCH HELPER (AJAX/Fetch — talks to Node.js backend) ─
const api = {
  base: '/api',
  /** Core request method — auto-attaches JWT and parses JSON. */
  async request(path, options = {}) {
    const headers = { ...options.headers };
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // The browser will automatically attach the httpOnly cookie.
    const res = await fetch(this.base + path, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },
  get(path)       { return this.request(path); },
  post(path, body){ return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },
  put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); },
  del(path)       { return this.request(path, { method: 'DELETE' }); },
  /** Upload a file (FormData) — does NOT set Content-Type so browser adds boundary. */
  upload(path, formData) {
    return this.request(path, { method: 'POST', body: formData, headers: {} });
  },
};

// ─── UI ICONS (SVG) ──────────────────────────────────────────
const SVG_ICONS = {
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  car: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 0 4 0a2 2 0 0 0-4 0zM3 16a2 2 0 1 0 4 0a2 2 0 0 0-4 0z"></path></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  crossCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  cross: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  revenue: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  trendingUp: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  reset: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`
};

// ─── CAR DATABASE — ONLY 5 BRANDS SERVICED ──────────────
const DEFAULT_CARS_DB = {
  Toyota: {
    models: {
      Corolla: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      Camry: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      Yaris: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      RAV4: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      Hilux: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      Fortuner: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      Rush: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
      Prado: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Land Cruiser': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    }, emoji: '🚗', logo: '/public/images/brands/toyota.png'
  },
  MG: {
    models: {
      'MG3': [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      'MG5': [2019, 2020, 2021, 2022, 2023, 2024, 2025],
      'MG6': [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      'MG7': [2022, 2023, 2024, 2025],
      'MG ZS': [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      'MG HS': [2019, 2020, 2021, 2022, 2023, 2024, 2025],
      'MG ONE': [2021, 2022, 2023, 2024, 2025],
      'MG RX5': [2020, 2021, 2022, 2023, 2024],
    }, emoji: '🚙', logo: '/public/images/brands/mg.png'
  },
  Hyundai: {
    models: {
      'i10': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      'Accent': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      'i20': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Elantra': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Creta': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Tucson': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Santa Fe': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Sonata': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    }, emoji: '🚗', logo: '/public/images/brands/hyundai.png'
  },
  Nissan: {
    models: {
      'Sunny': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      'Tiida': [2015, 2016, 2017, 2018, 2019, 2020],
      'Altima': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'X-Trail': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Pathfinder': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Navara': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Patrol': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    }, emoji: '🚙', logo: '/public/images/brands/nissan.png'
  },
  Chevrolet: {
    models: {
      'Spark': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      'Cruze': [2015, 2016, 2017, 2018, 2019, 2020],
      'Malibu': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      'Captiva': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Traverse': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      'Tahoe': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    }, emoji: '🚗', logo: '/public/images/brands/chevrolet.png'
  },
};

if (!localStorage.getItem('as_cars_db')) {
  localStorage.setItem('as_cars_db', JSON.stringify(DEFAULT_CARS_DB));
}
const CARS_DB = JSON.parse(localStorage.getItem('as_cars_db'));

// Global Brand Logo Helper
function getBrandLogoHtml(brandName, size = '24px') {
  if (!brandName) return `🚗`;
  const name = brandName.trim();
  const db = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
  const brand = db[name];

  if (name.toLowerCase() === 'honda' && (!brand || !brand.logo)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="vertical-align:middle;margin-right:6px;color:var(--primary);display:inline-block;" fill="currentColor"><path d="M5.3 3h2v7.7H16.7V3h2v18h-2v-8.3H7.3V21h-2V3z"/></svg>`;
  }

  if (brand && brand.logo) {
    // Normalise legacy ../../public/ paths to /public/
    const logoSrc = brand.logo.replace(/^(\.\.\/)+Public\//, '/public/');
    return `<img src="${logoSrc}" alt="${name}" style="width:${size};height:${size};object-fit:contain;vertical-align:middle;margin-right:6px;border-radius:4px;display:inline-block;" onerror="this.outerHTML='🚗'">`;
  }

  return `<span style="font-size:1.1rem;margin-right:6px;vertical-align:middle;display:inline-block;">🚗</span>`;
}

// Global Car Image Helper
function getCarImage(brand, model) {
  if (!brand || !model) return '/public/images/brands/toyota.png';
  const db = JSON.parse(localStorage.getItem('as_cars_db')) || DEFAULT_CARS_DB;
  if (db[brand] && db[brand].modelPictures && db[brand].modelPictures[model]) {
    return db[brand].modelPictures[model];
  }
  const CAR_IMAGES = {
    Toyota: {
      Corolla: '/public/images/cars/toyota/Corolla.jpg',
      Camry: '/public/images/cars/toyota/Camry.jpg',
      Yaris: '/public/images/cars/toyota/Yaris.jpg',
      RAV4: '/public/images/cars/toyota/RAV4.jpg',
      Hilux: '/public/images/cars/toyota/Hilux.jpg',
      Fortuner: '/public/images/cars/toyota/Fortuner.jpg',
      Rush: '/public/images/cars/toyota/Rush.jpg',
      Prado: '/public/images/cars/toyota/Prado.jpg',
      'Land Cruiser': '/public/images/cars/toyota/LandCruiser.jpg',
    },
    MG: {
      'MG3': '/public/images/cars/mg/MG3.jpg',
      'MG5': '/public/images/cars/mg/MG5.jpg',
      'MG6': '/public/images/cars/mg/MG6.jpg',
      'MG7': '/public/images/cars/mg/MG7.jpg',
      'MG ZS': '/public/images/cars/mg/MGZS.jpg',
      'MG HS': '/public/images/cars/mg/MGHS.jpg',
      'MG ONE': '/public/images/cars/mg/MGONE.jpg',
      'MG RX5': '/public/images/cars/mg/MGRX5.jpg',
    },
    Hyundai: {
      'i10': '/public/images/cars/hyundai/i10.jpg',
      'Accent': '/public/images/cars/hyundai/Accent.jpg',
      'i20': '/public/images/cars/hyundai/i20.jpg',
      'Elantra': '/public/images/cars/hyundai/Elantra.jpg',
      'Creta': '/public/images/cars/hyundai/Creta.jpg',
      'Tucson': '/public/images/cars/hyundai/Tucson.jpg',
      'Santa Fe': '/public/images/cars/hyundai/SantaFe.jpg',
      'Sonata': '/public/images/cars/hyundai/Sonata.jpg',
    },
    Nissan: {
      'Sunny': '/public/images/cars/nissan/Sunny.jpg',
      'Tiida': '/public/images/cars/nissan/Tiida.jpg',
      'Altima': '/public/images/cars/nissan/Altima.jpg',
      'X-Trail': '/public/images/cars/nissan/XTrail.jpg',
      'Pathfinder': '/public/images/cars/nissan/Pathfinder.jpg',
      'Navara': '/public/images/cars/nissan/Navara.jpg',
      'Patrol': '/public/images/cars/nissan/Patrol.jpg',
    },
    Chevrolet: {
      'Spark': '/public/images/cars/chevrolet/Spark.jpg',
      'Cruze': '/public/images/cars/chevrolet/Cruze.jpg',
      'Malibu': '/public/images/cars/chevrolet/Malibu.jpg',
      'Captiva': '/public/images/cars/chevrolet/Captiva.jpg',
      'Traverse': '/public/images/cars/chevrolet/Traverse.jpg',
      'Tahoe': '/public/images/cars/chevrolet/Tahoe.jpg',
    },
  };
  return (CAR_IMAGES[brand] && CAR_IMAGES[brand][model])
    ? CAR_IMAGES[brand][model]
    : '/public/images/brands/' + brand.toLowerCase() + '.png';
}


// ─── CAR TIER — Economy=1, Mid=2, Premium=3 ─────────────
const CAR_TIER = {
  'Yaris': 1, 'Corolla': 1, 'Rush': 1, 'Spark': 1, 'Cruze': 1,
  'i10': 1, 'Accent': 1, 'MG3': 1, 'MG5': 1, 'Sunny': 1, 'Tiida': 1,
  'Camry': 2, 'RAV4': 2, 'Hilux': 2, 'Fortuner': 2,
  'Elantra': 2, 'Creta': 2, 'Tucson': 2, 'Sonata': 2, 'Malibu': 2,
  'MG ZS': 2, 'MG6': 2, 'MG HS': 2, 'MG ONE': 2, 'MG RX5': 2,
  'Altima': 2, 'X-Trail': 2, 'Navara': 2, 'Captiva': 2, 'i20': 2,
  'Land Cruiser': 3, 'Prado': 3, 'Patrol': 3, 'Santa Fe': 3,
  'MG7': 3, 'Tahoe': 3, 'Traverse': 3, 'Pathfinder': 3,
};

// ─── MILEAGE PACKAGE PRICING by tier (EGP) ────────────────────
const MILEAGE_PRICES = {
  'pkg-10k': { 1: 550, 2: 750, 3: 1100 },
  'pkg-20k': { 1: 850, 2: 1150, 3: 1700 },
  'pkg-30k': { 1: 1250, 2: 1700, 3: 2500 },
  'pkg-40k': { 1: 1500, 2: 2000, 3: 3000 },
  'pkg-50k': { 1: 1800, 2: 2400, 3: 3600 },
  'pkg-60k': { 1: 2200, 2: 2900, 3: 4500 },
  'pkg-70k': { 1: 2500, 2: 3300, 3: 5000 },
  'pkg-80k': { 1: 2800, 2: 3700, 3: 5500 },
  'pkg-90k': { 1: 3100, 2: 4100, 3: 6200 },
  'pkg-100k': { 1: 4000, 2: 5500, 3: 8500 },
};

function getMileagePrice(pkgId, model) {
  const tier = CAR_TIER[model] || 1;
  return (MILEAGE_PRICES[pkgId] || {})[tier] || 0;
}

// ─── SERVICES CATALOGUE ───────────────────────────────
const SERVICES_DEFAULT = [
  // ── MAINTENANCE ──
  { id: 's01', name: 'Oil Change', cat: 'maintenance', emoji: '🛢️', price: 299, duration: '1h', popular: true, desc: 'Engine oil change with new filter. Grade chosen by your car model — synthetic or semi-synthetic.' },
  { id: 's06', name: 'Tyre Rotation', cat: 'maintenance', emoji: '🔄', price: 149, duration: '45m', popular: false, desc: 'Rotate all 4 tyres for even tread wear and extended tyre life.' },
  { id: 's08', name: 'Battery Replacement', cat: 'maintenance', emoji: '🔋', price: 349, duration: '30m', popular: false, desc: 'Battery load test and OEM replacement with 1-year warranty.' },
  { id: 's09', name: 'Wheel Alignment', cat: 'maintenance', emoji: '⚖️', price: 249, duration: '1h', popular: false, desc: '4-wheel computerised laser alignment plus tyre balancing.' },
  { id: 's16', name: 'Coolant Flush', cat: 'maintenance', emoji: '💧', price: 249, duration: '1h', popular: false, desc: 'Full cooling system drain, flush, and refill with new coolant.' },
  { id: 's19', name: 'Spark Plugs Replacement', cat: 'maintenance', emoji: '⚡', price: 350, duration: '1.5h', popular: true, desc: 'Replace all spark plugs for better fuel economy, smoother idle, and engine performance.' },
  { id: 's20', name: 'Air Filter Replacement', cat: 'maintenance', emoji: '🌬️', price: 150, duration: '30m', popular: false, desc: 'Engine air filter replacement to maintain airflow and protect the engine.' },
  { id: 's21', name: 'Cabin Air Filter', cat: 'maintenance', emoji: '🍃', price: 130, duration: '20m', popular: false, desc: 'Replace cabin filter to keep AC air clean and allergen-free.' },
  { id: 's22', name: 'Fuel Filter Replacement', cat: 'maintenance', emoji: '⛽', price: 280, duration: '1h', popular: false, desc: 'Replace fuel filter to protect injectors and maintain engine performance.' },
  { id: 's23', name: 'Power Steering Fluid', cat: 'maintenance', emoji: '🚿', price: 180, duration: '45m', popular: false, desc: 'Flush and replace power steering fluid for smooth, responsive steering.' },
  { id: 's24', name: 'Brake Fluid Flush', cat: 'maintenance', emoji: '🧪', price: 220, duration: '45m', popular: false, desc: 'Full brake fluid exchange to prevent fade and system corrosion.' },
  { id: 's25', name: 'Timing Belt Replacement', cat: 'maintenance', emoji: '🔗', price: 950, duration: '4h', popular: false, desc: 'Timing belt + tensioner + water pump. Critical protection for your engine.' },
  { id: 's26', name: 'Drive Belt Inspection', cat: 'maintenance', emoji: '〰️', price: 200, duration: '45m', popular: false, desc: 'Inspect and replace serpentine/drive belt to prevent sudden failure.' },
  { id: 's27', name: 'PCV Valve Replacement', cat: 'maintenance', emoji: '🔩', price: 180, duration: '30m', popular: false, desc: 'Replace PCV valve to reduce emissions and prevent oil sludge.' },
  // ── REPAIR ──
  { id: 's04', name: 'Brake Service', cat: 'repair', emoji: '🛑', price: 599, duration: '2.5h', popular: true, desc: 'Brake pad replacement with rotor inspection and full brake system bleed.' },
  { id: 's05', name: 'Engine Diagnostics', cat: 'repair', emoji: '⚙️', price: 199, duration: '1h', popular: true, desc: 'Full OBD-II diagnostic scan with fault code report and recommendations.' },
  { id: 's07', name: 'AC Repair & Recharge', cat: 'repair', emoji: '❄️', price: 449, duration: '2h', popular: true, desc: 'AC gas recharge, compressor inspection, evaporator and filter service.' },
  { id: 's10', name: 'Engine Repair', cat: 'repair', emoji: '🔧', price: 1499, duration: '6h+', popular: false, desc: 'Major or minor engine repair by certified technicians using OEM parts.' },
  { id: 's11', name: 'Suspension Service', cat: 'repair', emoji: '🏋️', price: 699, duration: '3h', popular: false, desc: 'Shock absorbers, struts, ball joints and full suspension inspection.' },
  { id: 's12', name: 'Transmission Service', cat: 'repair', emoji: '🧲', price: 899, duration: '4h', popular: false, desc: 'Auto or manual transmission fluid change and system inspection.' },
  { id: 's15', name: 'Windshield Repair', cat: 'repair', emoji: '🪟', price: 199, duration: '1h', popular: false, desc: 'Chip and crack repair using professional UV resin injection.' },
  { id: 's28', name: 'Radiator Service', cat: 'repair', emoji: '♨️', price: 550, duration: '2h', popular: false, desc: 'Radiator flush, leak check, and hose inspection to prevent overheating.' },
  { id: 's29', name: 'Exhaust System Repair', cat: 'repair', emoji: '💨', price: 480, duration: '2h', popular: false, desc: 'Exhaust pipe, muffler and catalytic converter inspection and repair.' },
  { id: 's30', name: 'Fuel Injector Cleaning', cat: 'repair', emoji: '💉', price: 380, duration: '1.5h', popular: false, desc: 'Ultrasonic fuel injector cleaning to restore atomisation and economy.' },
  { id: 's31', name: 'Starter Motor Repair', cat: 'repair', emoji: '🔑', price: 650, duration: '2h', popular: false, desc: 'Diagnose and repair or replace starter motor and related electrical.' },
  { id: 's32', name: 'Alternator Repair', cat: 'repair', emoji: '🔌', price: 700, duration: '2.5h', popular: false, desc: 'Test and replace alternator to keep your battery charged while driving.' },
  { id: 's33', name: 'Head Gasket Inspection', cat: 'repair', emoji: '🩺', price: 350, duration: '1.5h', popular: false, desc: 'Compression test and coolant check to detect head gasket failure early.' },
  // ── CLEANING ──
  { id: 's02', name: 'Basic Car Wash', cat: 'cleaning', emoji: '🫧', price: 99, duration: '45m', popular: true, desc: 'Exterior foam wash, hand dry, glass clean and tyre shine.' },
  { id: 's03', name: 'Full Detailing', cat: 'cleaning', emoji: '✨', price: 799, duration: '5h', popular: true, desc: 'Full interior & exterior detail — clay bar, machine polish, wax, vacuuming.' },
  { id: 's13', name: 'Interior Steam Clean', cat: 'cleaning', emoji: '🌡️', price: 399, duration: '3h', popular: false, desc: 'High-pressure steam for seats, carpet, dashboard and door trims.' },
  { id: 's14', name: 'Paint Protection Film', cat: 'cleaning', emoji: '🛡️', price: 1999, duration: '8h', popular: false, desc: 'Full-body or partial PPF installation to protect your paint for years.' },
  { id: 's17', name: 'Headlight Restoration', cat: 'cleaning', emoji: '💡', price: 199, duration: '1.5h', popular: false, desc: 'Oxidised headlight polishing with UV sealant coating.' },
  { id: 's18', name: 'Window Tinting', cat: 'cleaning', emoji: '🕶️', price: 499, duration: '3h', popular: false, desc: 'Professional heat-blocking ceramic window tint application.' },
  { id: 's34', name: 'Engine Bay Cleaning', cat: 'cleaning', emoji: '🧼', price: 250, duration: '1.5h', popular: false, desc: 'Steam clean and degrease engine bay for a factory-fresh look.' },
];

// ─── STORAGE HELPERS ──────────────────────────────────────────
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  remove(k) { localStorage.removeItem(k); },
};

// ─── GENERIC CRUD ─────────────────────────────────────────────
const getAll = k => store.get(k) || [];
const getById = (k, id) => getAll(k).find(i => i.id === id);
const saveAll = (k, arr) => store.set(k, arr);
const upsert = (k, item) => { const a = getAll(k); const i = a.findIndex(x => x.id === item.id); i >= 0 ? a[i] = item : a.push(item); saveAll(k, a); };
const removeById = (k, id) => saveAll(k, getAll(k).filter(i => i.id !== id));
const genId = (p = 'id') => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── SEED DATA ────────────────────────────────────────────────
function seedData() {

  if (!store.get(KEYS.STAFF_CODES)) {
    store.set(KEYS.STAFF_CODES, [
      { id: 'sc1', code: 'STAFF-2026-ALPHA', createdBy: 'u_admin', usedBy: null, active: true, createdAt: '2026-01-15' },
      { id: 'sc2', code: 'STAFF-2026-BETA', createdBy: 'u_admin', usedBy: 'u_staff1', active: false, createdAt: '2026-02-01' },
    ]);
  }
  if (!store.get(KEYS.CARS)) {
    store.set(KEYS.CARS, [
      { id: 'c1', owner: 'u_cust1', brand: 'Toyota', model: 'Camry', year: 2021, plate: 'أ ب ج 1234', color: 'Silver', emoji: '🚗' },
      { id: 'c2', owner: 'u_cust1', brand: 'Honda', model: 'Civic', year: 2019, plate: 'د ه و 5678', color: 'Black', emoji: '🚗' },
      { id: 'c3', owner: 'u_cust2', brand: 'MG', model: 'MG ZS', year: 2023, plate: 'ز ح ط 9090', color: 'Red', emoji: '🚙' },
    ]);
  }
  if (!store.get(KEYS.BOOKINGS)) {
    store.set(KEYS.BOOKINGS, [
      { id: 'b1', userId: 'u_cust1', carId: 'c1', serviceId: 's01', date: '2026-04-10', time: '10:00', status: 'completed', notes: '', total: 299, assignedStaff: '', createdAt: '2026-04-05' },
      { id: 'b2', userId: 'u_cust1', carId: 'c2', serviceId: 's02', date: '2026-04-15', time: '14:00', status: 'pending', notes: 'Full wash please', total: 99, assignedStaff: '', createdAt: '2026-04-09' },
      { id: 'b3', userId: 'u_cust2', carId: 'c3', serviceId: 's03', date: '2026-04-12', time: '09:00', status: 'in_progress', notes: '', total: 799, assignedStaff: '', createdAt: '2026-04-08' },
    ]);
  }
  if (!store.get(KEYS.INVENTORY)) {
    store.set(KEYS.INVENTORY, [
      { id: 'i1', name: 'Engine Oil 5W-30', icon: '🛢️', qty: 48, unit: 'quarts', lowAt: 10 },
      { id: 'i2', name: 'Air Filter', icon: '🌬️', qty: 20, unit: 'pcs', lowAt: 5 },
      { id: 'i3', name: 'Brake Pads', icon: '🔧', qty: 8, unit: 'sets', lowAt: 3 },
      { id: 'i4', name: 'Wiper Blades', icon: '🪟', qty: 15, unit: 'pcs', lowAt: 4 },
      { id: 'i5', name: 'Coolant', icon: '💧', qty: 30, unit: 'litres', lowAt: 8 },
      { id: 'i6', name: 'Car Shampoo', icon: '🫧', qty: 25, unit: 'bottles', lowAt: 6 },
      { id: 'i7', name: 'Battery 12V', icon: '🔋', qty: 6, unit: 'pcs', lowAt: 2 },
      { id: 'i8', name: 'PPF Roll', icon: '🛡️', qty: 4, unit: 'm²', lowAt: 2 },
    ]);
  }
  if (!store.get(KEYS.REVIEWS)) {
    store.set(KEYS.REVIEWS, [
      { id: 'r1', userId: 'u_cust1', bookingId: 'b1', rating: 5, text: 'Excellent service! Very professional staff.', status: 'approved', createdAt: '2026-04-11' },
      { id: 'r2', userId: 'u_cust2', bookingId: 'b3', rating: 4, text: 'Great detailing job. Will come back.', status: 'approved', createdAt: '2026-04-13' },
    ]);
  }
  if (!store.get(KEYS.NOTIFICATIONS)) {
    store.set(KEYS.NOTIFICATIONS, [
      { id: 'n1', userId: 'all', type: 'promo', title: 'Spring Sale!', message: 'Get 20% off all detailing services this month.', read: false, createdAt: '2026-04-01' },
      { id: 'n2', userId: 'u_cust1', type: 'booking', title: 'Booking Confirmed', message: 'Your oil change is confirmed for Apr 10.', read: true, createdAt: '2026-04-05' },
    ]);
  }
  if (!store.get(KEYS.SERVICES_CUSTOM)) {
    store.set(KEYS.SERVICES_CUSTOM, SERVICES_DEFAULT);
  }
  if (!store.get(KEYS.CMS)) {
    store.set(KEYS.CMS, {
      heroTitle: 'Your Car Deserves the Best Care',
      heroSubtitle: 'Professional car servicing, maintenance & detailing — bookable in under 2 minutes.',
      heroCTA: 'Book a Service',
      announcementBanner: '🎉 Grand Opening Special — 20% off all services this month!',
      faqs: [
        { q: 'How do I cancel a booking?', a: 'You can cancel from My Bookings page at least 4 hours before your appointment.' },
        { q: 'Do you offer pickup/drop?', a: 'Yes! Free pickup within 10 km for Premium bookings.' },
        { q: 'What payment methods?', a: 'We accept cash, credit/debit cards, and bank transfer.' },
      ]
    });
  }
}

// ─── AUTH ─────────────────────────────────────────────────────
const auth = {
  login(email, password) {
    const user = getAll(KEYS.USERS).find(u => u.email === email && u.password === password);
    if (user) { store.set(KEYS.SESSION, user); return user; }
    return null;
  },
  register(data) {
    const users = getAll(KEYS.USERS);
    if (users.find(u => u.email === data.email)) return { error: 'Email already registered.' };
    if (users.find(u => u.phone === data.phone)) return { error: 'Phone number already registered to another account.' };
    const user = { id: genId('u'), points: 0, createdAt: todayStr(), ...data };
    users.push(user);
    saveAll(KEYS.USERS, users);
    store.set(KEYS.SESSION, user);
    return user;
  },
  logout() { store.remove(KEYS.SESSION); },
  current() { return store.get(KEYS.SESSION); },
  isLoggedIn() { return !!store.get(KEYS.SESSION); },
  updateCurrent(data) {
    const u = auth.current(); if (!u) return;
    Object.assign(u, data); store.set(KEYS.SESSION, u); upsert(KEYS.USERS, u); return u;
  },
};

// ─── BOOKINGS ─────────────────────────────────────────────────
const bookingsAPI = {
  async forUser(uid) { try { const r = await api.get('/bookings/mine'); return (r.data || []).map(formatBackendBooking); } catch(e) { return []; } },
  async forStaff(sid) { try { const r = await api.get('/bookings/all'); return (r.data || []).filter(b => b.assignedStaff && (b.assignedStaff._id === sid || b.assignedStaff.id === sid)).map(formatBackendBooking); } catch(e) { return []; } },
  async create(data) { try { const r = await api.post('/bookings', data); return formatBackendBooking(r.data); } catch(e) { return null; } },
  async updateStatus(id, status) { try { const r = await api.put(`/bookings/${id}/status`, { status }); return formatBackendBooking(r.data); } catch(e) { return null; } },
  async withDetails(id) { try { const r = await api.get(`/bookings/${id}`); return formatBackendBooking(r.data); } catch(e) { return null; } },
  async allWithDetails() { try { const r = await api.get('/bookings/all'); return (r.data || []).map(formatBackendBooking); } catch(e) { return []; } },
  async assignStaff(id, staffId) { try { const r = await api.put(`/bookings/${id}/assign`, { staffId }); return formatBackendBooking(r.data); } catch(e) { return null; } },
  async remove(id) { try { await api.del(`/bookings/${id}`); return true; } catch(e) { return false; } },
};

function formatBackendBooking(b) {
  if (!b) return null;
  const svcs = getAll(KEYS.SERVICES_CUSTOM).length ? getAll(KEYS.SERVICES_CUSTOM) : SERVICES_DEFAULT;
  return {
    ...b,
    id: b._id || b.id,
    carId: b.carId?._id || b.carId?.id || b.carId,
    userId: b.userId?._id || b.userId?.id || b.userId,
    assignedStaff: b.assignedStaff?._id || b.assignedStaff?.id || b.assignedStaff || '',
    car: b.carId || {},
    service: svcs.find(s => s.id === b.serviceId) || {},
    user: b.userId || {},
    staff: b.assignedStaff || {},
  };
}

// ─── SERVICES ACCESS ──────────────────────────────────────────
function getServices() {
  const svcs = getAll(KEYS.SERVICES_CUSTOM).length ? getAll(KEYS.SERVICES_CUSTOM) : SERVICES_DEFAULT;
  return svcs.map(s => {
    if (!s.img) {
      const def = SERVICES_DEFAULT.find(d => d.id === s.id);
      if (def && def.img) s.img = def.img;
    }
    return s;
  });
}

// ─── CARS API ─────────────────────────────────────────────────
const carsAPI = {
  async forUser(uid) { try { const r = await api.get('/cars'); return r.data || []; } catch(e) { return []; } },
  async add(data) { const r = await api.post('/cars', data); return r.data; },
  async remove(id) { await api.del('/cars/' + id); },
};

// ─── REVIEWS API ──────────────────────────────────────────────
const reviewsAPI = {
  async getApproved() { try { const r = await api.get('/reviews/approved'); return r.data || []; } catch(e) { return []; } },
  async getAll() { try { const r = await api.get('/reviews/all'); return r.data || []; } catch(e) { return []; } },
  async add(data) { try { const r = await api.post('/reviews', data); return r.data; } catch(e) { return null; } },
  async updateStatus(id, status) { try { const r = await api.put(`/reviews/${id}/status`, { status }); return r.data; } catch(e) { return null; } },
  async remove(id) { try { await api.del(`/reviews/${id}`); return true; } catch(e) { return false; } },
};

// ─── INVENTORY API ────────────────────────────────────────────
const inventoryAPI = {
  async getAll() { try { const r = await api.get('/inventory'); return r.data || []; } catch(e) { return []; } },
  async add(data) { try { const r = await api.post('/inventory', data); return r.data; } catch(e) { throw e; } },
  async update(id, data) { try { const r = await api.put(`/inventory/${id}`, data); return r.data; } catch(e) { throw e; } },
  async remove(id) { try { await api.del(`/inventory/${id}`); return true; } catch(e) { throw e; } },
  async adjust(id, delta) { try { const r = await api.put(`/inventory/${id}/adjust`, { delta }); return r.data; } catch(e) { throw e; } },
};

// ─── STAFF CODES ──────────────────────────────────────────────
const staffCodesAPI = {
  isValid(code) {
    const codes = getAll(KEYS.STAFF_CODES);
    return codes.find(c => c.code === code && c.active && !c.usedBy);
  },
  markUsed(code, userId) {
    const codes = getAll(KEYS.STAFF_CODES);
    const c = codes.find(x => x.code === code);
    if (c) { c.usedBy = userId; c.active = false; saveAll(KEYS.STAFF_CODES, codes); }
  },
  generate() {
    const code = 'STAFF-' + Date.now().toString(36).toUpperCase();
    const entry = { id: genId('sc'), code, createdBy: auth.current()?.id, usedBy: null, active: true, createdAt: todayStr() };
    upsert(KEYS.STAFF_CODES, entry); return code;
  },
};

// ─── VALIDATION ───────────────────────────────────────────────
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = v => /^\+?[\d\s\-()]{7,16}$/.test(v);
const required = v => v && v.trim().length > 0;

function fieldError(id, msg) {
  const el = document.getElementById(id); if (!el) return;
  el.classList.add('is-invalid');
  const p = el.parentElement.querySelector('.form-error') || (() => { const d = document.createElement('div'); d.className = 'form-error'; el.parentElement.appendChild(d); return d; })();
  p.textContent = msg;
}
function clearError(id) { const el = document.getElementById(id); if (!el) return; el.classList.remove('is-invalid'); const p = el.parentElement.querySelector('.form-error'); if (p) p.remove(); }
function clearErrors(formId) { const f = document.getElementById(formId); if (!f) return; f.querySelectorAll('.is-invalid').forEach(e => e.classList.remove('is-invalid')); f.querySelectorAll('.form-error').forEach(e => e.remove()); }

// ─── STATUS MAP ───────────────────────────────────────────────
const STATUS = {
  pending: { label: 'Pending', badge: 'badge-yellow', step: 1 },
  in_progress: { label: 'In Progress', badge: 'badge-blue', step: 3 },
  completed: { label: 'Completed', badge: 'badge-green', step: 5 },
  cancelled: { label: 'Cancelled', badge: 'badge-gray', step: 0 },
};
function statusBadge(s) { const m = STATUS[s] || { label: s, badge: 'badge-gray' }; return `<span class="badge ${m.badge}">${m.label}</span>`; }

// ─── DATE HELPERS ─────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

// ─── TOAST ───────────────────────────────────────────────────-
function showToast(msg, type = 'info') {
  let root = document.getElementById('toast-root');
  if (!root) { root = document.createElement('div'); root.id = 'toast-root'; document.body.appendChild(root); }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  root.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3800);
}

// ─── MODAL ────────────────────────────────────────────────────
function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('open'); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open')); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) closeAllModals(); });

// ─── NOTIFICATIONS API ────────────────────────────────────────
function notify(data) {
  const notifs = getAll(KEYS.NOTIFICATIONS);
  const n = {
    id: genId('n'),
    userId: data.userId || 'admin',
    message: data.message,
    type: data.type || 'info',
    icon: data.icon || '🔔',
    read: false,
    createdAt: new Date().toISOString()
  };
  notifs.push(n);
  saveAll(KEYS.NOTIFICATIONS, notifs);
  return n;
}

// ─── TABS ─────────────────────────────────────────────────────
/**
 * Flexible tab initializer
 * @param {string} wrapperId - ID of the container with .tab-btn elements
 * @param {string} contentPrefix - Prefix for the target panel IDs
 * @param {string} dataAttr - The data-attribute to read (default: tab)
 */
function initTabs(wrapperId, contentPrefix = 'tab-', dataAttr = 'tab') {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;

  const buttons = wrap.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate all buttons in this wrapper
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Get target ID
      const targetSuffix = btn.getAttribute(`data-${dataAttr}`);
      const targetId = contentPrefix + targetSuffix;

      // Handle panels
      // First, try to find panels within the same parent/context or globally
      const allPanels = document.querySelectorAll(`[id^="${contentPrefix}"]`);
      allPanels.forEach(p => {
        if (p.id.startsWith(contentPrefix)) p.style.display = 'none';
      });

      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.style.display = 'block';
        targetPanel.classList.add('active');
      }
    });
  });
}

// ─── SIDEBAR (admin/staff) ────────────────────────────────────
function initSidebar() {
  const btn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!btn || !sidebar) return;

  let isOpen = true; // desktop starts open

  const applyState = (open) => {
    isOpen = open;
    if (window.innerWidth <= 768) {
      sidebar.style.transform = open ? 'translateX(0)' : 'translateX(-100%)';
      if (overlay) overlay.style.display = open ? 'block' : 'none';
    } else {
      const mc = document.querySelector('.main-content');
      sidebar.style.transform = open ? '' : 'translateX(-100%)';
      if (mc) mc.style.marginLeft = open ? '' : '0';
    }
  };

  btn.addEventListener('click', () => applyState(!isOpen));

  if (overlay) {
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:195;display:none;';
    overlay.addEventListener('click', () => applyState(false));
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      if (overlay) overlay.style.display = 'none';
      sidebar.style.transform = '';
      const mc = document.querySelector('.main-content');
      if (mc) mc.style.marginLeft = '';
      isOpen = true;
    }
  });
}

// ─── NAVBAR BUILDER ───────────────────────────────────────────
const NAV_PAGES = [
  { href: 'index.ejs', label: 'Home' },
  { href: 'services.ejs', label: 'Services' },
  { href: 'cars.ejs', label: 'Cars' },
  { href: 'booking.ejs', label: 'Booking' },
  { href: 'my-bookings.ejs', label: 'My Bookings' },
  { href: 'tracker.ejs', label: 'Tracker' },
  { href: 'contact.ejs', label: 'Contact' },
];

function buildNavbar(active = '') {
  const user = auth.current();
  const links = NAV_PAGES.map(p => `<a href="${p.href}" class="${active.includes(p.href) ? 'active' : ''}">${p.label}</a>`).join('');

  const userHtml = user
    ? `<div class="nav-avatar" title="${user.firstName} ${user.lastName}" onclick="window.location='profile.ejs'">${user.firstName.charAt(0).toUpperCase()}</div>
       <div style="display:flex; flex-direction:column; gap:2px">
         ${user.role === 'admin' ? '<a href="admin-dashboard.ejs" style="font-size:0.7rem; color:var(--primary); font-weight:700">Admin Panel</a>' : ''}
         ${user.role === 'staff' ? '<a href="staff-dashboard.ejs" style="font-size:0.7rem; color:var(--primary); font-weight:700">Staff Panel</a>' : ''}
       </div>
       <button class="btn btn-ghost btn-sm" onclick="doLogout()">Logout</button>`
    : `<a href="login.ejs" class="btn btn-primary btn-sm">Login / Register</a>`;

  const html = `
  <nav class="navbar">
    <div class="container">
      <a href="index.ejs" class="nav-brand" style="display:flex;align-items:center;">
        <img src="/public/images/LogoBrand/AutoServeLogo.jpg" alt="AutoServe Logo" style="height: 40px; border-radius: 6px;">
        <div class="name" style="margin-left:10px;font-weight:800;font-size:1.4rem;color:var(--text)">Auto<span style="color:var(--primary)">Serve</span></div>
      </a>
      <div class="nav-links">${links}</div>
      <div class="nav-right">
        ${userHtml}
        <button class="hamburger" id="hamburger-btn" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>
  <div class="mobile-nav" id="mobile-nav">
    ${NAV_PAGES.map(p => `<a href="${p.href}">${p.label}</a>`).join('')}
    <div class="divider"></div>
    ${user ? `
      <a href="profile.ejs">👤 Profile (${user.firstName})</a>
      ${user.role === 'admin' ? '<a href="admin-dashboard.ejs">⚙️ Admin Panel</a>' : ''}
      ${user.role === 'staff' ? '<a href="staff-dashboard.ejs">🔧 Staff Panel</a>' : ''}
      <a href="#" onclick="doLogout()">🚪 Logout</a>
    ` : '<a href="login.ejs">🔑 Login / Register</a>'}
  </div>`;

  const wrap = document.getElementById('navbar-wrap');
  if (wrap) { wrap.innerHTML = html; initHamburger(); }
}

function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => { btn.classList.toggle('open'); nav.classList.toggle('open'); });
}

async function doLogout() { try { await fetch('/api/users/logout', {method:'POST'}); } catch(e){} auth.logout(); showToast('Logged out successfully', 'success'); setTimeout(() => location.href = 'login.ejs', 700); }

// ─── FOOTER BUILDER ───────────────────────────────────────────
function buildFooter() {
  const cms = store.get(KEYS.CMS) || {};
  const fbUrl = cms.facebook || 'https://facebook.com';
  const igUrl = cms.instagram || 'https://instagram.com';
  const twUrl = cms.twitter || 'https://x.com';
  const ytUrl = cms.youtube || 'https://youtube.com';

  const html = `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="index.ejs" style="display:flex;align-items:center;margin-bottom:15px;text-decoration:none;">
            <img src="/public/images/LogoBrand/AutoServeLogo.jpg" alt="AutoServe Logo" style="height: 45px; border-radius: 6px;">
            <div class="name" style="margin-left:10px;font-weight:800;font-size:1.6rem;color:#fff">Auto<span style="color:var(--primary)">Serve</span></div>
          </a>
          <p class="footer-desc">Egypt's premier car service booking platform. Professional maintenance, repairs & detailing.</p>
          <div class="footer-social">
            <!-- Facebook -->
            <a href="${fbUrl}" target="_blank" title="Facebook" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:#1877F2;transition:opacity .2s;opacity:.9" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.9">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.12 22 17 22 12z"/></svg>
            </a>
            <!-- Instagram -->
            <a href="${igUrl}" target="_blank" title="Instagram" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);transition:opacity .2s;opacity:.9" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.9">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.265.069 1.645.069 4.849s-.012 3.584-.069 4.849c-.062 1.366-.333 2.633-1.308 3.608-.975.976-2.242 1.246-3.608 1.308-1.265.058-1.645.069-4.849.069s-3.584-.012-4.849-.069c-1.366-.062-2.633-.333-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.849c.062-1.366.333-2.633 1.308-3.608C4.516 2.495 5.783 2.225 7.149 2.163 8.414 2.105 8.794 2.163 12 2.163zm0-2.163C8.741 0 8.333.014 7.053.072 5.197.157 3.355.673 2.014 2.014.673 3.355.157 5.197.072 7.053.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.085 1.856.6 3.698 1.942 5.039C3.355 23.327 5.197 23.843 7.053 23.928 8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.856-.085 3.698-.6 5.039-1.942 1.341-1.341 1.857-3.183 1.942-5.039C23.986 15.668 24 15.259 24 12s-.014-3.667-.072-4.947c-.085-1.856-.601-3.698-1.942-5.039C20.645.673 18.803.157 16.947.072 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
            <!-- X (Twitter) -->
            <a href="${twUrl}" target="_blank" title="X (Twitter)" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:#000;transition:opacity .2s;opacity:.9" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.9">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.21 2.25h6.945l4.265 5.638L18.244 2.25zm-1.16 17.52h1.832L7.045 4.126H5.076L17.084 19.77z"/></svg>
            </a>
            <!-- YouTube -->
            <a href="${ytUrl}" target="_blank" title="YouTube" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:#FF0000;transition:opacity .2s;opacity:.9" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.9">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
        <div>
          <h4>Services</h4>
          <div class="footer-links">
            <a href="services.ejs">Maintenance</a>
            <a href="services.ejs">Detailing</a>
            <a href="services.ejs">Repairs</a>
            <a href="booking.ejs">Book Now</a>
          </div>
        </div>
        <div>
          <h4>Account</h4>
          <div class="footer-links">
            <a href="profile.ejs">My Profile</a>
            <a href="my-bookings.ejs">My Bookings</a>
            <a href="tracker.ejs">Service Tracker</a>
            <a href="terms.ejs">Terms & Conditions</a>
          </div>
        </div>
        <div>
          <h4>Contact</h4>
          <div class="footer-links">
            <a href="contact.ejs">📍 ${cms.address || 'Nasr City, Cairo'}</a>
            <a href="tel:${cms.phone1 || '+20225015000'}">📞 ${cms.phone1 || '+202 2501 5000'}</a>
            <a href="mailto:${cms.email || 'hello@autoserve.eg'}">✉️ ${cms.email || 'hello@autoserve.eg'}</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 AutoServe Egypt.</span>
        <span><a href="terms.ejs">Terms</a> · <a href="contact.ejs">Contact</a></span>
      </div>
    </div>
  </footer>`;
  const wrap = document.getElementById('footer-wrap');
  if (wrap) wrap.innerHTML = html;
}

// ─── AUTH GUARD HELPERS ───────────────────────────────────────
function requireLogin(msg = 'Please login to access this page.') {
  if (!auth.isLoggedIn()) {
    showToast(msg, 'warning');
    setTimeout(() => location.href = 'login.ejs', 700);
    return false;
  }
  return true;
}
function requireRole(role, redirect = 'index.ejs') {
  const u = auth.current();
  if (!u) { showToast('Access denied', 'error'); setTimeout(() => location.href = redirect, 600); return false; }
  const roles = Array.isArray(role) ? role : [role];
  // Admin can always access any page
  if (u.role === 'admin') return true;
  // Staff can access customer-facing pages (booking, my-bookings, tracker, etc.)
  if (roles.includes('customer') && (u.role === 'staff' || u.userType === 'staff')) return true;
  if (roles.includes(u.role)) return true;
  showToast('Access denied', 'error'); setTimeout(() => location.href = redirect, 600); return false;
}
function showAuthGuard(containerId, message = 'Login or create an account to access this feature.') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="auth-guard">
      <div class="auth-guard-icon">🔒</div>
      <h3>${message}</h3>
      <p>You need to be signed in to continue.</p>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap">
        <a href="login.ejs" class="btn btn-primary">Login</a>
        <a href="login.ejs#register" class="btn btn-outline">Create Account</a>
      </div>
    </div>`;
}

// ─── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  seedData();
  buildFooter();
  const page = location.pathname.split('/').pop() || 'index.ejs';
  buildNavbar(page);
});


