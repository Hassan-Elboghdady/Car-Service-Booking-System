// car-details.js   Fixed: loads car from real backend API
window.addEventListener('DOMContentLoaded', async () => {
  seedData();

  const user = auth.current();
  if (!user) {
    showAuthGuard('cd-auth-guard', 'Login to view vehicle details.');
    return;
  }

  const params = new URLSearchParams(location.search);
  const carId  = params.get('id');

  if (!carId) {
    document.getElementById('cd-auth-guard').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔧</div>
        <h3>No Vehicle Selected</h3>
        <p>Please go to <a href="cars.ejs">My Cars</a> and pick a vehicle to view.</p>
        <a href="cars.ejs" class="btn btn-primary mt-16">← Back to My Cars</a>
      </div>`;
    return;
  }

  // Fetch the user's cars from the real backend
  let car = null;
  try {
    const myCars = await carsAPI.forUser(user.id);
    car = myCars.find(c => (c._id || c.id) === carId);
  } catch(e) {}

  if (!car) {
    document.getElementById('cd-auth-guard').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔧❌</div>
        <h3>Vehicle Not Found</h3>
        <p>This vehicle doesn't exist or was removed.</p>
        <a href="cars.ejs" class="btn btn-primary mt-16">← Back to My Cars</a>
      </div>`;
    return;
  }

  document.getElementById('cd-content').style.display = 'block';
  renderCar(car);
  await renderHistory(carId);

  document.getElementById('cd-delete-btn').addEventListener('click', async () => {
    if (confirm(`Remove your ${car.brand} ${car.model}? This cannot be undone.`)) {
      await carsAPI.remove(carId);
      showToast('Vehicle removed', 'success');
      setTimeout(() => location.href = 'cars.ejs', 800);
    }
  });
});

function renderCar(car) {
  const cid = car._id || car.id;
  document.getElementById('cd-title').textContent  = `${car.emoji || '🚗'} ${car.brand} ${car.model}`;
  document.getElementById('cd-brand').textContent  = car.brand;
  document.getElementById('cd-model').textContent  = car.model;
  document.getElementById('cd-year').textContent   = car.year;
  document.getElementById('cd-plate').textContent  = car.plate  || '';
  document.getElementById('cd-color').textContent  = car.color  || '';
  document.getElementById('cd-created').textContent = formatDate(car.createdAt || new Date());
  document.getElementById('cd-book-btn').href      = `booking.ejs?car=${cid}`;
}

async function renderHistory(carId) {
  const allB    = await bookingsAPI.allWithDetails();
  const history = allB.filter(b => b.carId === carId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const tbody   = document.getElementById('cd-history-tbody');

  if (!history.length) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state" style="padding:40px">
        <div class="empty-icon">🔧?</div>
        <p>No service history for this vehicle yet.</p>
        <a href="booking.ejs?car=${carId}" class="btn btn-primary mt-16">Book a Service</a>
      </div></td></tr>`;
    return;
  }

  tbody.innerHTML = history.map(b => `
    <tr>
      <td><code style="font-size:.7rem">${b.id.slice(-8).toUpperCase()}</code></td>
      <td>
        <div style="font-weight:600;display:inline-flex;align-items:center;gap:8px">${renderServiceIconHtml(b.service,'1.2rem')} ${b.service?.name || 'Service'}</div>
        <div style="font-size:.75rem;color:var(--gray-500)">By ${b.staff?.firstName || 'AutoServe'} ${b.staff?.lastName || ''}</div>
      </td>
      <td>${formatDate(b.date)}</td>
      <td style="font-weight:700;color:var(--primary)">EGP ${b.total}</td>
      <td>${statusBadge(b.status)}</td>
      <td><a href="tracker.ejs?id=${b.id}" class="btn btn-ghost btn-sm">🚗 Track</a></td>
    </tr>`).join('');
}
