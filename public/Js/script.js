/* =============================================
   CAR SERVICE BOOKING SYSTEM  SHARED JAVASCRIPT
   Uses localStorage for all data persistence
   ============================================= */

'use strict';

// --- CONSTANTS -------------------------------
const KEYS = {
  USERS: 'csb_users',
  CURRENT_USER: 'csb_current_user',
  CARS: 'csb_cars',
  BOOKINGS: 'csb_bookings',
  INVENTORY: 'csb_inventory',
  REWARDS: 'csb_rewards',
};

// --- SERVICES CATALOGUE ----------------------
const SERVICES = [
  { id: 's1', name: 'Oil Change',       icon: '🛢️',  price: 49,  duration: '1h',  category: 'maintenance' },
  { id: 's2', name: 'Car Wash',         icon: '🧼',  price: 29,  duration: '45m', category: 'cleaning'    },
  { id: 's3', name: 'Full Detailing',   icon: '?',  price: 149, duration: '4h',  category: 'cleaning'    },
  { id: 's4', name: 'Brake Service',    icon: '🛑',  price: 99,  duration: '2h',  category: 'repair'      },
  { id: 's5', name: 'Engine Repair',    icon: '🔧',  price: 299, duration: '6h',  category: 'repair'      },
  { id: 's6', name: 'Tire Rotation',    icon: '🛞',  price: 39,  duration: '1h',  category: 'maintenance' },
  { id: 's7', name: 'AC Service',       icon: '❄️',  price: 89,  duration: '2h',  category: 'repair'      },
  { id: 's8', name: 'Battery Check',    icon: '🔋',  price: 25,  duration: '30m', category: 'maintenance' },
];

// --- SEED DATA --------------------------------
function seedData() {
  // Seed users if not present

  // Seed cars
  if (!store.get(KEYS.CARS)) {
    store.set(KEYS.CARS, [
      { id: 'c1', owner: 'u2', make: 'Toyota', model: 'Camry',   year: 2021, plate: 'ABC-1234', color: 'Silver', emoji: '🚗' },
      { id: 'c2', owner: 'u2', make: 'Honda',  model: 'Civic',   year: 2019, plate: 'XYZ-5678', color: 'Black',  emoji: '🚗' },
      { id: 'c3', owner: 'u4', make: 'Ford',   model: 'Mustang', year: 2022, plate: 'GTR-9090', color: 'Red',    emoji: '🚗' },
    ]);
  }
  // Seed bookings
  if (!store.get(KEYS.BOOKINGS)) {
    store.set(KEYS.BOOKINGS, [
      { id: 'b1', userId: 'u2', carId: 'c1', serviceId: 's1', date: '2026-04-10', time: '10:00', status: 'completed', notes: '',          createdAt: '2026-04-05', assignedStaff: '', total: 49  },
      { id: 'b2', userId: 'u2', carId: 'c2', serviceId: 's2', date: '2026-04-15', time: '14:00', status: 'pending',   notes: 'Full wash',  createdAt: '2026-04-09', assignedStaff: '', total: 29  },
      { id: 'b3', userId: 'u4', carId: 'c3', serviceId: 's3', date: '2026-04-12', time: '09:00', status: 'in_progress', notes: '',         createdAt: '2026-04-08', assignedStaff: '', total: 149 },
    ]);
  }
  // Seed inventory
  if (!store.get(KEYS.INVENTORY)) {
    store.set(KEYS.INVENTORY, [
      { id: 'i1', name: 'Engine Oil 5W-30', icon: '🛢️', qty: 48, unit: 'quarts',  low: 10 },
      { id: 'i2', name: 'Air Filter',       icon: '🌬️', qty: 20, unit: 'pcs',     low: 5  },
      { id: 'i3', name: 'Brake Pads',       icon: '🛑', qty: 8,  unit: 'sets',    low: 3  },
      { id: 'i4', name: 'Wiper Blades',     icon: '🪟', qty: 15, unit: 'pcs',     low: 4  },
      { id: 'i5', name: 'Coolant',          icon: '💧', qty: 30, unit: 'liters',  low: 8  },
      { id: 'i6', name: 'Car Shampoo',      icon: '🫧', qty: 25, unit: 'bottles', low: 6  },
      { id: 'i7', name: 'Tire Inflator',    icon: '💨', qty: 4,  unit: 'units',   low: 2  },
      { id: 'i8', name: 'Battery (12V)',    icon: '🔋', qty: 6,  unit: 'pcs',     low: 2  },
    ]);
  }
}

// --- LOCAL STORAGE HELPERS ---------------------
const store = {
  get(key)      { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key)   { localStorage.removeItem(key); },
};

// --- GENERIC CRUD -----------------------------
function getAll(key)                 { return store.get(key) || []; }
function getById(key, id)            { return getAll(key).find(item => item.id === id); }
function save(key, items)            { store.set(key, items); }
function upsert(key, item)           { const all = getAll(key); const idx = all.findIndex(i => i.id === item.id); if (idx >= 0) all[idx] = item; else all.push(item); save(key, all); }
function remove(key, id)             { save(key, getAll(key).filter(i => i.id !== id)); }
function generateId(prefix = 'id')  { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }

// --- USER AUTH --------------------------------
const auth = {
  login(email, password) {
    const users = getAll(KEYS.USERS);
    const user = users.find(u => u.email === email && u.password === password);
    if (user) { store.set(KEYS.CURRENT_USER, user); return user; }
    return null;
  },
  register(data) {
    const users = getAll(KEYS.USERS);
    if (users.find(u => u.email === data.email)) return { error: 'Email already registered.' };
    const user = { id: generateId('u'), points: 0, ...data };
    users.push(user);
    save(KEYS.USERS, users);
    store.set(KEYS.CURRENT_USER, user);
    return user;
  },
  logout() { store.remove(KEYS.CURRENT_USER); },
  current() { return store.get(KEYS.CURRENT_USER); },
  isLoggedIn() { return !!store.get(KEYS.CURRENT_USER); },
  updateCurrent(data) {
    const user = auth.current();
    if (!user) return;
    Object.assign(user, data);
    store.set(KEYS.CURRENT_USER, user);
    upsert(KEYS.USERS, user);
    return user;
  },
};

// --- BOOKINGS ---------------------------------
const bookings = {
  forUser(userId) { return getAll(KEYS.BOOKINGS).filter(b => b.userId === userId); },
  forStaff(staffId) { return getAll(KEYS.BOOKINGS).filter(b => b.assignedStaff === staffId); },
  create(data) {
    const user = auth.current();
    if (!user) return null;
    // No staff assigned by default  admin assigns or mechanic claims
    const booking = { id: generateId('b'), userId: user.id, status: 'pending', createdAt: new Date().toISOString().split('T')[0], assignedStaff: '', ...data };
    upsert(KEYS.BOOKINGS, booking);
    // award 10 points per booking
    auth.updateCurrent({ points: (user.points || 0) + 10 });
    return booking;
  },
  updateStatus(id, status) {
    const all = getAll(KEYS.BOOKINGS);
    const b = all.find(b => b.id === id);
    if (b) { b.status = status; save(KEYS.BOOKINGS, all); }
  },
  getWithDetails(id) {
    const b = getById(KEYS.BOOKINGS, id);
    if (!b) return null;
    const car = getById(KEYS.CARS, b.carId);
    const service = SERVICES.find(s => s.id === b.serviceId);
    const user = getById(KEYS.USERS, b.userId);
    return { ...b, car, service, user };
  },
  getAllWithDetails() {
    return getAll(KEYS.BOOKINGS).map(b => {
      const car = getById(KEYS.CARS, b.carId);
      const service = SERVICES.find(s => s.id === b.serviceId);
      const user = getById(KEYS.USERS, b.userId);
      return { ...b, car, service, user };
    });
  },
};

// --- CARS -------------------------------------
const cars = {
  forUser(userId) { return getAll(KEYS.CARS).filter(c => c.owner === userId); },
  add(data) {
    const user = auth.current();
    if (!user) return null;
    const car = { id: generateId('c'), owner: user.id, emoji: '🚗', ...data };
    upsert(KEYS.CARS, car);
    return car;
  },
  remove(id) { remove(KEYS.CARS, id); },
};

// --- INVENTORY --------------------------------
// (Moved to backend)

// --- TOAST NOTIFICATIONS ----------------------
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '🚗'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = 'all .3s ease'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// --- MODAL HELPERS ----------------------------
function openModal(id)  { const m = document.getElementById(id); if (m) m.classList.add('open'); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open')); }

// --- NAVBAR -----------------------------------
function buildNavbar(activePage = '') {
  const nav_pages = [
    { href: 'index.ejs',       label: 'Home'       },
    { href: 'services.ejs',    label: 'Services'   },
    { href: 'cars.ejs',        label: 'Cars'       },
    { href: 'booking.ejs',     label: 'Booking'    },
    { href: 'my-bookings.ejs', label: 'My Bookings'},
    { href: 'tracker.ejs',     label: 'Tracker'    },
    { href: 'contact.ejs',     label: 'Contact'    },
  ];
  const user = auth.current();
  const linksHtml = nav_pages.map(p => `<a href="${p.href}" class="${activePage === p.href ? 'active' : ''}">${p.label}</a>`).join('');
  const userHtml = user
    ? `<div class="nav-avatar" title="${user.name} (${user.role})" onclick="handleNavAvatarClick()">${user.name.charAt(0).toUpperCase()}</div>
       <a href="profile.ejs" class="btn btn-outline btn-sm">Profile</a>
       <button class="btn btn-ghost btn-sm" onclick="handleLogout()">Logout</button>`
    : `<a href="login.ejs" class="btn btn-primary btn-sm">Login</a>`;

  return `
  <nav class="navbar">
    <div class="container">
      <a href="index.ejs" class="nav-brand">
        <div class="logo-icon">🚗</div>
        Auto<span>Serve</span>
      </a>
      <div class="nav-links">${linksHtml}</div>
      <div class="nav-actions">${userHtml}</div>
      <button class="hamburger" id="hamburger-btn" onclick="toggleMobileMenu()" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div class="mobile-menu" id="mobile-menu">
    ${nav_pages.map(p => `<a href="${p.href}" class="${activePage === p.href ? 'active' : ''}">${p.label}</a>`).join('')}
    ${user ? `<a href="profile.ejs">Profile</a><a href="#" onclick="handleLogout()">Logout</a>` : `<a href="login.ejs">Login</a>`}
  </div>`;
}

function injectNavbar(activePage) {
  const wrap = document.getElementById('navbar-wrap');
  if (wrap) wrap.innerHTML = buildNavbar(activePage);
}

function toggleMobileMenu() {
  const m = document.getElementById('mobile-menu');
  if (m) m.classList.toggle('open');
}

function handleLogout() { auth.logout(); showToast('Logged out successfully', 'success'); setTimeout(() => window.location.href = 'login.ejs', 800); }
function handleNavAvatarClick() { window.location.href = 'profile.ejs'; }

// --- FORM VALIDATION -------------------------
function validateEmail(email)    { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validatePhone(phone)    { return /^\+?[\d\s\-\(\)]{7,15}$/.test(phone); }
function validateRequired(value) { return value && value.trim().length > 0; }
function validateMinLen(v, n)    { return v && v.trim().length >= n; }

function showFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('is-invalid');
  let err = field.parentElement.querySelector('.form-error');
  if (!err) { err = document.createElement('div'); err.className = 'form-error'; field.parentElement.appendChild(err); }
  err.textContent = msg;
}
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('is-invalid');
  const err = field.parentElement.querySelector('.form-error');
  if (err) err.remove();
}
function clearAllErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.is-invalid').forEach(f => f.classList.remove('is-invalid'));
  form.querySelectorAll('.form-error').forEach(e => e.remove());
}

// --- STATUS HELPERS ---------------------------
const STATUS_MAP = {
  pending:     { label: 'Pending',     badge: 'badge-yellow' },
  in_progress: { label: 'In Progress', badge: 'badge-blue'   },
  completed:   { label: 'Completed',   badge: 'badge-green'  },
  cancelled:   { label: 'Cancelled',   badge: 'badge-gray'   },
};
function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, badge: 'badge-gray' };
  return `<span class="badge ${s.badge}">${s.label}</span>`;
}

// --- DATE HELPERS -----------------------------
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatDateTime(dateStr, timeStr) {
  return `${formatDate(dateStr)}${timeStr ? ' at ' + timeStr : ''}`;
}
function today() { return new Date().toISOString().split('T')[0]; }

// --- TABS -------------------------------------
function initTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const buttons = container.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const content = container.querySelector(`#tab-${target}`);
      if (content) content.classList.add('active');
    });
  });
}

// --- SIDEBAR ----------------------------------
function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
}

// --- GUARD ------------------------------------
function requireLogin(redirectTo = 'login.ejs') {
  if (!auth.isLoggedIn()) { window.location.href = redirectTo; return false; }
  return true;
}
function requireRole(role, redirectTo = 'index.ejs') {
  const user = auth.current();
  if (!user || user.role !== role) { showToast('Access denied', 'error'); setTimeout(() => window.location.href = redirectTo, 600); return false; }
  return true;
}

// --- REVENUE CHART ----------------------------
function renderBarChart(containerId, data, labels) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const max = Math.max(...data, 1);
  const barsHtml = data.map((v, i) => {
    const pct = Math.round((v / max) * 100);
    return `<div class="chart-bar" style="height:${pct}%" data-val="$${v}"></div>`;
  }).join('');
  const labelsHtml = labels.map(l => `<div class="chart-label">${l}</div>`).join('');
  container.innerHTML = `
    <div class="chart-bar-wrap">${barsHtml}</div>
    <div class="chart-labels">${labelsHtml}</div>`;
}

// --- REWARDS ---------------------------------
const REWARD_ITEMS = [
  { id: 'r1', icon: '🫧', name: 'Free Car Wash',      points: 50,  value: 29 },
  { id: 'r2', icon: '🛢️', name: '50% Oil Change',     points: 100, value: 25 },
  { id: 'r3', icon: '?', name: 'Free Detailing',      points: 300, value: 149},
  { id: 'r4', icon: '🛑', name: 'Free Brake Check',   points: 200, value: 99 },
  { id: 'r5', icon: '?', name: 'VIP Package',         points: 500, value: 399},
  { id: 'r6', icon: '💰', name: '$20 Credit',          points: 150, value: 20 },
];

// --- FOOTER -----------------------------------
function buildFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">Auto<span>Serve</span></div>
          <p>Premium car service booking with quality you can trust. Book online anytime, anywhere.</p>
          <div class="social-links" style="margin-top:20px">
            <a href="#" class="social-link">🚗</a>
            <a href="#" class="social-link">🚗</a>
            <a href="#" class="social-link">🚗</a>
            <a href="#" class="social-link">🚗</a>
          </div>
        </div>
        <div>
          <h4>Quick Links</h4>
          <div class="footer-links">
            <a href="index.ejs">Home</a>
            <a href="services.ejs">Services</a>
            <a href="cars.ejs">My Cars</a>
            <a href="booking.ejs">Book Now</a>
          </div>
        </div>
        <div>
          <h4>Account</h4>
          <div class="footer-links">
            <a href="login.ejs">Login</a>
            <a href="profile.ejs">Profile</a>
            <a href="my-bookings.ejs">My Bookings</a>
            <a href="rewards.ejs">Rewards</a>
          </div>
        </div>
        <div>
          <h4>Contact</h4>
          <div class="footer-links">
            <a href="contact.ejs">Contact Us</a>
            <a href="#">📍 123 Auto Lane, NY</a>
            <a href="#">📞 +1 (555) 123-4567</a>
            <a href="#">✉️ hello@autoserve.com</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 AutoServe. All rights reserved.</span>
        <span>Built with ❤️ for car lovers</span>
      </div>
    </div>
  </footer>`;
}

function injectFooter() {
  const wrap = document.getElementById('footer-wrap');
  if (wrap) wrap.innerHTML = buildFooter();
}

// --- CLOSE MODALS ON BACKDROP CLICK ----------
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) closeAllModals();
});

// --- INITIALISE ON PAGE LOAD -----------------
window.addEventListener('DOMContentLoaded', () => {
  seedData();
  injectFooter();
  // Highlight nav for current page
  const page = location.pathname.split('/').pop() || 'index.ejs';
  injectNavbar(page);
  initSidebar();
});
