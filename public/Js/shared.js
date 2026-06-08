'use strict';
/* ============================================================
   AUTOSERVE — SHARED JS v2
   Data layer: auth, CRUD, CARS_DB, SERVICES, navbar, footer,
   toast, modal, validation — imported by every page
   ============================================================ */

const DEFAULT_FAVICON = '/public/LogoBrand/AutoServeLogo.jpg';
const existingIcon = document.querySelector('link[rel~="icon"]');
if (!existingIcon) {
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/jpeg';
  icon.href = DEFAULT_FAVICON;
  document.head.appendChild(icon);
}

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
  /** Core request method — auto-attaches JWT cookie and parses JSON. */
  async request(path, options = {}) {
    const headers = { ...options.headers };
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // credentials: 'include' ensures the httpOnly cookie is sent with every request
    const res = await fetch(this.base + path, { ...options, headers, credentials: 'include' });
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
  checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="20 8 12 17 8 13"></polyline></svg>`,
  car: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l1.5-4.5A2 2 0 0 1 7.5 6h9a2 2 0 0 1 1.9 1.3L20 12"></path><path d="M4 12h16v5a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1H10v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z"></path><path d="M7 18v-2"></path><path d="M17 18v-2"></path></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 7 12 12 15 14"></polyline></svg>`,
  crossCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  cross: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  revenue: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  trendingUp: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  reset: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`,
  oilChange: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="8" width="8" height="10" rx="2"></rect><path d="M9 8V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3"></path><path d="M13 8h4l2 2v2"></path><path d="M17 14a1.5 1.5 0 0 1-3 0c0-.83.67-2 1.5-2s1.5 1.17 1.5 2z"></path></svg>`,
  tyreRotation: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3"></path><path d="M12 19v3"></path><path d="M2 12h3"></path><path d="M19 12h3"></path><path d="M17 5l4 4"></path><path d="M7 19l-4-4"></path></svg>`,
  batteryReplacement: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="14" height="10" rx="2"></rect><path d="M18 10h2"></path><path d="M18 14h2"></path><path d="M8 11h4"></path><path d="M8 13h4"></path></svg>`,
  batteryCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="14" height="10" rx="2"></rect><path d="M18 10h2"></path><polyline points="8 13 11 16 16 11"></polyline></svg>`,
  wheelAlignment: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"></circle><path d="M12 5v14"></path><path d="M5 12h14"></path><path d="M16 8l4-4"></path><path d="M8 16l-4 4"></path></svg>`,
  coolantFlush: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v5a5 5 0 0 1-10 0V7z"></path><path d="M12 7V4"></path><path d="M10 13.5c0-1.25.75-2.5 2-2.5s2 1.25 2 2.5c0 1.2-.8 2.5-2 2.5s-2-1.25-2-2.5z"></path></svg>`,
  sparkPlugsReplacement: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8v4h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1.5l-2.5 6h-3l-2.5-6H8a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2V2z"></path><path d="M12 11v4"></path><path d="M11 19h2"></path></svg>`,
  airFilterReplacement: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="6" width="14" height="12" rx="2"></rect><path d="M8 9h8"></path><path d="M8 12h8"></path><path d="M8 15h8"></path><path d="M3 10l2 2"></path><path d="M3 14l2-2"></path><path d="M21 10l-2 2"></path><path d="M21 14l-2-2"></path></svg>`,
  cabinAirFilter: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="6" width="14" height="12" rx="2"></rect><path d="M5 10h14"></path><path d="M5 13h14"></path><path d="M5 16h14"></path><path d="M3 8l2 2"></path><path d="M3 16l2-2"></path><path d="M21 8l-2 2"></path><path d="M21 16l-2-2"></path></svg>`,
  fuelFilterReplacement: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h9v10H6z"></path><path d="M10 7V5h4v2"></path><path d="M15 11h4"></path><path d="M15 13h4"></path><path d="M9 14l-1 3"></path><path d="M15 14l1 3"></path></svg>`,
  powerSteeringFluid: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h4"></path><path d="M14 12h4"></path><circle cx="12" cy="12" r="6"></circle><path d="M16 8l4-4"></path><path d="M12 14v4"></path></svg>`,
  brakeFluidFlush: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h10v9H5z"></path><path d="M8 8V5h4v3"></path><path d="M12 13c1.2 0 2-.9 2-2s-1-2-2-2-2 .9-2 2 .8 2 2 2z"></path><path d="M16 11h4"></path></svg>`,
  timingBeltReplacement: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="12" r="3"></circle><circle cx="16" cy="12" r="3"></circle><path d="M11 12h2"></path><path d="M6 9l2-2"></path><path d="M6 15l2 2"></path><path d="M18 9l-2-2"></path><path d="M18 15l-2 2"></path></svg>`,
  driveBeltInspection: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="6" rx="3"></rect><path d="M8 9v6"></path><path d="M16 9v6"></path><circle cx="18" cy="18" r="3"></circle><line x1="19.5" y1="19.5" x2="22" y2="22"></line></svg>`,
  pcvValveReplacement: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l4 4-4 4-4-4 4-4z"></path><path d="M12 8v12"></path><path d="M8 18h8"></path></svg>`,
  brakeService: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"></circle><path d="M12 6v12"></path><path d="M6 12h4"></path><path d="M14 10h4"></path></svg>`,
  engineDiagnostics: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h8a1 1 0 0 1 1 1v5H4z"></path><path d="M5 11V8h5"></path><path d="M6 14h4"></path><path d="M8 8h2"></path><circle cx="18" cy="17" r="3"></circle><line x1="20" y1="19" x2="22" y2="21"></line><polyline points="16.5 17 18 18.5 21 15.5"></polyline></svg>`,
  acRepairRecharge: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><path d="M12 7v-3"></path><path d="M12 17v3"></path><path d="M7 12H4"></path><path d="M20 12h-3"></path><path d="M8 8l-2-2"></path><path d="M16 8l2-2"></path></svg>`,
  acService: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4"></path><path d="M12 17v4"></path><path d="M3 12h4"></path><path d="M17 12h4"></path><path d="M7.5 7.5l3 3"></path><path d="M16.5 7.5l-3 3"></path></svg>`,
  engineRepair: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18v-6l6-4 6 4v6"></path><path d="M9 15l3-3 3 3"></path><path d="M12 5v3"></path></svg>`,
  suspensionService: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16"></path><path d="M18 4v16"></path><path d="M6 8h12"></path><path d="M6 16h12"></path><path d="M12 4v16"></path></svg>`,
  transmissionService: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="6" width="14" height="12" rx="2"></rect><path d="M9 10h6"></path><path d="M9 14h6"></path><path d="M12 6v4"></path></svg>`,
  windshieldRepair: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h14l-2 14H7z"></path><path d="M8 12l3-3"></path><path d="M13 16l3-3"></path></svg>`,
  radiatorService: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="5" width="12" height="14" rx="2"></rect><path d="M6 9h12"></path><path d="M6 13h12"></path><path d="M6 17h12"></path><path d="M4 11v2"></path><path d="M20 11v2"></path></svg>`,
  exhaustSystemRepair: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13h7a2 2 0 0 0 2-2v-2"></path><rect x="11" y="9" width="7" height="6" rx="2"></rect><path d="M18 9l4-2"></path><path d="M18 15l4 2"></path><path d="M19 6l2 1"></path><path d="M19 18l2 1"></path></svg>`,
  fuelInjectorCleaning: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h8v6H6z"></path><path d="M14 9h4"></path><path d="M14 11h4"></path><path d="M14 13h4"></path><path d="M18 16v3"></path><path d="M15 18l3-3"></path></svg>`,
  starterMotorRepair: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h9a1 1 0 0 1 1 1v6H4z"></path><path d="M4 10V8h7"></path><path d="M13 14h3"></path><circle cx="19" cy="14" r="3"></circle><polyline points="18 12 16 15 18 15 16 18"></polyline></svg>`,
  alternatorRepair: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><path d="M12 7v10"></path><path d="M7 12h10"></path><path d="M16 8l4-4"></path><path d="M8 16l-4 4"></path></svg>`,
  headGasketInspection: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12v10H6z"></path><path d="M9 7v10"></path><path d="M15 7v10"></path><circle cx="12" cy="12" r="2"></circle></svg>`,
  basicCarWash: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15h16l2-4H2z"></path><path d="M7 15v3"></path><path d="M11 15v3"></path><path d="M15 15v3"></path><path d="M10 10l1-3h2l1 3"></path><path d="M8 6l1-2"></path><path d="M16 6l1-2"></path></svg>`,
  carWash: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15h16l2-4H2z"></path><path d="M8 15v3"></path><path d="M12 15v3"></path><path d="M16 15v3"></path><path d="M6 9l2-3"></path><path d="M12 8l1-3"></path><path d="M18 9l-2-3"></path></svg>`,
  fullDetailing: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13l2.5-5.5h10L20 13v4H4v-4z"></path><path d="M6 13h12"></path><path d="M8 7h8"></path><path d="M7 7l1-2"></path><path d="M17 7l1-2"></path><path d="M17 4l1 2"></path><path d="M18 4l-2 1"></path></svg>`,
  interiorSteamClean: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M7 12v5"></path><path d="M17 12v5"></path><path d="M8 7c0-1 1-2 1-2s1 1 1 2-1 2-1 2-1-1-1-2z"></path><path d="M14 7c0-1 1-2 1-2s1 1 1 2-1 2-1 2-1-1-1-2z"></path></svg>`,
  paintProtectionFilm: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 4v6a7 7 0 0 1-14 0V7l7-4z"></path><path d="M12 7v5"></path><path d="M9 10h6"></path></svg>`,
  headlightRestoration: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h6l4 4H7z"></path><path d="M18 6l2 2"></path><path d="M18 10l2 2"></path><path d="M18 14l2 2"></path></svg>`,
  windowTinting: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"></rect><path d="M12 5v14"></path><path d="M9 9h6"></path><path d="M9 13h6"></path></svg>`,
  engineBayCleaning: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14v8H5z"></path><path d="M8 8v-3"></path><path d="M16 8v-3"></path><path d="M8 12h8"></path><path d="M9 15l1-2 1 2 1-2 1 2"></path></svg>`
};

const SERVICE_ICON_KEYS = Object.keys(SVG_ICONS);
const SERVICE_ICON_ALIASES = {
  'oil-change': 'oilChange',
  'tyre-rotation': 'tyreRotation',
  'tire-rotation': 'tyreRotation',
  'wheel-alignment': 'wheelAlignment',
  'air-filter': 'airFilterReplacement',
  'cabin-air-filter': 'cabinAirFilter',
  'fuel-filter': 'fuelFilterReplacement',
  'spark-plugs': 'sparkPlugsReplacement',
  'pcv-valve': 'pcvValveReplacement',
  'battery-check': 'batteryCheck',
  'ac-service': 'acService',
  'car-wash': 'carWash'
};
const SERVICE_ICON_NAME_MAP = {
  'oil change': 'oilChange',
  'tyre rotation': 'tyreRotation',
  'tire rotation': 'tyreRotation',
  'battery replacement': 'batteryReplacement',
  'battery check': 'batteryCheck',
  'wheel alignment': 'wheelAlignment',
  'coolant flush': 'coolantFlush',
  'spark plugs replacement': 'sparkPlugsReplacement',
  'air filter replacement': 'airFilterReplacement',
  'cabin air filter': 'cabinAirFilter',
  'fuel filter replacement': 'fuelFilterReplacement',
  'power steering fluid': 'powerSteeringFluid',
  'brake fluid flush': 'brakeFluidFlush',
  'timing belt replacement': 'timingBeltReplacement',
  'drive belt inspection': 'driveBeltInspection',
  'pcv valve replacement': 'pcvValveReplacement',
  'brake service': 'brakeService',
  'engine diagnostics': 'engineDiagnostics',
  'ac repair & recharge': 'acRepairRecharge',
  'ac service': 'acService',
  'engine repair': 'engineRepair',
  'suspension service': 'suspensionService',
  'transmission service': 'transmissionService',
  'windshield repair': 'windshieldRepair',
  'radiator service': 'radiatorService',
  'exhaust system repair': 'exhaustSystemRepair',
  'fuel injector cleaning': 'fuelInjectorCleaning',
  'starter motor repair': 'starterMotorRepair',
  'alternator repair': 'alternatorRepair',
  'head gasket inspection': 'headGasketInspection',
  'basic car wash': 'basicCarWash',
  'car wash': 'carWash',
  'full detailing': 'fullDetailing',
  'interior steam clean': 'interiorSteamClean',
  'paint protection film': 'paintProtectionFilm',
  'headlight restoration': 'headlightRestoration',
  'window tinting': 'windowTinting',
  'engine bay cleaning': 'engineBayCleaning'
};
const LEGACY_SERVICE_EMOJI = {
  '🛢️': 'oilChange',
  '🛢': 'oilChange',
  '🔄': 'tyreRotation',
  '🛞': 'tyreRotation',
  '🔋': 'batteryReplacement',
  '⚖️': 'wheelAlignment',
  '⚖': 'wheelAlignment',
  '💧': 'coolantFlush',
  '⚡': 'sparkPlugsReplacement',
  '🌬️': 'airFilterReplacement',
  '🍃': 'cabinAirFilter',
  '⛽': 'fuelFilterReplacement',
  '🛑': 'brakeService',
  '⚙️': 'engineDiagnostics',
  '❄️': 'acService',
  '🫧': 'carWash',
  '✨': 'fullDetailing',
  '🧼': 'carWash',
  '🔧': 'engineRepair'
};

const SERVICE_IMAGE_BASE_PATH = '/services';
const SERVICE_IMAGE_FILENAMES = {
  'ac repair and recharge': 'ac repair and recharge.jpg',
  'air filter replacement': 'Air filter replacement.jpg',
  'alternator repair': 'aternator rebair.jpg',
  'basic car wash': 'Basic Car Wash.jpg',
  'battery replacement': 'Battery Replacement.jpg',
  'brake fluid flush': 'Brake Fluid Flush.jpeg',
  'brake service': 'brake service.jpg',
  'cabin air filter': 'Cabin Air Filter.jpeg',
  'car radiator': 'car radiator.jpg',
  'fuel injector cleaning': 'fuel injection.jpg',
  'radiator service': 'car radiator.jpg',
  'coolant flush': 'Coolant Flush.jpg',
  'drive belt inspection': 'Drive Belt Inspection.jpeg',
  'engine bay cleaning': 'Engine Bay Cleaning.jpg',
  'engine diagnostics': 'engine dignostics.jpg',
  'engine repair': 'engine repair.jpg',
  'exhaust system repair': 'exhaust system repair.jpg',
  'fuel filter replacement': 'Fuel Filter Replacement.jpeg',
  'fuel injection': 'fuel injection.jpg',
  'full detailing': 'Full Detaling.jpg',
  'head gasket inspection': 'head gasket inspection.jpg',
  'headlight restoration': 'Headlight Restoration.jpg',
  'interior steam clean': 'Interior Steam Clean.jpg',
  'oil change': 'Oil Change.jpg',
  'paint protection film': 'Paint Protection Film.jpg',
  'pcv valve replacement': 'PCV Valve Replacement.jpeg',
  'power steering fluid': 'Power Steering Fluid.jpeg',
  'spark plug replacement': 'Spark plug replacement.jpg',
  'starter motor repair': 'starter motor repair.jpg',
  'suspension service': 'suspension service.jpg',
  'timing belt replacement': 'Timing Belt Replacement.jpeg',
  'transmission service': 'transmission service.jpg',
  'tyre rotation': 'Tyre rotation.jpg',
  'wheel alignment': 'Wheel alignment.jpg',
  'window tinting': 'Window Tinting.jpg',
  'windshield repair': 'windshield repair.jpeg',
};

function normalizeServiceImageName(name) {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getServiceImageFilename(service) {
  let name = '';
  if (!service) return 'default-service.jpeg';
  if (typeof service === 'string') name = service;
  else name = service.name || service.title || '';

  const normalized = normalizeServiceImageName(name);
  if (!normalized) return 'default-service.jpeg';

  if (SERVICE_IMAGE_FILENAMES[normalized]) {
    return SERVICE_IMAGE_FILENAMES[normalized];
  }

  if (normalized.includes('alternator')) return 'aternator rebair.jpg';
  if (normalized.includes('engine') && normalized.includes('diagnos')) return 'engine dignostics.jpg';
  if (normalized.includes('detail')) return 'Full Detaling.jpg';
  if (normalized.includes('brake') && normalized.includes('fluid')) return 'Brake Fluid Flush.jpeg';
  if (normalized.includes('fuel injection')) return 'fuel injection.jpg';
  if (normalized.includes('window tint')) return 'Window Tinting.jpg';
  if (normalized.includes('wheel alignment')) return 'Wheel alignment.jpg';
  if (normalized.includes('tyre') || normalized.includes('tire')) return 'Tyre rotation.jpg';
  if (normalized.includes('wash')) return 'Basic Car Wash.jpg';
  if (normalized.includes('air filter') && !normalized.includes('cabin')) return 'Air filter replacement.jpg';
  if (normalized.includes('cabin')) return 'Cabin Air Filter.jpeg';
  if (normalized.includes('pcv')) return 'PCV Valve Replacement.jpeg';
  if (normalized.includes('power steering')) return 'Power Steering Fluid.jpeg';
  if (normalized.includes('coolant')) return 'Coolant Flush.jpg';
  if (normalized.includes('spark')) return 'Spark plug replacement.jpg';
  if (normalized.includes('battery')) return 'Battery Replacement.jpg';
  if (normalized.includes('paint')) return 'Paint Protection Film.jpg';
  if (normalized.includes('headlight')) return 'Headlight Restoration.jpg';
  if (normalized.includes('interior steam')) return 'Interior Steam Clean.jpg';
  if (normalized.includes('transmission')) return 'transmission service.jpg';
  if (normalized.includes('suspension')) return 'suspension service.jpg';
  if (normalized.includes('windshield')) return 'windshield repair.jpeg';

  return 'default-service.jpeg';
}

function getServiceImageUrl(service) {
  if (service && service.image) {
    return service.image;
  }
  const filename = getServiceImageFilename(service);
  const imageUrl = `${SERVICE_IMAGE_BASE_PATH}/${filename}`;

  if (typeof console !== 'undefined' && console.debug) {
    const debugName = typeof service === 'string' ? service : service?.name || service?.title || 'unknown';
    console.debug(`[Service Image] ${debugName} -> ${imageUrl}`);
  }

  return imageUrl;
}

function renderServiceIconHtml(service, size = '3.5rem') {
  const imageUrl = getServiceImageUrl(service);
  const altText = typeof service === 'string' ? service : (service?.name || service?.title || 'Service');
  return `<span class="service-icon" style="width:${size};min-width:${size};height:${size};display:inline-flex;align-items:center;justify-content:center;overflow:hidden;border-radius:8px;background:transparent;border:1px solid rgba(0,0,0,.08);" data-service-image-path="${imageUrl}">
      <img src="${imageUrl}" alt="${altText}" data-service-image-path="${imageUrl}" onerror="this.onerror=null;this.src='${SERVICE_IMAGE_BASE_PATH}/default-service.jpeg'" style="width:100%;height:100%;object-fit:cover;display:block;" />
    </span>`;
}

function getServiceIconKey(service) {
  if (!service) return 'car';
  if (typeof service === 'string') return normalizeServiceIcon(service) || 'car';
  if (service.icon) {
    const normalized = normalizeServiceIcon(service.icon);
    if (normalized) return normalized;
  }
  if (service.emoji) {
    const emojiKey = LEGACY_SERVICE_EMOJI[service.emoji.trim()];
    if (emojiKey) return emojiKey;
  }
  const title = ((service.name || service.title) || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (SERVICE_ICON_NAME_MAP[title]) return SERVICE_ICON_NAME_MAP[title];
  if (SERVICE_ICON_ALIASES[title]) return SERVICE_ICON_ALIASES[title];
  if (title.includes('oil')) return 'oilChange';
  if (title.includes('tyre') || title.includes('tire') || title.includes('rotation')) return 'tyreRotation';
  if (title.includes('battery')) return 'batteryReplacement';
  if (title.includes('alignment')) return 'wheelAlignment';
  if (title.includes('coolant') || title.includes('fluid')) return 'coolantFlush';
  if (title.includes('spark')) return 'sparkPlugsReplacement';
  if (title.includes('air filter') || title.includes('filter') || title.includes('cabin')) return 'airFilterReplacement';
  if (title.includes('brake')) return 'brakeService';
  if (title.includes('diagnos') || title.includes('engine') || title.includes('scan') || title.includes('obd')) return 'engineDiagnostics';
  if (title.includes('wash') || title.includes('detail') || title.includes('clean') || title.includes('shampoo') || title.includes('steam')) return 'carWash';
  return 'car';
}

function getServiceIconSvg(service) {
  return SVG_ICONS[getServiceIconKey(service)] || SVG_ICONS.car;
}

function normalizeServiceIcon(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (SVG_ICONS[trimmed]) return trimmed;
  const lower = trimmed.toLowerCase();
  if (SVG_ICONS[lower]) return lower;
  if (SERVICE_ICON_ALIASES[lower]) return SERVICE_ICON_ALIASES[lower];
  if (SERVICE_ICON_KEYS.includes(trimmed)) return trimmed;
  if (SERVICE_ICON_KEYS.includes(lower)) return lower;
  return '';
}

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
let currentServerUser = null;

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
  logout() { store.remove(KEYS.SESSION); currentServerUser = null; },
  current() { return currentServerUser || store.get(KEYS.SESSION); },
  setServerUser(user) { currentServerUser = user; },
  isLoggedIn() { return !!(currentServerUser || store.get(KEYS.SESSION)); },
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
  async editBooking(id, data) { try { const r = await api.put(`/bookings/${id}/edit`, data); return formatBackendBooking(r.data); } catch(e) { throw e; } },
  async updateStatus(id, status) { try { const r = await api.put(`/bookings/${id}/status`, { status }); return formatBackendBooking(r.data); } catch(e) { return null; } },
  async withDetails(id) { try { const r = await api.get(`/bookings/${id}`); return formatBackendBooking(r.data); } catch(e) { return null; } },
  async allWithDetails() { try { const r = await api.get('/bookings/all'); return (r.data || []).map(formatBackendBooking); } catch(e) { return []; } },
  async assignStaff(id, staffId) { try { const r = await api.put(`/bookings/${id}/assign`, { staffId }); return formatBackendBooking(r.data); } catch(e) { return null; } },
  async cancel(id) { try { const r = await api.post(`/bookings/${id}/cancel`); return formatBackendBooking(r.data); } catch(e) { throw e; } },
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
  const hiddenIds = store.get('as_hidden_services') || [];
  const svcs = getAll(KEYS.SERVICES_CUSTOM).length ? getAll(KEYS.SERVICES_CUSTOM) : SERVICES_DEFAULT;
  return svcs
    .filter(s => !hiddenIds.includes(s.id))
    .map(s => {
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

// ─── BRAND API ─────────────────────────────────────────────────
const brandsAPI = {
  async getAll() { try { const r = await api.get('/brands'); return r.data || []; } catch(e) { return []; } },
  async create(data) { const r = await api.post('/brands', data); return r.data; },
  async update(name, data) { const r = await api.put(`/brands/${encodeURIComponent(name)}`, data); return r.data; },
  async remove(name) { await api.del(`/brands/${encodeURIComponent(name)}`); },
};

// ─── SERVICES API ──────────────────────────────────────────────
const servicesAPI = {
  async getAll(cat) {
    try {
      const path = cat ? `/services?cat=${encodeURIComponent(cat)}` : '/services';
      const r = await api.get(path);
      return r.data || [];
    } catch (e) {
      return [];
    }
  },
  async create(data) { const r = await api.post('/services', data); return r.data; },
  async update(id, data) { const r = await api.put(`/services/${encodeURIComponent(id)}`, data); return r.data; },
  async remove(id) { await api.del(`/services/${encodeURIComponent(id)}`); },
};

// ─── REVIEWS API ──────────────────────────────────────────────
const reviewsAPI = {
  async getApproved() { try { const r = await api.get('/reviews/approved'); return r.data || []; } catch(e) { return []; } },
  async getAll() { try { const r = await api.get('/reviews/all'); return r.data || []; } catch(e) { return []; } },
  async getPage(page = 1, limit = 5) {
    try {
      return await api.get(`/reviews/all?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`);
    } catch (e) {
      return { data: [], meta: { page, limit, total: 0, pages: 1 } };
    }
  },
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
  async isValid(code) {
    try {
      const r = await api.get(`/staff-codes/validate/${code}`);
      return r.valid;
    } catch (e) {
      return false;
    }
  },
  async generate() {
    try {
      const r = await api.post('/staff-codes');
      return r.data.code;
    } catch (e) {
      throw e;
    }
  },
  async getAll() {
    try {
      const r = await api.get('/staff-codes');
      return r.data || [];
    } catch (e) {
      return [];
    }
  }
};

// ─── COUPONS API ──────────────────────────────────────────────
const couponsAPI = {
  async getAll() {
    try {
      const r = await api.get('/coupons');
      return r.data || [];
    } catch (e) {
      return [];
    }
  },
  async create(data) {
    try {
      const r = await api.post('/coupons', data);
      return r.data;
    } catch (e) {
      throw e;
    }
  },
  async remove(id) {
    try {
      await api.del(`/coupons/${id}`);
      return true;
    } catch (e) {
      return false;
    }
  }
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
    ? `<div class="nav-avatar" title="${user.firstName} ${user.lastName}" onclick="window.location='profile.ejs'" style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary);
        color: white;
        font-weight: bold;
        cursor: pointer;
        overflow: hidden;
        ${user.profileImage ? `background-image: url('${user.profileImage}'); background-size: cover; background-position: center;` : ''}
      ">${!user.profileImage ? user.firstName.charAt(0).toUpperCase() : ''}</div>
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
        <img src="/public/LogoBrand/AutoServeLogo.jpg" alt="AutoServe Logo" style="height: 40px; border-radius: 6px;">
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

async function doLogout() { 
  try { 
    await fetch('/auth/logout', { method: 'GET' }); 
  } catch(e) { 
    try { 
      await fetch('/api/users/logout', { method: 'POST' }); 
    } catch(e2) {} 
  }
  auth.logout();
  showToast('Logged out successfully', 'success');
  setTimeout(() => location.href = '/login', 700);
}

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
            <img src="/public/LogoBrand/AutoServeLogo.jpg" alt="AutoServe Logo" style="height: 45px; border-radius: 6px;">
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

// Sync auth state with backend on every page load
async function syncAuthState() {
  const page = location.pathname.split('/').pop() || 'index.ejs';
  if (page.includes('login')) return;
  
  try {
    const response = await api.get('/users/profile');
    const user = response.data;
    
    if (user) {
      const cachedUser = store.get(KEYS.SESSION);
      const formattedUser = {
        _id: user._id,
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        staffRole: user.staffRole || '',
        userType: user.userType || '',
        profileImage: user.profileImage || '',
        phone: user.phone,
        googleId: user.googleId || '',
        points: user.points || 0
      };
      
      const shouldUpdate = !cachedUser || 
                           cachedUser.id !== user._id || 
                           cachedUser.email !== user.email || 
                           cachedUser.points !== user.points ||
                           cachedUser.role !== user.role ||
                           cachedUser.staffRole !== (user.staffRole || '') ||
                           cachedUser.profileImage !== (user.profileImage || '') ||
                           cachedUser.firstName !== user.firstName ||
                           cachedUser.lastName !== user.lastName;
                           
      if (shouldUpdate) {
        store.set(KEYS.SESSION, formattedUser);
        auth.setServerUser(formattedUser);
        buildNavbar(page);
      }
    }
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      if (store.get(KEYS.SESSION)) {
        store.remove(KEYS.SESSION);
        auth.setServerUser(null);
        buildNavbar(page);
        
        // If on protected page, redirect
        const protectedPages = ['profile.ejs', 'my-bookings.ejs', 'cars.ejs', 'admin-', 'staff-'];
        if (protectedPages.some(p => page.includes(p))) {
          showToast('Session expired. Please log in again.', 'warning');
          setTimeout(() => location.href = 'login.ejs', 1000);
        }
      }
    }
  }
}

// ─── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  seedData();
  buildFooter();
  const page = location.pathname.split('/').pop() || 'index.ejs';
  buildNavbar(page);
  initChatbot();
  syncAuthState();
});

function initChatbot() {
  const path = location.pathname.toLowerCase();
  // Only inject if not on admin or staff pages
  if (path.includes('admin') || path.includes('staff')) return;

  const chatHTML = `
    <div id="chatbot-widget" style="position:fixed;bottom:20px;right:20px;z-index:9999;">
      <!-- Chat Toggle Button -->
      <button id="chatbot-toggle" style="width:60px;height:60px;border-radius:50%;background:var(--primary);color:white;border:none;box-shadow:0 4px 12px rgba(0,0,0,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </button>
      
      <!-- Chat Window -->
      <div id="chatbot-window" style="display:none;position:absolute;bottom:80px;right:0;width:320px;height:420px;background:white;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.15);flex-direction:column;overflow:hidden;border:1px solid var(--gray-200);">
        <div style="background:var(--primary);color:white;padding:16px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:10px;height:10px;background:#4ade80;border-radius:50%;"></div>
            AutoServe Assistant
          </div>
          <button id="chatbot-close" style="background:none;border:none;color:white;cursor:pointer;font-size:1.2rem;">✕</button>
        </div>
        <div id="chatbot-messages" style="flex:1;padding:16px;overflow-y:auto;background:var(--gray-50);display:flex;flex-direction:column;gap:12px;font-size:.85rem;">
          <div style="align-self:flex-start;background:white;padding:10px 14px;border-radius:12px;border:1px solid var(--gray-200);max-width:85%;">
            Hi there! 👋 How can I help you with your car service today?
          </div>
        </div>
        <div style="padding:12px;background:white;border-top:1px solid var(--gray-200);display:flex;gap:8px;">
          <input type="text" id="chatbot-input" placeholder="Type a message..." style="flex:1;padding:8px 12px;border:1px solid var(--gray-300);border-radius:20px;outline:none;font-size:.85rem;" />
          <button id="chatbot-send" style="background:var(--primary);color:white;border:none;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', chatHTML);

  const toggleBtn = document.getElementById('chatbot-toggle');
  const closeBtn = document.getElementById('chatbot-close');
  const chatWindow = document.getElementById('chatbot-window');
  const chatInput = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');
  const messagesArea = document.getElementById('chatbot-messages');

  const toggleChat = () => {
    const isHidden = chatWindow.style.display === 'none';
    chatWindow.style.display = isHidden ? 'flex' : 'none';
    toggleBtn.style.transform = isHidden ? 'scale(0)' : 'scale(1)';
    if (isHidden) chatInput.focus();
  };

  toggleBtn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', () => {
    chatWindow.style.display = 'none';
    toggleBtn.style.transform = 'scale(1)';
  });

  const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // User message
    messagesArea.insertAdjacentHTML('beforeend', `<div style="align-self:flex-end;background:var(--primary);color:white;padding:10px 14px;border-radius:12px;max-width:85%;">${text}</div>`);
    chatInput.value = '';
    messagesArea.scrollTop = messagesArea.scrollHeight;

    // Loading indicator
    const loadingId = 'loading-' + Date.now();
    messagesArea.insertAdjacentHTML('beforeend', `<div id="${loadingId}" style="align-self:flex-start;background:white;padding:10px 14px;border-radius:12px;border:1px solid var(--gray-200);max-width:85%;color:var(--gray-500);">Typing...</div>`);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();
      
      document.getElementById(loadingId)?.remove();
      
      // Format simple markdown links and bold text if any (Gemini sometimes returns them)
      let replyHTML = data.reply || "Sorry, I couldn't process that.";
      replyHTML = replyHTML.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>'); // bold
      replyHTML = replyHTML.replace(/\\n/g, '<br>'); // newlines

      messagesArea.insertAdjacentHTML('beforeend', `<div style="align-self:flex-start;background:white;padding:10px 14px;border-radius:12px;border:1px solid var(--gray-200);max-width:85%;">${replyHTML}</div>`);
    } catch (error) {
      document.getElementById(loadingId)?.remove();
      messagesArea.insertAdjacentHTML('beforeend', `<div style="align-self:flex-start;background:#fee2e2;color:#991b1b;padding:10px 14px;border-radius:12px;border:1px solid #fecaca;max-width:85%;">Error connecting to the AI server.</div>`);
    }
    messagesArea.scrollTop = messagesArea.scrollHeight;
  };

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

// --- MILEAGE PACKAGE DEFINITIONS (base 10k?100k + admin custom) ----------
const MILEAGE_SERVICES_BASE = [
  { id:'pkg-10k',  name:'10,000 km Service',         cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'2h',   popular:true,  desc:'Oil change, air filter check, tyre rotation & visual inspection. Standard every-10k service.' },
  { id:'pkg-20k',  name:'20,000 km Service',         cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'3h',   popular:false, desc:'10k + cabin filter, brake inspection, coolant top-up & battery health test.' },
  { id:'pkg-30k',  name:'30,000 km Service',         cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'4.5h', popular:false, desc:'20k + spark plugs, transmission fluid, drive belt & hose inspection, full OBD scan.' },
  { id:'pkg-40k',  name:'40,000 km Service',         cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'5h',   popular:false, desc:'30k + fuel filter, throttle body clean, AC cabin filter & tyre balancing.' },
  { id:'pkg-50k',  name:'50,000 km Service',         cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'5.5h', popular:false, desc:'40k + brake fluid flush, coolant flush, wheel alignment & PCV valve inspection.' },
  { id:'pkg-60k',  name:'60,000 km Major Service',   cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'7h',   popular:false, desc:'50k + timing belt, gearbox fluid, full brake system, AC recharge & undercarriage check.' },
  { id:'pkg-70k',  name:'70,000 km Service',         cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'6h',   popular:false, desc:'60k + spark plugs (2nd), fuel injector clean, power steering flush & air intake clean.' },
  { id:'pkg-80k',  name:'80,000 km Service',         cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'6.5h', popular:false, desc:'70k + transmission fluid change, suspension inspection, fuel pressure test & exhaust check.' },
  { id:'pkg-90k',  name:'90,000 km Service',         cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'7h',   popular:false, desc:'80k + coolant flush, brake master cylinder check, differential fluid (4WD) & serpentine belt.' },
  { id:'pkg-100k', name:'100,000 km Major Overhaul', cat:'mileage', emoji:'🛣️', icon:'🛣️', duration:'9h+',  popular:false, desc:'The complete 100k overhaul: timing belt + water pump, engine top-end, clutch & full diagnostic report.' },
];

const MILEAGE_SERVICES = MILEAGE_SERVICES_BASE;

function getMileageServices() {
  const custom = (store.get('as_mileage_pkgs') || []).map(p => ({
    id: p.id, name: p.name, cat: 'mileage', emoji: '🛣️', icon: '✅',
    duration: p.dur || '', popular: false, desc: p.desc || '', image: p.image || ''
  }));
  const all = [...MILEAGE_SERVICES_BASE];
  custom.forEach(c => { if (!all.find(b => b.id === c.id)) all.push(c); });
  return all.sort((a, b) => {
    const kmA = parseInt((a.id || '').replace(/\D/g, '')) || 0;
    const kmB = parseInt((b.id || '').replace(/\D/g, '')) || 0;
    return kmA - kmB;
  });
}

function getAllServices() {
  return [...getServices(), ...getMileageServices()];
}

function getMileagePriceForCar(pkgId, carIdToUse = null, carObj = null) {
  // Can be called directly by booking page, or other pages if carObj provided
  const targetCar = carObj || (typeof booking !== 'undefined' && booking.carId ? userCars.find(c => (c._id || c.id) === booking.carId) : null);
  if (!targetCar) return null;
  const customTiers = store.get('as_car_tiers') || {};
  const tier = customTiers[targetCar.model] || CAR_TIER[targetCar.model] || 1;
  const customPrices = store.get('as_mileage_prices') || {};
  const priceMap = customPrices[pkgId] || (typeof MILEAGE_PRICES !== 'undefined' ? MILEAGE_PRICES[pkgId] : {}) || {};
  return priceMap[tier] || null;
}


