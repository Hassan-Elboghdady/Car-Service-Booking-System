// admin-notifications.js
window.addEventListener('DOMContentLoaded', () => {
  seedData(); if (!requireRole('admin')) return; initSidebar(); render();
});
function getNotifs() { return getAll(KEYS.NOTIFICATIONS)||[]; }
function render() {
  const notifs = getNotifs();
  const el = document.getElementById('notif-list');
  if (!notifs.length) { el.innerHTML='<div class="empty-state" style="padding:40px"><div class="empty-icon">🔔</div><h3>No notifications</h3></div>'; return; }
  el.innerHTML = [...notifs].reverse().map(n=>`
    <div style="display:flex;align-items:flex-start;gap:16px;padding:16px 0;border-bottom:1px solid var(--gray-100);${!n.read?'background:rgba(230,0,35,.02);':''}">
      <div class="stat-icon ${n.type==='success'?'green':n.type==='warning'?'yellow':'blue'}" style="width:40px;height:40px;flex-shrink:0">${n.icon||'🚗'}</div>
      <div style="flex:1">
        <div style="font-weight:${n.read?'400':'700'};font-size:.9rem;margin-bottom:3px">${n.message}</div>
        <div style="font-size:.75rem;color:var(--gray-400)">${formatDate(n.createdAt)||'Just now'}</div>
      </div>
      ${!n.read?`<button class="btn btn-ghost btn-sm" onclick="markRead('${n.id}')">✓</button>`:'<span style="color:var(--gray-300);font-size:.8rem">Read</span>'}
    </div>`).join('');
}
window.markRead = (id) => {
  const notifs = getNotifs(); const n = notifs.find(x=>x.id===id); if(n) n.read=true;
  saveAll(KEYS.NOTIFICATIONS, notifs); render();
};
window.markAllRead = () => {
  const notifs = getNotifs().map(n=>({...n,read:true}));
  saveAll(KEYS.NOTIFICATIONS, notifs); render(); showToast('All marked as read','success');
};
