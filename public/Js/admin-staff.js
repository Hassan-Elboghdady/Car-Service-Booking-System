// admin-staff.js
const STAFF_ROLES = ['', 'mechanic', 'driver', 'manager', 'detailer', 'receptionist'];

window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();
  await fetchAllStaff();
  renderStats(); renderStaff(); await renderCodes();

  document.getElementById('sf-save').addEventListener('click', addStaff);
  document.getElementById('gen-code-btn').addEventListener('click', genCode);
});

let currentStaffList = [];

async function fetchAllStaff() {
  try {
    const res = await api.get('/users/staff');
    currentStaffList = res.data || [];
  } catch (error) {
    console.error('Failed to fetch staff', error);
  }
}

async function renderStats() {
  const allB = getAll(KEYS.BOOKINGS); // We leave bookings as localStorage for now if it's not yet wired
  const unassigned = currentStaffList.filter(u => !u.staffRole).length;
  document.getElementById('staff-stats').innerHTML = [
    { l: 'Total Staff', v: currentStaffList.length, i: SVG_ICONS.user, c: 'red' },
    { l: 'No Role Yet', v: unassigned, i: SVG_ICONS.user, c: 'yellow' },
    { l: 'Jobs Today', v: allB.filter(b => b.date === todayStr()).length, i: SVG_ICONS.clipboard, c: 'blue' },
    { l: 'In Progress', v: allB.filter(b => b.status === 'in_progress').length, i: SVG_ICONS.clock, c: 'green' },
  ].map(s => `<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
}

function renderStaff() {
  const staff = currentStaffList;
  const allB = getAll(KEYS.BOOKINGS);
  const roleColors = { mechanic: 'badge-blue', manager: 'badge-red', driver: 'badge-green', detailer: 'badge-gray', receptionist: 'badge-blue' };

  document.getElementById('staff-tbody').innerHTML = staff.length ? staff.map(u => {
    const jobs = allB.filter(b => b.assignedStaff === u._id && b.status === 'completed').length;
    const roleBadge = u.staffRole
      ? `<span class="badge ${roleColors[u.staffRole] || 'badge-gray'}">${u.staffRole.charAt(0).toUpperCase()+u.staffRole.slice(1)}</span>`
      : `<span class="badge badge-yellow">🚗 No Role</span>`;

    const roleDropdown = `
      <select class="form-control" style="padding:4px 8px;font-size:.75rem;width:auto;margin-top:6px"
        onchange="assignRole('${u._id}', this.value)">
        <option value=""> Assign Role </option>
        ${STAFF_ROLES.filter(r => r).map(r => `<option value="${r}" ${u.staffRole===r?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('')}
      </select>`;

    return `<tr ${!u.staffRole ? 'style="background:rgba(250,204,21,.05)"' : ''}>
      <td><div class="flex-gap"><div class="nav-avatar" style="width:34px;height:34px;font-size:.8rem">${u.firstName.charAt(0)}</div><strong>${u.firstName} ${u.lastName}</strong></div></td>
      <td style="font-size:.82rem">${u.email}</td>
      <td><div>${roleBadge}</div>${roleDropdown}</td>
      <td>${jobs}</td>
      <td>⭐ 4.8</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="removeStaff('${u._id}')">Remove</button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="6"><div class="empty-state" style="padding:24px"><p>No staff accounts yet.</p></div></td></tr>';
}

// --- ASSIGN ROLE (inline from table dropdown) -----------------
window.assignRole = async (userId, role) => {
  try {
    await api.put(`/users/staff/${userId}/role`, { staffRole: role });
    await fetchAllStaff();
    renderStats(); renderStaff();
    showToast(`Role updated.`, 'success');
  } catch (error) {
    showToast('Failed to assign role.', 'error');
  }
};

async function renderCodes() {
  const codes = await staffCodesAPI.getAll();
  document.getElementById('codes-list').innerHTML = codes.length ? codes.map(c => `
    <div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">
      <div style="font-family:monospace;font-size:.82rem;font-weight:700;color:${c.usedBy ? 'var(--gray-400)' : 'var(--primary)'}">${c.code}</div>
      <div style="font-size:.72rem;color:var(--gray-500);margin-top:3px">${c.usedBy ? '✓ Used' : '🔑 Available'}  Created ${formatDate(c.createdAt)}</div>
    </div>`).join('') : '<p style="color:var(--gray-400);font-size:.85rem">No codes generated yet.</p>';
}

window.removeStaff = async (id) => {
  const u = currentStaffList.find(x => x._id === id);
  if (!u) return;
  if (!confirm(`Remove ${u.firstName} ${u.lastName} from staff?`)) return;
  try {
    await api.del(`/users/staff/${id}`);
    await fetchAllStaff();
    renderStats(); renderStaff();
    showToast(`${u.firstName} removed.`, 'success');
  } catch (error) {
    showToast('Failed to remove staff member.', 'error');
  }
};

async function addStaff() {
  const first = document.getElementById('sf-first').value.trim();
  const last  = document.getElementById('sf-last').value.trim();
  const email = document.getElementById('sf-email').value.trim();
  const phone = document.getElementById('sf-phone').value.trim();
  const pass  = document.getElementById('sf-pass').value;
  if (!first || !last || !email || !pass) { showToast('Fill in all required fields', 'error'); return; }
  
  try {
    await api.post('/users/register', { firstName: first, lastName: last, email, phone, role: 'staff', staffRole: '', userType: 'staff', password: pass });
    closeModal('staff-modal');
    ['sf-first','sf-last','sf-email','sf-phone','sf-pass'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    await fetchAllStaff();
    renderStats(); renderStaff();
    showToast(`${first} ${last} added  please assign a role.`, 'success');
  } catch (error) {
    showToast(error.message || 'Failed to add staff', 'error');
  }
}

async function genCode() {
  try {
    const code = await staffCodesAPI.generate();
    document.getElementById('generated-code').textContent = code;
    document.getElementById('generated-code-wrap').style.display = 'block';
    document.getElementById('gen-code-btn').textContent = 'Generate Another';
    await renderCodes();
    showToast('Staff code generated!', 'success');
  } catch (err) {
    showToast('Failed to generate staff code', 'error');
  }
}
