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
  const items = () => [featured, ...$$('.vrow', grid)].filter(Boolean);
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
      $$('.vrow:not([hidden]), .featured:not([hidden])').forEach((el, i) => el.style.setProperty('--i', i));
      setTimeout(() => toShow.forEach(el => el.classList.remove('entering')), 700);
      const n = all.filter(el => !el.hidden).length;
      countEl.textContent = `${String(n).padStart(2, '0')} on the board · 09 on the wheel`;
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


  /* ---------- Bonus round: roulette ---------- */
  (function roulette() {
    const svg = $('#wheel'); if (!svg) return;
    const data = $$('.wheel-data li').map(li => ({ ...li.dataset }));
    const n = data.length; if (!n) return;
    const NS = 'http://www.w3.org/2000/svg';
    const C = 250, R_OUT = 244, R_TRACK_O = 226, R_TRACK_I = 208, R_BAND_O = 206, R_POCKET_O = 182, R_POCKET_I = 104, R_HUB = 100;
    const el = (t, a, parent) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; };
    const P = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; };
    const step = 360 / n;

    // defs
    const defs = el('defs', {}, svg);
    const grad = (id, stops, attrs = {}) => { const g = el(attrs.r ? 'radialGradient' : 'linearGradient', { id, ...attrs }, defs); stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g)); };
    grad('rimG', [[0, '#5c4719'], [.18, '#a68538'], [.4, '#f0dc98'], [.55, '#d9bd6e'], [.75, '#8a6d2c'], [1, '#c7a751']], { x1: 0, y1: 0, x2: 1, y2: 1 });
    grad('studG', [[0, '#fff3c4'], [.5, '#d4b45f'], [1, '#6e5620']], { r: '60%', cx: '35%', cy: '30%' });
    grad('hubG', [[0, '#f3e3a6'], [.45, '#cfae55'], [1, '#6a521f']], { r: '70%', cx: '40%', cy: '30%' });
    grad('ballG', [[0, '#ffffff'], [.5, '#e8e0cc'], [1, '#8a8275']], { r: '65%', cx: '35%', cy: '30%' });
    grad('shadeG', [[0, 'rgba(10,9,8,.0)'], [.7, 'rgba(10,9,8,.15)'], [1, 'rgba(10,9,8,.75)']], { r: '50%', cx: '50%', cy: '50%' });

    // static base: rim, studs, track
    el('circle', { cx: C, cy: C, r: R_OUT, class: 'rim' }, svg);
    el('circle', { cx: C, cy: C, r: R_OUT - 14, class: 'rim-inner' }, svg);
    for (let i = 0; i < 36; i++) { const [x, y] = P(R_OUT - 7, i * 10); el('circle', { cx: x, cy: y, r: 2.4, class: 'stud' }, svg); }
    el('circle', { cx: C, cy: C, r: R_TRACK_O, class: 'track' }, svg);

    // rotating group
    const rot = el('g', { class: 'rot' }, svg);
    const pockets = [];
    data.forEach((d, i) => {
      const a0 = i * step - step / 2, a1 = a0 + step, mid = i * step;
      const [x0o, y0o] = P(R_POCKET_O, a0), [x1o, y1o] = P(R_POCKET_O, a1), [x0i, y0i] = P(R_POCKET_I, a0), [x1i, y1i] = P(R_POCKET_I, a1);
      const [bx0, by0] = P(R_BAND_O, a0), [bx1, by1] = P(R_BAND_O, a1);
      const path = `M ${x0i} ${y0i} L ${x0o} ${y0o} A ${R_POCKET_O} ${R_POCKET_O} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${R_POCKET_I} ${R_POCKET_I} 0 0 0 ${x0i} ${y0i} Z`;
      const clip = el('clipPath', { id: 'pk' + i }, defs); el('path', { d: path }, clip);
      const g = el('g', { class: 'pocket', 'data-i': i }, rot);
      el('path', { d: path, fill: i % 2 ? '#1c1813' : '#14110c' }, g);
      // thumbnail, rotated so the top of the video points to the rim
      const [mx, my] = P((R_POCKET_O + R_POCKET_I) / 2, mid);
      const w = 2 * R_POCKET_O * Math.sin(step * Math.PI / 360) + 10, hgt = R_POCKET_O - R_POCKET_I + 10;
      const img = el('image', { href: d.img, x: mx - w / 2, y: my - hgt / 2, width: w, height: hgt, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#pk${i})`, class: 'pocket-img', transform: `rotate(${mid} ${mx} ${my})` }, g);
      el('path', { d: path, class: 'pocket-shade' }, g);
      // number band (outside the thumbnail ring)
      const band = `M ${x0o} ${y0o} L ${bx0} ${by0} A ${R_BAND_O} ${R_BAND_O} 0 0 1 ${bx1} ${by1} L ${x1o} ${y1o} A ${R_POCKET_O} ${R_POCKET_O} 0 0 0 ${x0o} ${y0o} Z`;
      el('path', { d: band, class: 'band' + (i % 2 ? ' alt' : '') }, g);
      const [lx, ly] = P((R_BAND_O + R_POCKET_O) / 2, mid);
      el('text', { x: lx, y: ly + 4, class: 'label', transform: `rotate(${mid} ${lx} ${ly})` }, g).textContent = d.views;
      el('path', { d: `M ${x0i} ${y0i} L ${bx0} ${by0} A ${R_BAND_O} ${R_BAND_O} 0 0 1 ${bx1} ${by1} L ${x1i} ${y1i} A ${R_POCKET_I} ${R_POCKET_I} 0 0 0 ${x0i} ${y0i} Z`, class: 'pocket-win-glow' }, g);
      pockets.push(g);
    });
    // separators + rings
    for (let i = 0; i < n; i++) { const a = i * step - step / 2; const [x0, y0] = P(R_POCKET_I, a), [x1, y1] = P(R_BAND_O, a); el('line', { x1: x0, y1: y0, x2: x1, y2: y1, class: 'pocket-line' }, rot); }
    el('circle', { cx: C, cy: C, r: R_POCKET_O, class: 'pocket-ring' }, rot);
    el('circle', { cx: C, cy: C, r: R_BAND_O, class: 'pocket-ring strong' }, rot);
    el('circle', { cx: C, cy: C, r: R_POCKET_I, class: 'pocket-ring' }, rot);
    // hub + turret
    el('circle', { cx: C, cy: C, r: R_HUB, class: 'hub' }, rot);
    el('circle', { cx: C, cy: C, r: R_HUB - 16, class: 'hub-2' }, rot);
    [0, 90, 180, 270].forEach(a => { const [x0, y0] = P(R_HUB - 14, a), [x1, y1] = P(R_HUB - 60, a); el('line', { x1: x0, y1: y0, x2: x1, y2: y1, class: 'turret' }, rot); el('circle', { cx: x0, cy: y0, r: 7, class: 'turret-cap' }, rot); });
    const cap = el('g', { class: 'cap' }, svg);
    el('circle', { cx: C, cy: C, r: 26, class: 'hub' }, cap);
    el('text', { x: C, y: C + 10, class: 'mono' }, cap).textContent = 'ax.';

    // ball
    const orbit = el('g', { class: 'ball-orbit' }, svg);
    const ball = el('g', { class: 'ball' }, orbit);
    el('circle', { cx: C, cy: C - (R_TRACK_O + R_TRACK_I) / 2, r: 7, class: 'ball-dot' }, ball);

    // state
    const btn = $('#spinBtn'), again = $('#againBtn'), result = $('#result'), stage = $('#wheelStage'), burst = $('#burst');
    const countEl = $('#spinCount');
    let spins = 0; try { spins = parseInt(localStorage.getItem('ax-spins') || '0', 10) || 0; } catch (e) {}
    countEl.textContent = spins.toLocaleString();
    let angle = 0, ballAngle = 0, busy = false, winner = -1;
    for (let k = 0; k < 18; k++) el('i', {}, null) ; // noop
    for (let k = 0; k < 22; k++) { const s = document.createElement('i'); burst.appendChild(s); }

    function showResult(d) {
      $('#resImg').src = d.img; $('#resBrand').textContent = d.brand; $('#resPlat').textContent = d.plat;
      $('#resTitle').textContent = d.title; $('#resSub').textContent = d.sub; $('#resViews').textContent = d.views;
      $('#resLink').href = d.url;
      result.classList.add('show');
    }
    function fire() {
      burst.querySelectorAll('i').forEach(s => {
        const a = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 180;
        s.style.setProperty('--dx', Math.cos(a) * dist + 'px'); s.style.setProperty('--dy', Math.sin(a) * dist + 'px');
        s.style.setProperty('--rz', (Math.random() * 720 - 360) + 'deg'); s.style.setProperty('--d', Math.random() * 120);
      });
      burst.classList.remove('go'); void burst.offsetWidth; burst.classList.add('go');
    }
    function spin() {
      if (busy) return; busy = true;
      btn.disabled = true; result.classList.remove('show');
      if (winner >= 0) pockets[winner].classList.remove('win');
      ball.classList.remove('dropped');
      const pick = Math.floor(Math.random() * n);
      const jitter = (Math.random() - 0.5) * step * 0.5;
      const turns = 5 + Math.floor(Math.random() * 3);
      // bring pocket "pick" to the top marker: rotation ≡ -pick*step (mod 360)
      const cur = ((angle % 360) + 360) % 360;
      const target = ((-pick * step - jitter) - cur + 360) % 360;
      angle += turns * 360 + target;
      ballAngle -= (turns + 2) * 360; // ends at the top (multiple of 360)
      const dur = reduce ? 0.001 : 5.8, bdur = reduce ? 0.001 : 5.0;
      rot.style.setProperty('--dur', dur + 's'); orbit.style.setProperty('--bdur', bdur + 's');
      rot.classList.add('spinning'); orbit.classList.add('spinning');
      stage.style.setProperty('--tilt', '8deg');
      requestAnimationFrame(() => { rot.style.transform = `rotate(${angle}deg)`; orbit.style.transform = `rotate(${ballAngle}deg)`; });
      setTimeout(() => ball.classList.add('dropped'), bdur * 1000 - 150);
      setTimeout(() => {
        winner = pick; pockets[pick].classList.add('win');
        stage.style.setProperty('--tilt', '0deg');
        spins++; countEl.textContent = spins.toLocaleString(); try { localStorage.setItem('ax-spins', String(spins)); } catch (e) {}
        fire(); showResult(data[pick]);
        btn.disabled = false; busy = false;
      }, dur * 1000 + 120);
    }
    btn.addEventListener('click', spin);
    again.addEventListener('click', spin);
    svg.addEventListener('click', spin);
    svg.style.cursor = 'pointer';
  })();

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
