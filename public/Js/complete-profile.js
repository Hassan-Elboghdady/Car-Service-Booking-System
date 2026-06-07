// complete-profile.js - Logic for Profile Completion page

function isEgyptPhone(p) {
  const cleaned = p.replace(/[\s\-]/g, '');
  return /^(010|011|012|015)\d{8}$/.test(cleaned);
}

function isValidPlate(plate) {
  const cleaned = String(plate || '').replace(/\s+/g, '');
  if (!/^[\p{Script=Arabic}0-9]{1,7}$/u.test(cleaned)) return false;
  const letters = (cleaned.match(/\p{Script=Arabic}/gu) || []).length;
  const digits = (cleaned.match(/[0-9]/g) || []).length;
  return letters <= 3 && digits <= 4;
}

// Select elements
const brandSel = document.getElementById('cp-brand');
const modelSel = document.getElementById('cp-model');
const yearSel = document.getElementById('cp-year');
const colorSel = document.getElementById('cp-color');
const colorCustomWrap = document.getElementById('cp-color-custom-wrap');
const colorCustomInput = document.getElementById('cp-color-custom');

const plateNumbersInput = document.getElementById('cp-plate-numbers');
const plateLettersInput = document.getElementById('cp-plate-letters');

// Plate split helpers
function extractArabicLetters(s) {
  return (String(s).match(/\p{Script=Arabic}/gu) || []).slice(0, 3);
}

function formatPlateLetters() {
  if (!plateLettersInput) return;
  const letters = extractArabicLetters(plateLettersInput.value);
  plateLettersInput.dataset.raw = letters.join('');
  plateLettersInput.value = letters.join(' ');
}

function formatPlateNumbers() {
  if (!plateNumbersInput) return;
  const digits = (plateNumbersInput.value || '').replace(/\D/g, '').slice(0, 4);
  plateNumbersInput.value = digits;
}

if (plateLettersInput) {
  plateLettersInput.addEventListener('input', formatPlateLetters);
  plateLettersInput.addEventListener('paste', () => setTimeout(formatPlateLetters, 0));
}
if (plateNumbersInput) {
  plateNumbersInput.addEventListener('input', formatPlateNumbers);
  plateNumbersInput.addEventListener('paste', () => setTimeout(formatPlateNumbers, 0));
}

// Populate car brands
if (brandSel && typeof CARS_DB !== 'undefined') {
  Object.keys(CARS_DB).forEach(brand => {
    const opt = document.createElement('option');
    opt.value = brand; opt.textContent = brand;
    brandSel.appendChild(opt);
  });
}

brandSel?.addEventListener('change', () => {
  modelSel.innerHTML = '<option value="">Select model</option>';
  yearSel.innerHTML = '<option value="">Select year</option>';
  modelSel.disabled = !brandSel.value;
  yearSel.disabled = true;
  if (!brandSel.value) return;
  const models = Object.keys(CARS_DB[brandSel.value].models);
  models.forEach(m => {
    const o = document.createElement('option'); o.value = m; o.textContent = m; modelSel.appendChild(o);
  });
});

modelSel?.addEventListener('change', () => {
  yearSel.innerHTML = '<option value="">Select year</option>';
  yearSel.disabled = !modelSel.value;
  if (!brandSel.value || !modelSel.value) return;
  const years = CARS_DB[brandSel.value].models[modelSel.value] || [];
  years.slice().reverse().forEach(y => {
    const o = document.createElement('option'); o.value = y; o.textContent = y; yearSel.appendChild(o);
  });
});

colorSel?.addEventListener('change', () => {
  if (!colorCustomWrap || !colorCustomInput) return;
  const showCustom = colorSel.value === 'Other';
  colorCustomWrap.style.display = showCustom ? 'block' : 'none';
  if (!showCustom) colorCustomInput.value = '';
});

// Inline error helper
function showFieldErr(alertEl, inputId, msg) {
  const el = document.getElementById(inputId);
  if (el) {
    el.classList.add('is-invalid');
    let errDiv = el.parentElement.querySelector('.form-error');
    if (!errDiv) {
      errDiv = document.createElement('div');
      errDiv.className = 'form-error';
      el.parentElement.appendChild(errDiv);
    }
    errDiv.textContent = msg;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (alertEl) {
    alertEl.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
  }
}

// Submit button click handler
document.getElementById('cp-submit-btn')?.addEventListener('click', async () => {
  const alertEl = document.getElementById('complete-profile-alert');
  alertEl.innerHTML = '';

  // Clear previous inline errors
  ['cp-phone', 'cp-brand', 'cp-model', 'cp-year', 'cp-plate-numbers', 'cp-plate-letters', 'cp-color', 'cp-color-custom'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('is-invalid');
    const e = el.parentElement.querySelector('.form-error');
    if (e) e.remove();
  });

  const phone = document.getElementById('cp-phone').value.trim();
  const brand = brandSel.value;
  const model = modelSel.value;
  const year = yearSel.value;
  const plateNumbers = plateNumbersInput.value.trim();
  const plateLettersRaw = plateLettersInput.dataset?.raw || '';
  const plate = (plateLettersRaw + plateNumbers).trim();
  const color = colorSel.value.trim();
  const customColor = colorCustomInput.value.trim();

  // Validations
  if (!phone) { showFieldErr(alertEl, 'cp-phone', 'Please enter your phone number.'); return; }
  if (!isEgyptPhone(phone)) { showFieldErr(alertEl, 'cp-phone', 'Valid Egyptian mobile required (11 digits, starting 010/011/012/015).'); return; }
  if (!brand) { showFieldErr(alertEl, 'cp-brand', 'Please select your car brand.'); return; }
  if (!model) { showFieldErr(alertEl, 'cp-model', 'Please select your car model.'); return; }
  if (!year) { showFieldErr(alertEl, 'cp-year', 'Please select the car year.'); return; }
  if (!plateNumbers && !plateLettersRaw) { showFieldErr(alertEl, 'cp-plate-numbers', 'Please enter your license plate.'); return; }
  if (!isValidPlate(plate)) { showFieldErr(alertEl, 'cp-plate-numbers', 'License plate must use up to 3 Arabic letters and up to 4 digits.'); return; }
  if (!color) { showFieldErr(alertEl, 'cp-color', 'Please select your car color.'); return; }
  if (color === 'Other' && !customColor) { showFieldErr(alertEl, 'cp-color-custom', 'Please enter your custom color.'); return; }

  const submitBtn = document.getElementById('cp-submit-btn');
  const oldText = submitBtn.innerHTML;
  submitBtn.innerHTML = 'Completing Profile...';
  submitBtn.disabled = true;

  try {
    const storedColor = color === 'Other' ? customColor : color;
    const response = await api.post('/users/complete-profile', {
      phone,
      brand,
      model,
      year: parseInt(year),
      plate: plate.replace(/\s+/g, ''),
      color: storedColor,
      emoji: CARS_DB[brand]?.emoji || '🚗'
    });

    const user = response.data;
    const car = response.car;

    // Update global session store
    if (typeof auth !== 'undefined') {
      auth.setServerUser(user);
      store.set(KEYS.SESSION, user);
    }

    // Save car locally
    if (typeof upsert !== 'undefined') {
      upsert(KEYS.CARS, {
        id: car._id || car.id,
        owner: user._id || user.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        plate: car.plate,
        color: car.color,
        emoji: car.emoji
      });
    }

    showToast('Profile completed successfully! 🚗', 'success');
    setTimeout(() => {
      location.href = '/';
    }, 700);

  } catch (error) {
    showFieldErr(alertEl, 'cp-phone', error.message || error);
  } finally {
    submitBtn.innerHTML = oldText;
    submitBtn.disabled = false;
  }
});
