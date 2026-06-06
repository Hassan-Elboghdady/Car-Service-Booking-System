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

  // Reload their messages after sending
  loadMyMessages();
});

// ─── CUSTOMER INBOX ─────────────────────────────────────────────
let myMessages = [];

async function loadMyMessages() {
  const user = (typeof auth !== 'undefined' && auth.current()) || null;
  if (!user || user.role !== 'customer') return;

  const section = document.getElementById('my-messages-section');
  if (section) section.style.display = 'block';

  try {
    const res = await api.get(`/contact/user/${user.id}`);
    myMessages = res.data || [];
    renderMyMessages();
  } catch (e) {
    console.error('Could not load messages', e);
  }
}

function renderMyMessages() {
  const list = document.getElementById('my-messages-list');
  if (!list) return;
  if (!myMessages.length) {
    list.innerHTML = `<div class="card card-body" style="text-align:center;color:var(--gray-400);padding:32px">
      <div style="font-size:2.5rem;margin-bottom:12px">💬</div>
      <p>You haven't sent any messages yet. Use the form above to contact us!</p>
    </div>`;
    return;
  }

  list.innerHTML = myMessages.map(m => {
    const hasReply = m.replies?.some(r => r.senderRole === 'admin' || r.senderRole === 'manager');
    const lastMsg = m.replies?.length ? m.replies[m.replies.length - 1] : null;
    const statusColor = { unread:'var(--warning)', read:'var(--gray-400)', replied:'var(--success)', closed:'var(--gray-300)' }[m.status] || 'var(--gray-400)';
    return `
    <div class="card card-body" style="cursor:pointer;padding:16px;transition:box-shadow .2s;" onclick="openCustThread('${m._id}')"
         onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'" onmouseout="this.style.boxShadow=''">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${m.subject}</div>
          <div style="font-size:.82rem;color:var(--gray-500);margin-bottom:8px">${(lastMsg?.text || m.msg)?.slice(0,80)}...</div>
          <div style="display:flex;gap:10px;align-items:center">
            <span style="font-size:.7rem;padding:2px 8px;border-radius:10px;background:${statusColor}22;color:${statusColor};font-weight:600">
              ${m.status === 'replied' ? '✅ Replied' : m.status === 'read' ? '👁 Read' : '⏳ Pending'}
            </span>
            <span style="font-size:.72rem;color:var(--gray-400)">${new Date(m.createdAt).toLocaleDateString('en-EG',{day:'numeric',month:'short'})}</span>
            ${m.replies?.length ? `<span style="font-size:.72rem;color:var(--gray-400)">💬 ${m.replies.length} ${m.replies.length===1?'reply':'replies'}</span>` : ''}
          </div>
        </div>
        <span style="font-size:.75rem;color:var(--primary);font-weight:600;white-space:nowrap">View →</span>
      </div>
    </div>`;
  }).join('');
}

window.openCustThread = (id) => {
  const msg = myMessages.find(m => m._id === id);
  if (!msg) return;
  const user = auth.current();

  const allReplies = [
    { senderRole: 'customer', senderName: msg.name, text: msg.msg, createdAt: msg.createdAt }
  ];
  (msg.replies || []).forEach(r => allReplies.push(r));

  const body = document.getElementById('cust-thread-body');
  const footer = document.getElementById('cust-thread-footer');

  body.innerHTML = `
    <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--gray-100)">
      <div style="font-weight:600;margin-bottom:4px">${msg.subject}</div>
      <div style="font-size:.75rem;color:var(--gray-400)">${new Date(msg.createdAt).toLocaleDateString('en-EG',{weekday:'short',day:'numeric',month:'long',year:'numeric'})}</div>
    </div>
    <div id="cust-thread-messages" style="display:flex;flex-direction:column;gap:14px;max-height:360px;overflow-y:auto;padding-right:4px">
      ${allReplies.map(r => {
        const isStaff = r.senderRole === 'admin' || r.senderRole === 'manager';
        return `
        <div style="display:flex;gap:10px;${isStaff ? 'flex-direction:row-reverse' : ''}">
          <div style="width:32px;height:32px;border-radius:50%;background:${isStaff ? 'var(--primary)' : 'var(--gray-200)'};color:${isStaff ? '#fff' : 'var(--gray-600)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0">
            ${r.senderName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style="max-width:75%">
            <div style="font-size:.7rem;color:var(--gray-400);margin-bottom:4px;${isStaff ? 'text-align:right' : ''}">
              <strong>${isStaff ? (r.senderRole === 'manager' ? '👔 Manager' : '🛡️ Admin') : '👤 You'}</strong>
              · ${new Date(r.createdAt).toLocaleTimeString('en-EG',{hour:'2-digit',minute:'2-digit'})}
            </div>
            <div style="background:${isStaff ? 'var(--primary)' : 'var(--gray-100)'};color:${isStaff ? '#fff' : 'var(--text)'};padding:10px 14px;border-radius:${isStaff ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};font-size:.85rem;line-height:1.5">
              ${r.text}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;

  setTimeout(() => {
    const tm = document.getElementById('cust-thread-messages');
    if (tm) tm.scrollTop = tm.scrollHeight;
  }, 80);

  footer.innerHTML = msg.status !== 'closed' ? `
    <div style="border-top:1px solid var(--gray-100);padding-top:14px;margin-top:14px">
      <textarea id="cust-reply-text" class="form-control" rows="3" placeholder="Write your follow-up reply..." style="margin-bottom:10px;resize:none"></textarea>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="closeModal('cust-thread-modal')">Close</button>
        <button class="btn btn-primary btn-sm" onclick="sendCustReply('${id}')">Send Reply →</button>
      </div>
    </div>` : `<div style="text-align:right;padding-top:10px"><button class="btn btn-ghost btn-sm" onclick="closeModal('cust-thread-modal')">Close</button></div>`;

  openModal('cust-thread-modal');
};

window.sendCustReply = async (id) => {
  const text = document.getElementById('cust-reply-text')?.value?.trim();
  if (!text) { showToast('Please type a reply', 'error'); return; }
  const user = auth.current();
  const senderName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer';
  try {
    const res = await api.post(`/contact/${id}/reply`, {
      reply: text, senderRole: 'customer', senderName, senderId: user?.id
    });
    const idx = myMessages.findIndex(m => m._id === id);
    if (idx !== -1) myMessages[idx] = res.data.data;
    showToast('Reply sent!', 'success');
    renderMyMessages();
    openCustThread(id);
  } catch (e) {
    showToast('Failed to send reply', 'error');
  }
};

// Auto-load messages on page load
window.addEventListener('DOMContentLoaded', loadMyMessages);

