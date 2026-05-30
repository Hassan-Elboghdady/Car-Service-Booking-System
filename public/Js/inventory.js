// inventory.js
window.addEventListener('DOMContentLoaded', async () => {
  seedData();
  if (!requireRole('admin')) return;
  initSidebar();
  await refresh();
  
  document.getElementById('inv-search').addEventListener('input', refresh);
  document.getElementById('in-save').addEventListener('click', saveItem);
});

async function refresh() {
  const items = await inventoryAPI.getAll();
  const q = document.getElementById('inv-search').value.toLowerCase();
  const filtered = items.filter(i => i.name.toLowerCase().includes(q));
  
  renderStats(items);
  renderTable(filtered);
  renderLowStock(items);
}

function renderStats(items) {
  const low = items.filter(i => i.qty <= (i.lowAt || 5)).length;
  document.getElementById('inv-stats').innerHTML = [
    { l: 'Total SKUs', v: items.length, i: '🚗', c: 'blue' },
    { l: 'Low Stock Items', v: low, i: '🚗', c: 'yellow' },
    { l: 'Total Qty', v: items.reduce((s,i) => s + i.qty, 0), i: '🚗', c: 'green' },
    { l: 'Out of Stock', v: items.filter(i=>i.qty===0).length, i: '🚗', c: 'red' },
  ].map(s => `<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div></div>`).join('');
}

function renderTable(items) {
  const tbody = document.getElementById('inv-tbody');
  tbody.innerHTML = items.map(i => {
    const isLow = i.qty <= (i.lowAt || 5);
    return `
      <tr>
        <td><strong>${i.name}</strong></td>
        <td>${i.category || 'Maintenance'}</td>
        <td style="font-weight:700; color:${isLow?'var(--danger)':'inherit'}">${i.qty}</td>
        <td>${i.unit || 'units'}</td>
        <td>${isLow ? '<span class="badge badge-yellow">Low Stock</span>' : '<span class="badge badge-green">In Stock</span>'}</td>
        <td>
          <div class="flex-gap" style="gap:4px">
            <button class="btn btn-ghost btn-sm" onclick="adjust('${i._id}', 1)">+</button>
            <button class="btn btn-ghost btn-sm" onclick="adjust('${i._id}', -1)">-</button>
            <button class="btn btn-danger btn-sm" onclick="remItem('${i._id}')">?</button>
          </div>
        </td>
      </tr>`;
  }).join('') || '<tr><td colspan="6" class="text-center">No items found</td></tr>';
}

function renderLowStock(items) {
  const low = items.filter(i => i.qty <= (i.lowAt || 5));
  document.getElementById('low-stock-list').innerHTML = low.length ? low.map(i => `
    <div class="low-item">
      <div class="low-item-icon">🚗</div>
      <div class="low-item-info">
        <strong>${i.name}</strong>
        ${i.qty} ${i.unit} remaining
      </div>
      <button class="btn btn-primary btn-sm" style="padding:4px 8px; font-size:.7rem" onclick="adjust('${i._id}', 10)">Order</button>
    </div>`).join('') : '<p class="text-muted" style="font-size:.85rem">All items well stocked.</p>';
}

window.adjust = async (id, amt) => {
  await inventoryAPI.adjust(id, amt);
  await refresh();
};

window.remItem = async (id) => {
  if (confirm('Delete this item from inventory?')) {
    await inventoryAPI.remove(id);
    await refresh();
  }
};

async function saveItem() {
  const name = document.getElementById('in-name').value;
  const qty = parseInt(document.getElementById('in-qty').value);
  if (!name) return;
  
  await inventoryAPI.add({ name, qty, lowAt: parseInt(document.getElementById('in-low').value)||5, unit: 'units' });
  closeModal('inv-modal');
  await refresh();
}

window.generateOrder = () => {
  showToast('Purchase Order generated and sent to suppliers.', 'success');
};
