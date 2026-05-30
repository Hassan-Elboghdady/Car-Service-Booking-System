// admin-settings.js
window.addEventListener('DOMContentLoaded', () => {
  seedData(); if (!requireRole('admin')) return; initSidebar();
  const user = auth.current();
  if (user) {
    document.getElementById('set-first').value = user.firstName||'';
    document.getElementById('set-last').value  = user.lastName||'';
    document.getElementById('set-email').value = user.email||'';
  }
  document.getElementById('set-acct-save').addEventListener('click', () => {
    const first = document.getElementById('set-first').value.trim();
    const last  = document.getElementById('set-last').value.trim();
    const email = document.getElementById('set-email').value.trim();
    const el    = document.getElementById('set-acct-alert');
    if (!first||!email) { el.innerHTML='<div class="alert alert-danger">Name and email required.</div>'; return; }
    const users = getAll(KEYS.USERS); const u = users.find(x=>x.id===user.id);
    if (u) { u.firstName=first; u.lastName=last; u.email=email; saveAll(KEYS.USERS, users); store.set(KEYS.SESSION,{...u}); }
    el.innerHTML='<div class="alert alert-success">Account updated!</div>';
    showToast('Account saved!','success');
    setTimeout(()=>el.innerHTML='',3000);
  });

  document.getElementById('set-pwd-save').addEventListener('click', () => {
    const cur  = document.getElementById('set-cur-pwd').value;
    const newP = document.getElementById('set-new-pwd').value;
    const conf = document.getElementById('set-conf-pwd').value;
    const el   = document.getElementById('set-pwd-alert');
    const users = getAll(KEYS.USERS); const u = users.find(x=>x.id===user.id);
    if (!u||u.password!==cur) { el.innerHTML='<div class="alert alert-danger">Current password incorrect.</div>'; return; }
    if (newP.length<8) { el.innerHTML='<div class="alert alert-danger">Password must be 8+ characters.</div>'; return; }
    if (newP!==conf)   { el.innerHTML='<div class="alert alert-danger">Passwords don\'t match.</div>'; return; }
    u.password = newP; saveAll(KEYS.USERS, users);
    el.innerHTML='<div class="alert alert-success">Password changed!</div>';
    document.getElementById('set-cur-pwd').value=document.getElementById('set-new-pwd').value=document.getElementById('set-conf-pwd').value='';
    showToast('Password changed!','success');
    setTimeout(()=>el.innerHTML='',3000);
  });
});

window.clearDemoData = () => {
  if (!confirm('Clear all demo bookings, customers, and cars? Admin account will remain.')) return;
  [KEYS.BOOKINGS, KEYS.CARS, KEYS.REVIEWS].forEach(k => store.set(k,[]));
  const users = getAll(KEYS.USERS).filter(u=>u.role==='admin');
  saveAll(KEYS.USERS, users);
  showToast('Demo data cleared!','success');
};
window.resetApp = () => {
  if (!confirm('FACTORY RESET  This will delete all data including admin account. Are you sure?')) return;
  if (!confirm('This is IRREVERSIBLE. Click OK to confirm.')) return;
  localStorage.clear();
  location.href = 'index.ejs';
};
