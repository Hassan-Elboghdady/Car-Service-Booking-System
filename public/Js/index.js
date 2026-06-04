// index.js  Home page logic

window.addEventListener('DOMContentLoaded', async () => {
  const cms = store.get(KEYS.CMS) || {};

  // Apply CMS content
  const ht = document.getElementById('hero-title');
  const hs = document.getElementById('hero-sub');
  const hc = document.getElementById('hero-cta');
  const ab = document.getElementById('announcement-text');
  if (ht && cms.heroTitle) ht.innerHTML = cms.heroTitle.replace('Best Care', '<span class="hero-accent">Best Care</span>');
  if (hs && cms.heroSubtitle) hs.textContent = cms.heroSubtitle;
  if (hc && cms.heroCTA) hc.textContent = cms.heroCTA;
  if (ab && cms.announcementBanner) ab.textContent = cms.announcementBanner;

  // --- CAR STRIP --- (scrolling marquee of brands)
  const strip = document.getElementById('hero-car-strip');
  if (strip) {
    const brands = Object.entries(CARS_DB).map(([name, data]) => ({ name, logo: data.logo, emoji: data.emoji }));
    // Duplicate 4x so the loop fully covers any screen width
    const items = [...brands, ...brands, ...brands, ...brands];
    strip.innerHTML = items.map(b =>
      `<div class="hero-car-item"><img class="car-strip-logo" src="${b.logo}" alt="${b.name} logo"><span>${b.name}</span></div>`
    ).join('');
  }

  // --- BRANDS GRID ---
  const brandsGrid = document.getElementById('brands-grid');
  if (brandsGrid) {
    Object.entries(CARS_DB).forEach(([brand, data]) => {
      const modelCount = Object.keys(data.models).length;
      const div = document.createElement('div');
      div.className = 'brand-card animate-fade-in';
      div.innerHTML = `
        <div class="brand-logo-wrap"><img class="brand-logo-img" src="${data.logo}" alt="${brand} logo"></div>
        <div class="brand-name">${brand}</div>
        <div class="brand-count">${modelCount} models</div>`;
      div.addEventListener('click', () => location.href = `cars.ejs?brand=${encodeURIComponent(brand)}`);
      brandsGrid.appendChild(div);
    });
  }

  const featGrid = document.getElementById('feat-services-grid');
  const svcs = getServices();
  if (featGrid) {
    const catGrad = {
      maintenance: 'linear-gradient(135deg,#fff5f5 0%,#ffe4e8 100%)',
      repair:      'linear-gradient(135deg,#fff1f1 0%,#fde8e8 100%)',
      cleaning:    'linear-gradient(135deg,#f0fff4 0%,#e0f7fa 100%)',
    };
    svcs.filter(s => s.popular).slice(0, 8).forEach(svc => {
      const div = document.createElement('div');
      div.className = 'svc-feat-card animate-fade-in';
      div.innerHTML = `
        <div style="height:120px;margin:-25px -25px 16px -25px;display:flex;align-items:center;justify-content:center;background:${catGrad[svc.cat]||'linear-gradient(135deg,#f5f5f5,#e8e8e8)'};border-radius:var(--radius-md) var(--radius-md) 0 0;filter:drop-shadow(0 3px 8px rgba(0,0,0,.12))">
          ${renderServiceIconHtml(svc,'3.5rem')}
        </div>
        <h3 style="margin-top:0">${svc.name}</h3>
        <p style="font-size:.82rem">${svc.desc?.slice(0, 70) || ''}</p>
        <div class="svc-feat-price">EGP ${svc.price}<span> from</span></div>
        <a href="booking.ejs?service=${svc.id}" class="btn btn-outline btn-sm" style="margin-top:14px; width: 100%">Book Now</a>`;
      featGrid.appendChild(div);
    });
  }

  // --- TESTIMONIALS ---
  const testimonials = [
    { name: 'Mohamed A.', initials: 'MA', rating: 5, text: 'AutoServe handled my oil change and tire rotation in under an hour. Amazing service and very professional!' },
    { name: 'Sara K.', initials: 'SK', rating: 5, text: 'The full detailing job was incredible  my 5-year-old car looks brand new. Will definitely be back!' },
    { name: 'Ahmed T.', initials: 'AT', rating: 5, text: 'Booked online at 11PM, confirmed instantly. The whole process was seamless and transparent.' },
    { name: 'Nour M.', initials: 'NM', rating: 5, text: 'Great staff, on time, fair pricing. My MG ZS has never been better. Highly recommend!' },
    { name: 'Omar H.', initials: 'OH', rating: 4, text: 'Very professional team. The AC service was done perfectly. A bit of a wait but worth it.' },
    { name: 'Hana B.', initials: 'HB', rating: 5, text: 'I love the loyalty points system! Already redeemed a free car wash. Excellent concept.' },
  ];
  const tGrid = document.getElementById('testimonials-grid');
  if (tGrid) {
    // Use stored reviews + static
    const stored = await reviewsAPI.getApproved();
    const sources = stored.length >= 3 ? stored.slice(0, 6) : testimonials;
    sources.forEach((t, i) => {
      const isStored = !!t.userId;
      const user = isStored ? getById(KEYS.USERS, t.userId) : null;
      const name = isStored ? (user ? `${user.firstName} ${user.lastName.charAt(0)}.` : 'Customer') : t.name;
      const init = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const rating = isStored ? t.rating : t.rating;
      const text = isStored ? t.text : t.text;
      const div = document.createElement('div');
      div.className = 'testimonial-card animate-fade-in';
      div.style.animationDelay = (i * 0.1) + 's';
      
      let starsHtml = '';
      for (let star = 1; star <= 5; star++) {
        const isFilled = star <= rating;
        const color = isFilled ? '#fbbf24' : '#e5e7eb';
        const fill = isFilled ? color : 'none';
        starsHtml += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="${fill}" stroke="${color}" stroke-width="2" style="display:inline-block; margin-right:2px; vertical-align:middle; filter:drop-shadow(0 1px 2px rgba(251, 191, 36, 0.2));"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      }

      div.innerHTML = `
        <div class="t-quote">"</div>
        <div class="stars">${starsHtml}</div>
        <p class="t-text">"${text}"</p>
        <div class="t-author">
          <div class="t-avatar">${init}</div>
          <div><div class="t-name">${name}</div><div class="t-label">Verified Customer</div></div>
        </div>`;
      tGrid.appendChild(div);
    });
  }
});
