// terms.js — smooth scroll for TOC links
document.querySelectorAll('.toc-link').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if(target) target.scrollIntoView({ behavior:'smooth', block:'start' });
  });
});
