// admin-cms.js
const CMS_FIELDS = {
  heroTitle:'cms-heroTitle', heroSubtitle:'cms-heroSubtitle', heroCTA:'cms-heroCTA',
  announcementBanner:'cms-announcement', address:'cms-address', phone1:'cms-phone1',
  phone2:'cms-phone2', email:'cms-email', hoursSunThu:'cms-hSunThu', hoursSat:'cms-hSat',
  hoursFri:'cms-hFri', facebook:'cms-fb', instagram:'cms-ig', twitter:'cms-tw', youtube:'cms-yt',
};

window.addEventListener('DOMContentLoaded', () => {
  seedData(); if (!requireRole('admin')) return; initSidebar();
  // Load existing values
  const cms = store.get(KEYS.CMS)||{};
  Object.entries(CMS_FIELDS).forEach(([key,elId]) => {
    const el = document.getElementById(elId); if(el) el.value = cms[key]||'';
  });
  document.getElementById('cms-save').addEventListener('click', saveCMS);
});

function saveCMS() {
  const cms = store.get(KEYS.CMS) || {}; // keep any existing keys
  Object.entries(CMS_FIELDS).forEach(([key,elId]) => {
    const el = document.getElementById(elId); if(el) cms[key]=el.value.trim();
  });
  store.set(KEYS.CMS, cms);

  // Re-render the footer with new social links
  if (typeof buildFooter === 'function') buildFooter();

  // Update announcement bar on home if it exists
  const ab = document.getElementById('announcement-text');
  if (ab && cms.announcementBanner) ab.textContent = cms.announcementBanner;

  showToast('Saved! Changes apply on next page load.','success');
}
