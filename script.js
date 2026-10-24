/* Alex Xiao · Content Portfolio · interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  /* ---------- Count-ups ---------- */
  const fmt = (v, d) => (d ? v.toFixed(d) : Math.round(v).toLocaleString());
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const to = parseFloat(el.dataset.to || '0');
    const d = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const dur = parseInt(el.dataset.duration || '1600', 10);
    if (reduce) { el.textContent = fmt(to, d) + suffix; return; }
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(to * easeOutExpo(p), d) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('.count', e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // hero counts start after the load animation begins
  setTimeout(() => $$('.hero .count').forEach(countUp), reduce ? 0 : 350);

  /* ---------- Cursor spotlight ---------- */
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    document.addEventListener('pointermove', e => {
      const t = e.target.closest && e.target.closest('.spot');
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', `${e.clientX - r.left}px`);
      t.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- Gold card tilt + sheen ---------- */
  const card = $('#goldcard');
  if (card && !reduce) {
    const stage = card.parentElement;
    let raf = 0, nx = 0, ny = 0, inside = false;
    const paint = () => {
      raf = 0;
      card.style.setProperty('--ry', `${nx * 14}deg`);
      card.style.setProperty('--rx', `${-ny * 12}deg`);
      card.style.setProperty('--lx', `${50 + nx * 45}%`);
      card.style.setProperty('--ly', `${50 + ny * 45}%`);
      card.style.setProperty('--sx', `${-60 + (nx + 1) * 60}%`);
    };
    const move = e => {
      const r = card.getBoundingClientRect();
      nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      nx = Math.max(-1, Math.min(1, nx)); ny = Math.max(-1, Math.min(1, ny));
      if (!raf) raf = requestAnimationFrame(paint);
    };
    stage.addEventListener('pointerenter', () => { inside = true; card.classList.add('tilting'); });
    stage.addEventListener('pointermove', move, { passive: true });
    stage.addEventListener('pointerleave', () => {
      inside = false; card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--lx', '30%'); card.style.setProperty('--ly', '20%');
      card.style.setProperty('--sx', '-60%');
    });
    // idle sheen sweep every few seconds when not hovered
    const idle = () => {
      if (!inside) {
        card.style.setProperty('--sx', '60%');
        setTimeout(() => { if (!inside) card.style.setProperty('--sx', '-60%'); }, 1300);
      }
    };
    setTimeout(idle, 1600);
    setInterval(idle, 6500);
    // device tilt on mobile (if permitted without prompt)
    if (window.DeviceOrientationEvent && !fine) {
      window.addEventListener('deviceorientation', e => {
        if (e.gamma == null) return;
        nx = Math.max(-1, Math.min(1, e.gamma / 30));
        ny = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
        if (!raf) raf = requestAnimationFrame(paint);
      }, { passive: true });
    }
  }

  /* ---------- Ticker (duplicate for seamless loop) ---------- */
  const ticker = $('#ticker');
  if (ticker) ticker.innerHTML += ticker.innerHTML;

  /* ---------- Filters with FLIP-ish transitions ---------- */
  const grid = $('#grid');
  const featured = $('.featured');
  const countEl = $('#count');
  const filterBtns = $$('[data-filter]');
  const items = () => [featured, ...$$('.vcard', grid)].filter(Boolean);
  let filtering = false;

  function applyFilter(f) {
    if (filtering) return;
    filtering = true;
    const all = items();
    const toHide = all.filter(el => !el.hidden && f !== 'All' && el.dataset.brand !== f);
    const toShow = all.filter(el => el.hidden && (f === 'All' || el.dataset.brand === f));
    toHide.forEach(el => el.classList.add('leaving'));
    const swap = () => {
      toHide.forEach(el => { el.hidden = true; el.classList.remove('leaving'); });
      toShow.forEach(el => { el.hidden = false; el.classList.add('entering', 'in'); });
      $$('.vcard:not([hidden]), .featured:not([hidden])').forEach((el, i) => el.style.setProperty('--i', i));
      setTimeout(() => toShow.forEach(el => el.classList.remove('entering')), 700);
      const n = all.filter(el => !el.hidden).length;
      countEl.textContent = `${String(n).padStart(2, '0')} ${n === 1 ? 'video' : 'videos'}`;
      filtering = false;
    };
    reduce || !toHide.length ? swap() : setTimeout(swap, 280);
  }
  filterBtns.forEach(b => b.addEventListener('click', () => {
    filterBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    applyFilter(b.dataset.filter);
  }));

  /* ---------- Accordions ---------- */
  $$('.role').forEach(role => {
    const head = $('.role-head', role);
    if (head.getAttribute('aria-expanded') === 'true') role.classList.add('open');
    head.addEventListener('click', () => {
      const open = role.classList.toggle('open');
      head.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Drawer ---------- */
  const body = document.body;
  const menuBtn = $('#menuBtn');
  const drawer = $('#drawer');
  const setMenu = open => {
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
  };
  menuBtn.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $('#closeBtn').addEventListener('click', () => setMenu(false));
  $('#backdrop').addEventListener('click', () => setMenu(false));
  $$('.drawer-links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Dock: sliding indicator + scroll spy ---------- */
  const dockPill = $('#dockPill');
  const dockInd = $('#dockInd');
  const dockLinks = $$('a', dockPill);
  function placeInd(link, animate = true) {
    if (!animate) dockInd.style.transition = 'none';
    dockInd.style.setProperty('--x', `${link.offsetLeft}px`);
    dockInd.style.setProperty('--w', `${link.offsetWidth}px`);
    if (!animate) requestAnimationFrame(() => (dockInd.style.transition = ''));
  }
  function setActive(sec) {
    dockLinks.forEach(a => a.classList.toggle('is-active', a.dataset.sec === sec));
    const link = dockLinks.find(a => a.dataset.sec === sec);
    // width transitions on the link, so settle after it finishes
    placeInd(link);
    setTimeout(() => placeInd(link), 620);
  }
  const secMap = { home: 'home', overview: 'home', work: 'work', impact: 'impact', contact: 'contact' };
  const secEls = ['home', 'overview', 'work', 'impact', 'contact'].map(id => document.getElementById(id)).filter(Boolean);
  let current = 'home', spyRaf = 0;
  const spy = () => {
    spyRaf = 0;
    const probe = window.innerHeight * 0.45;
    let hit = secEls[0];
    for (const s of secEls) { if (s.getBoundingClientRect().top <= probe) hit = s; }
    // bottom of page: force last section
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) hit = secEls[secEls.length - 1];
    const next = secMap[hit.id];
    if (next !== current) { current = next; setActive(next); }
  };
  window.addEventListener('scroll', () => { if (!spyRaf) spyRaf = requestAnimationFrame(spy); }, { passive: true });
  spy();
  dockLinks.forEach(a => a.addEventListener('click', () => { current = a.dataset.sec; setActive(a.dataset.sec); }));
  window.addEventListener('resize', () => placeInd(dockLinks.find(a => a.classList.contains('is-active')), false));
  window.addEventListener('load', () => placeInd(dockLinks[0], false));
  placeInd(dockLinks[0], false);

  $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- Gauge (tick arc + needle) ---------- */
  const g = $('#gauge');
  if (g) {
    const NS = 'http://www.w3.org/2000/svg';
    const cx = 160, cy = 160, R = 140;
    const mk = (n, attrs) => { const el = document.createElementNS(NS, n); for (const k in attrs) el.setAttribute(k, attrs[k]); return el; };
    g.appendChild(mk('circle', { class: 'glow', cx, cy, r: 26 }));
    const start = -200, end = 20, n = 44;
    for (let i = 0; i <= n; i++) {
      const a = (start + (end - start) * (i / n)) * Math.PI / 180;
      const major = i % 4 === 0;
      const r1 = major ? R - 26 : R - 16;
      g.appendChild(mk('line', {
        class: 'tick' + (major ? ' major' : ''),
        x1: cx + Math.cos(a) * r1, y1: cy + Math.sin(a) * r1,
        x2: cx + Math.cos(a) * R, y2: cy + Math.sin(a) * R,
      }));
    }
    g.appendChild(mk('line', { class: 'needle', x1: cx, y1: cy, x2: cx + R - 34, y2: cy }));
    g.appendChild(mk('circle', { class: 'hub', cx, cy, r: 4 }));
  }
})();
