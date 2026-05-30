// admin-staff.js
const STAFF_ROLES = ['', 'mechanic', 'driver', 'manager', 'detailer', 'receptionist'];

window.addEventListener('DOMContentLoaded', () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();
  renderStats(); renderStaff(); renderCodes();

  document.getElementById('sf-save').addEventListener('click', addStaff);
  document.getElementById('gen-code-btn').addEventListener('click', genCode);
});

function getAllStaff() { return getAll(KEYS.USERS).filter(u => u.role === 'staff' || u.userType === 'staff'); }

function renderStats() {
  const staff = getAllStaff();
  const allB = getAll(KEYS.BOOKINGS);
  const unassigned = staff.filter(u => !u.staffRole).length;
  document.getElementById('staff-stats').innerHTML = [
    { l: 'Total Staff', v: staff.length, i: SVG_ICONS.user, c: 'red' },
    { l: 'No Role Yet', v: unassigned, i: SVG_ICONS.user, c: 'yellow' },
    { l: 'Jobs Today', v: allB.filter(b => b.date === todayStr()).length, i: SVG_ICONS.clipboard, c: 'blue' },
    { l: 'In Progress', v: allB.filter(b => b.status === 'in_progress').length, i: SVG_ICONS.clock, c: 'green' },
  ].map(s => `<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
}

function renderStaff() {
  const staff = getAllStaff();
  const allB = getAll(KEYS.BOOKINGS);
  const roleColors = { mechanic: 'badge-blue', manager: 'badge-red' };

  document.getElementById('staff-tbody').innerHTML = staff.length ? staff.map(u => {
    const jobs = allB.filter(b => b.assignedStaff === u.id && b.status === 'completed').length;
    const roleBadge = u.staffRole
      ? `<span class="badge ${roleColors[u.staffRole] || 'badge-gray'}">${u.staffRole.charAt(0).toUpperCase()+u.staffRole.slice(1)}</span>`
      : `<span class="badge badge-yellow">🚗 No Role</span>`;

    const roleDropdown = `
      <select class="form-control" style="padding:4px 8px;font-size:.75rem;width:auto;margin-top:6px"
        onchange="assignRole('${u.id}', this.value)">
        <option value=""> Assign Role </option>
        <option value="mechanic" ${u.staffRole==='mechanic'?'selected':''}>Mechanic</option>
        <option value="manager" ${u.staffRole==='manager'?'selected':''}>Manager</option>
      </select>`;

    return `<tr ${!u.staffRole ? 'style="background:rgba(250,204,21,.05)"' : ''}>
      <td><div class="flex-gap"><div class="nav-avatar" style="width:34px;height:34px;font-size:.8rem">${u.firstName.charAt(0)}</div><strong>${u.firstName} ${u.lastName}</strong></div></td>
      <td style="font-size:.82rem">${u.email}</td>
      <td><div>${roleBadge}</div>${roleDropdown}</td>
      <td>${jobs}</td>
      <td>⭐ 4.8</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="removeStaff('${u.id}')">Remove</button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="6"><div class="empty-state" style="padding:24px"><p>No staff accounts yet.</p></div></td></tr>';
}

// --- ASSIGN ROLE (inline from table dropdown) -----------------
window.assignRole = (userId, role) => {
  const users = getAll(KEYS.USERS);
  const u = users.find(x => x.id === userId);
  if (!u) return;
  u.staffRole = role;
  saveAll(KEYS.USERS, users);
  renderStats(); renderStaff();
  showToast(role ? `Role "${role}" assigned to ${u.firstName}.` : `Role removed from ${u.firstName}.`, 'success');
};

function renderCodes() {
  const codes = getAll(KEYS.STAFF_CODES);
  document.getElementById('codes-list').innerHTML = codes.length ? codes.map(c => `
    <div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">
      <div style="font-family:monospace;font-size:.82rem;font-weight:700;color:${c.usedBy ? 'var(--gray-400)' : 'var(--primary)'}">${c.code}</div>
      <div style="font-size:.72rem;color:var(--gray-500);margin-top:3px">${c.usedBy ? '✓ Used' : '🔑 Available'}  Created ${formatDate(c.createdAt)}</div>
    </div>`).join('') : '<p style="color:var(--gray-400);font-size:.85rem">No codes generated yet.</p>';
}

window.removeStaff = (id) => {
  const u = getById(KEYS.USERS, id); if (!u) return;
  if (!confirm(`Remove ${u.firstName} ${u.lastName} from staff?`)) return;
  removeById(KEYS.USERS, id);
  renderStats(); renderStaff();
  showToast(`${u.firstName} removed.`, 'success');
};

function addStaff() {
  const first = document.getElementById('sf-first').value.trim();
  const last  = document.getElementById('sf-last').value.trim();
  const email = document.getElementById('sf-email').value.trim();
  const phone = document.getElementById('sf-phone').value.trim();
  const pass  = document.getElementById('sf-pass').value;
  if (!first || !last || !email || !pass) { showToast('Fill in all required fields', 'error'); return; }
  // Staff created by admin start with NO role  admin assigns it via the table
  const res = auth.register({ firstName: first, lastName: last, email, phone, role: 'staff', staffRole: '', userType: 'staff', password: pass });
  if (res.error) { showToast(res.error, 'error'); return; }
  closeModal('staff-modal');
  // Clear form
  ['sf-first','sf-last','sf-email','sf-phone','sf-pass'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  renderStats(); renderStaff();
  showToast(`${first} ${last} added  please assign a role.`, 'success');
}

function genCode() {
  const code = staffCodesAPI.generate();
  document.getElementById('generated-code').textContent = code;
  document.getElementById('generated-code-wrap').style.display = 'block';
  document.getElementById('gen-code-btn').textContent = 'Generate Another';
  renderCodes();
  showToast('Staff code generated!', 'success');
}
