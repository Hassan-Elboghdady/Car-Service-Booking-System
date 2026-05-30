// contact.js

// --- Apply CMS data -------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  const cms = (typeof store !== 'undefined' && store.get(KEYS.CMS)) || {};
  if (cms.address)     { const el = document.getElementById('ct-address'); if(el) el.textContent = cms.address; }
  if (cms.phone1)      { const el = document.getElementById('ct-ph1');     if(el) { el.textContent = cms.phone1; el.href = 'tel:' + cms.phone1.replace(/\s/g,''); } }
  if (cms.phone2)      { const el = document.getElementById('ct-ph2');     if(el) { el.textContent = cms.phone2; el.href = 'tel:' + cms.phone2.replace(/\s/g,''); } }
  if (cms.email)       { const el = document.getElementById('ct-email-link'); if(el) { el.textContent = cms.email; el.href = 'mailto:' + cms.email; } }
  if (cms.hoursSunThu) { const el = document.getElementById('ct-h-sunthu'); if(el) el.textContent = 'Sunday  Thursday: ' + cms.hoursSunThu; }
  if (cms.hoursSat)    { const el = document.getElementById('ct-h-sat');   if(el) el.textContent = 'Saturday: ' + cms.hoursSat; }
  if (cms.hoursFri)    { const el = document.getElementById('ct-h-fri');   if(el) el.textContent = 'Friday: ' + cms.hoursFri; }
});

const FAQS = [
  { q:'How do I cancel or reschedule a booking?', a:'You can cancel a booking from "My Bookings" up to 4 hours before your appointment. To reschedule, cancel and create a new booking, or call us directly.' },
  { q:'Do you offer pickup and drop-off service?', a:'Yes! We offer free pickup within 10 km for Premium and Elite package bookings. Service vehicles are available during business hours  Sunday to Thursday, 8AM5PM.' },
  { q:'What payment methods do you accept?', a:'We accept cash on delivery, Visa/Mastercard debit and credit cards, bank transfers, and Instapay. All card payments are processed securely.' },
  { q:'How long does an oil change take?', a:'A standard oil change takes approximately 1 hour. If additional services are required, our technician will inform you upfront.' },
  { q:'Do you work on all car brands?', a:'We service all major brands sold in Egypt including Toyota, MG, Hyundai, Kia, BMW, Mercedes, Nissan, Honda and more. Check our Cars page for the full list.' },
  { q:'Can I bring my car without a booking?', a:'Walk-ins are welcome, but we highly recommend booking online to guarantee your slot and avoid waiting times.' },
  { q:'What do I do if there\'s an issue after my service?', a:'We offer a 3090 day service warranty depending on your package. Contact us at support@autoserve.eg and we\'ll resolve it at no extra cost.' },
  { q:'What are your Terms & Conditions?', a:'Please read our full Terms & Conditions at <a href="terms.ejs" style="color:var(--primary)">this link</a> before creating an account or booking.' },
  { q:'Are your technicians certified?', a:'Yes! All AutoServe technicians hold valid automotive technical certifications and participate in ongoing training programs.' },
];

// Build FAQ
const faqList = document.getElementById('faq-list');
FAQS.forEach((item, i) => {
  const div = document.createElement('div');
  div.className = 'faq-item';
  div.innerHTML = `
    <button class="faq-q">
      <span>${item.q}</span>
      <span class="arrow">?</span>
    </button>
    <div class="faq-a">${item.a}</div>`;
  div.querySelector('.faq-q').addEventListener('click', () => div.classList.toggle('open'));
  faqList.appendChild(div);
});

// Contact form
document.getElementById('ct-submit')?.addEventListener('click', async () => {
  const name    = document.getElementById('ct-name').value.trim();
  const email   = document.getElementById('ct-email').value.trim();
  const subject = document.getElementById('ct-subject').value;
  const msg     = document.getElementById('ct-msg').value.trim();
  const termsOk = document.getElementById('ct-terms').checked;
  const alertEl = document.getElementById('contact-alert');

  if (!name || !email || !subject || !msg) { alertEl.innerHTML='<div class="alert alert-danger">Please fill in all required fields.</div>'; return; }
  if (!isEmail(email)) { alertEl.innerHTML='<div class="alert alert-danger">Please enter a valid email address.</div>'; return; }
  if (!termsOk) { alertEl.innerHTML='<div class="alert alert-danger">Please agree to the Terms &amp; Conditions.</div>'; return; }

  const phone   = document.getElementById('ct-phone').value.trim();
  const loggedUser = (typeof auth !== 'undefined' && auth.current()) || null;

  const contactBtn = document.getElementById('ct-submit');
  const oldText = contactBtn.innerHTML;
  contactBtn.innerHTML = 'Sending...';
  contactBtn.disabled = true;

  try {
    await api.post('/contact', {
      name, email, phone, subject, msg,
      userId: loggedUser ? loggedUser.id : null
    });
    if (typeof notify === 'function') notify({ message:`New contact message from ${name}: "${subject}"`, type:'info', icon:'✅' });
  } catch (error) {
    alertEl.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    contactBtn.innerHTML = oldText;
    contactBtn.disabled = false;
    return;
  }
  contactBtn.innerHTML = oldText;
  contactBtn.disabled = false;

  alertEl.innerHTML = '<div class="alert alert-success">? Your message has been sent! We\'ll respond within 2 business hours.</div>';
  document.getElementById('ct-name').value = document.getElementById('ct-email').value = document.getElementById('ct-phone').value =
  document.getElementById('ct-subject').value = document.getElementById('ct-msg').value = '';
  document.getElementById('ct-terms').checked = false;
  showToast('Message sent! We\'ll be in touch soon. 🚗','success');
  setTimeout(() => alertEl.innerHTML = '', 5000);
});
