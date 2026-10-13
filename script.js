/* ==========================================================================
   CLEAN MASTER VALVERDE — script.js
   Sin dependencias. Módulos:
   loader · scroll suave · progreso · header · hero (parallax + burbujas) ·
   manifiesto · demo de limpieza · servicios (scroll horizontal) · bento ·
   proceso (ruta animada) · galería · marquee · FAQ · cursor · formulario
   ========================================================================== */
(() => {
  'use strict';
  window.__cm = true;

  /* ---------- Utilidades ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desk = matchMedia('(min-width: 960px)');
  const WA = '525515741462';

  let vw = innerWidth, vh = innerHeight;
  let locked = true;           // scroll bloqueado (loader / menú)
  let menuOpen = false;
  let noHideUntil = 0;
  const pointer = { x: -999, y: -999, has: false };
  const M = {};                // medidas en caché

  try { history.scrollRestoration = 'manual'; } catch (e) { /* noop */ }
  if (!location.hash) window.scrollTo(0, 0);

  /* ======================================================================
     1 · SCROLL SUAVE (inercia) + navegación por anclas
     ====================================================================== */
  const smooth = { on: false, target: 0, cur: 0, anchor: null, busy: 0 };
  const maxScroll = () => Math.max(0, root.scrollHeight - innerHeight);

  function initSmooth() {
    if (reduced || !fine) return;
    smooth.on = true;
    smooth.target = smooth.cur = window.scrollY;
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.defaultPrevented) return;
      if (locked) { e.preventDefault(); return; }
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.target.closest && e.target.closest('textarea')) return;
      e.preventDefault();
      smooth.anchor = null;
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 34; else if (e.deltaMode === 2) dy *= innerHeight;
      smooth.target = clamp(smooth.target + dy, 0, maxScroll());
    }, { passive: false });
    addEventListener('scroll', () => {
      // scroll "externo" (teclado, barra, anclas nativas): sincroniza.
      // Los eventos que provoca nuestro propio scrollTo se ignoran (ventana de 140 ms).
      if (performance.now() < smooth.busy) return;
      if (Math.abs(window.scrollY - smooth.cur) > 3) { smooth.target = smooth.cur = window.scrollY; smooth.anchor = null; }
    }, { passive: true });
  }
  function smoothStep(dt) {
    if (locked) { smooth.target = smooth.cur = window.scrollY; return; }
    if (smooth.anchor) smooth.target = clamp(anchorY(smooth.anchor), 0, maxScroll()); // sigue al destino si el diseño cambia
    const diff = smooth.target - smooth.cur;
    if (Math.abs(diff) > 0.4) {
      smooth.cur += diff * (1 - Math.exp(-dt * 7));
      smooth.busy = performance.now() + 140;
      window.scrollTo(0, smooth.cur);
    } else {
      if (diff !== 0) { smooth.cur = smooth.target; smooth.busy = performance.now() + 140; window.scrollTo(0, smooth.cur); }
      smooth.anchor = null;
    }
  }
  const anchorY = (el) => (el.id === 'inicio' ? 0 : el.getBoundingClientRect().top + window.scrollY);
  function goTo(dest) {
    const y = clamp(typeof dest === 'number' ? dest : anchorY(dest), 0, maxScroll());
    noHideUntil = performance.now() + 1800;
    if (smooth.on) { smooth.target = y; smooth.anchor = typeof dest === 'number' ? null : dest; }
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      // preselecciona el servicio en el formulario si el enlace lo indica
      if (a.dataset.service) {
        $$('input[name="servicio"]').forEach((c) => { c.checked = c.value === a.dataset.service; });
      }
      setTimeout(() => goTo(el), menuOpen ? 350 : 0);
      history.replaceState(null, '', id);
    });
    $('#toTop') && $('#toTop').addEventListener('click', () => goTo(0));
  }

  /* ======================================================================
     2 · LOADER (esfera que se llena de agua) → cortina hacia arriba
     ====================================================================== */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) { root.classList.add('ready'); locked = false; return; }
    $$('.loader__brand span').forEach((s, i) => s.style.setProperty('--k', i));
    const level = $('#orbLevel'), numEl = $('#loaderNum'), orb = $('#orb');
    root.classList.add('is-locked');
    const minMs = reduced ? 700 : 2700;
    let pageReady = false;
    const markReady = () => { pageReady = true; };
    Promise.all([
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      new Promise((res) => (document.readyState === 'complete' ? res() : addEventListener('load', res, { once: true }))),
    ]).then(markReady);
    setTimeout(markReady, 7000);

    const t0 = performance.now();
    let shown = 0, finished = false;
    const paint = () => {
      level.setAttribute('transform', 'translate(0 ' + (200 - 192 * shown).toFixed(2) + ')');
      numEl.textContent = Math.round(shown * 100);
    };
    const finish = () => {
      finished = true;
      shown = 1; paint();
      orb.classList.add('is-pop');
      setTimeout(() => {
        loader.classList.add('is-done');
        root.classList.remove('is-locked');
        locked = false;
        root.classList.add('ready');
        setTimeout(() => loader.remove(), 1900);
        setTimeout(waTip, 7000);
      }, reduced ? 100 : 750);
    };
    (function frame(now) {
      if (finished) return;
      const t = clamp((now - t0) / minMs);
      let target = 1 - Math.pow(1 - t, 2.4);
      if (!pageReady) target = Math.min(target, 0.9);
      shown += (target - shown) * 0.14;
      paint();
      if (t >= 1 && pageReady && shown > 0.985) return finish();
      requestAnimationFrame(frame);
    })(t0);
  }

  /* ======================================================================
     3 · TEXTO: partir en palabras
     ====================================================================== */
  function splitWords(el) {
    let idx = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.className = 'wi';
            s.style.setProperty('--wi', idx++); s.textContent = tok;
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return idx;
  }

  /* ======================================================================
     4 · REVEALS al hacer scroll
     ====================================================================== */
  function initReveal() {
    $$('[data-split]').forEach((el) => { splitWords(el); el.classList.add('is-split'); });
    $$('[data-stagger]').forEach((p) => {
      $$(':scope > [data-reveal]', p).forEach((c, i) => c.style.setProperty('--i', i));
    });
    const manualFoot = $('.manifesto__foot');
    if (manualFoot) manualFoot.dataset.manual = '';
    const targets = $$('[data-reveal],[data-split]').filter((el) => !('manual' in el.dataset));
    if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
    targets.forEach((el) => io.observe(el));
  }

  /* ======================================================================
     5 · BURBUJAS (canvas) — suben, reaccionan y se revientan con el cursor
     ====================================================================== */
  const bubbleSystems = [];
  class Bubbles {
    constructor(canvas, opts) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({ tint: [150, 220, 255], density: 26000, max: 46, min: 14 }, opts);
      this.items = []; this.parts = []; this.vis = true; this.t = 0; this.w = 0; this.h = 0;
      this.resize();
      new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
      new IntersectionObserver(([e]) => { this.vis = e.isIntersecting; }).observe(canvas);
      bubbleSystems.push(this);
    }
    resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = this.c.getBoundingClientRect();
      this.w = r.width; this.h = r.height;
      if (!this.w || !this.h) return;
      this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = this.w < 700;
      const want = clamp(Math.round((this.w * this.h) / this.opts.density), this.opts.min, mobile ? Math.round(this.opts.max * 0.55) : this.opts.max);
      while (this.items.length < want) this.items.push(this.spawn(true));
      this.items.length = want;
    }
    spawn(anywhere) {
      const big = Math.random() < 0.09;
      const r = big ? rand(24, 44) : rand(5, 20);
      const x0 = rand(0, this.w);
      return { x0, x: x0, y: anywhere ? rand(0, this.h) : this.h + r + rand(0, 120), r, vy: rand(18, 52) * (big ? 0.7 : 1), amp: rand(6, 22), f: rand(0.5, 1.5), ph: rand(0, TAU), a: rand(0.55, 1) };
    }
    pop(b) {
      const [R, G, B] = this.opts.tint;
      for (let i = 0; i < 8; i++) {
        const an = rand(0, TAU), sp = rand(40, 130);
        this.parts.push({ x: b.x, y: b.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 30, r: rand(1.2, 3.2), life: 1, k: rand(1.4, 2.4), ring: false });
      }
      this.parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, r: b.r, life: 1, k: 2.6, ring: true });
      Object.assign(b, this.spawn(false));
    }
    frame(dt) {
      if (!this.vis || !this.w || document.hidden) return;
      this.t += dt;
      const ctx = this.ctx, [R, G, B] = this.opts.tint;
      const rect = this.c.getBoundingClientRect();
      const mx = pointer.x - rect.left, my = pointer.y - rect.top;
      ctx.clearRect(0, 0, this.w, this.h);
      for (const b of this.items) {
        b.y -= b.vy * dt;
        b.x = b.x0 + Math.sin(this.t * b.f + b.ph) * b.amp;
        if (b.y < -b.r * 2) Object.assign(b, this.spawn(false));
        if (pointer.has) {
          const dx = b.x - mx, dy = b.y - my;
          const d = Math.hypot(dx, dy);
          if (d < b.r + 4) { this.pop(b); continue; }
          if (d < b.r + 90) { b.x0 += (dx / d) * (1 - d / (b.r + 90)) * 40 * dt * 6; }
        }
        const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.08, b.x, b.y, b.r);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.34 * b.a) + ')');
        g.addColorStop(0.62, 'rgba(' + R + ',' + G + ',' + B + ',' + (0.05 * b.a) + ')');
        g.addColorStop(1, 'rgba(' + R + ',' + G + ',' + B + ',' + (0.34 * b.a) + ')');
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,' + (0.38 * b.a) + ')'; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.4, b.y - b.r * 0.4, Math.max(1.2, b.r * 0.2), 0, TAU);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.75 * b.a) + ')'; ctx.fill();
      }
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.life -= dt * p.k;
        if (p.life <= 0) { this.parts.splice(i, 1); continue; }
        if (p.ring) {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + (1 - p.life) * 0.9), 0, TAU);
          ctx.strokeStyle = 'rgba(255,255,255,' + p.life * 0.6 + ')'; ctx.lineWidth = 1.5; ctx.stroke();
        } else {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU);
          ctx.fillStyle = 'rgba(255,255,255,' + p.life * 0.85 + ')'; ctx.fill();
        }
      }
    }
  }

  /* ======================================================================
     6 · HERO: parallax con el mouse
     ====================================================================== */
  const heroState = { mx: 0, my: 0, tx: 0, ty: 0 };
  function initHero() {
    $$('[data-depth]').forEach((e) => e.style.setProperty('--depth', e.dataset.depth));
    if (!fine) return;
    addEventListener('pointermove', (e) => {
      heroState.tx = (e.clientX / innerWidth - 0.5) * 2;
      heroState.ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* ======================================================================
     7 · Marquee con inercia de scroll
     ====================================================================== */
  const mrows = [];
  function buildMarquee() {
    mrows.forEach((r) => {
      $$('[data-clone]', r.track).forEach((n) => n.remove());
      r.W = r.track.scrollWidth;
      if (!r.W) return;
      const copies = Math.ceil(innerWidth / r.W) + 1;
      for (let k = 0; k < copies; k++) {
        r.base.forEach((n) => { const c = n.cloneNode(true); c.dataset.clone = '1'; c.setAttribute('aria-hidden', 'true'); r.track.appendChild(c); });
      }
      r.x = r.dir < 0 ? 0 : -r.W;
    });
  }
  function initMarquee() {
    $$('.marquee__row').forEach((row) => {
      const track = $('.marquee__track', row);
      mrows.push({ row, track, base: Array.from(track.children), W: 0, x: 0, dir: Number(row.dataset.dir) || -1, vis: true });
    });
    mrows.forEach((r) => new IntersectionObserver(([e]) => { r.vis = e.isIntersecting; }).observe(r.row));
    buildMarquee();
    if (document.fonts) document.fonts.ready.then(buildMarquee);
  }

  /* ======================================================================
     8 · Manifiesto (palabras que se encienden con el scroll)
     ====================================================================== */
  let manWords = [];
  function initManifesto() {
    const el = $('.manifesto__text');
    if (!el) return;
    const n = splitWords(el);
    manWords = $$('.wi', el);
    if (reduced) manWords.forEach((w) => w.style.setProperty('--o', 1));
    return n;
  }

  /* ======================================================================
     9 · Servicios: scroll horizontal anclado
     ====================================================================== */
  const svc = { sec: null, pin: null, track: null, bar: null, cards: [], maxX: 0, active: false };
  function initSvc() {
    svc.sec = $('#servicios'); if (!svc.sec) return;
    svc.pin = $('.svc__pin', svc.sec); svc.track = $('#svcTrack'); svc.bar = $('#svcBar');
    svc.cards = $$('.card', svc.track);
  }
  function setupSvc() {
    if (!svc.sec) return;
    svc.active = desk.matches && !reduced;
    if (svc.active) {
      svc.track.style.transform = '';
      svc.maxX = Math.max(0, svc.track.offsetWidth - innerWidth);
      const h = Math.round(svc.maxX + svc.pin.offsetHeight) + 'px';
      if (svc.sec.style.height !== h) svc.sec.style.height = h;
    } else {
      svc.sec.style.height = ''; svc.track.style.transform = ''; svc.maxX = 0;
    }
  }

  /* ======================================================================
     10 · Proceso: ruta animada (furgoneta recorre el camino)
     ====================================================================== */
  const proc = { sec: null, base: null, fill: null, van: null, len: 0, nodes: [], fracs: [], steps: [], last: -1 };
  function initProcess() {
    proc.sec = $('#proceso'); if (!proc.sec) return;
    proc.base = $('#routeBase'); proc.fill = $('#routeFill'); proc.van = $('#van2');
    proc.nodes = $$('.route__node'); proc.steps = $$('.step', proc.sec);
    try {
      proc.len = proc.base.getTotalLength();
      proc.fill.style.strokeDasharray = proc.len;
      proc.fill.style.strokeDashoffset = proc.len;
      // fracción del camino donde está cada nodo
      const pts = []; for (let i = 0; i <= 240; i++) pts.push(proc.base.getPointAtLength((i / 240) * proc.len));
      proc.fracs = proc.nodes.map((n) => {
        const nx = parseFloat(n.style.getPropertyValue('--x')) / 100 * 1200;
        const ny = parseFloat(n.style.getPropertyValue('--y')) / 100 * 220;
        let best = 0, bd = 1e9;
        pts.forEach((p, i) => { const d = Math.hypot(p.x - nx, p.y - ny); if (d < bd) { bd = d; best = i; } });
        return best / 240;
      });
    } catch (e) { proc.len = 0; }
    // en móvil / movimiento reducido: los pasos se activan al entrar
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((en) => {
        if (en.isIntersecting && (!desk.matches || reduced)) { en.target.classList.add('is-on'); io.unobserve(en.target); }
      }), { threshold: 0.35 });
      proc.steps.forEach((s) => io.observe(s));
    }
  }
  function setRoute(f) {
    if (!proc.len) return;
    proc.fill.style.strokeDashoffset = (proc.len * (1 - f)).toFixed(1);
    const L = f * proc.len;
    const a = proc.base.getPointAtLength(L), b = proc.base.getPointAtLength(Math.min(proc.len, L + 3));
    const ang = clamp(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI, -24, 24);
    proc.van.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    proc.nodes.forEach((n, i) => n.classList.toggle('is-on', f >= proc.fracs[i] - 0.004));
    proc.steps.forEach((s, i) => s.classList.toggle('is-on', f >= proc.fracs[i] - 0.03));
  }

  /* ======================================================================
     11 · Demo "Pásale el extractor" (canvas interactivo)
     ====================================================================== */
  function initWipe() {
    const stage = $('#wipeStage'); if (!stage) return;
    const dirt = $('#wipeDirt'), fx = $('#wipeFx');
    const dctx = dirt.getContext('2d', { willReadFrequently: true }), fctx = fx.getContext('2d');
    const wand = $('#wand'), ring = $('#meterRing'), numEl = $('#meterNum'), msgEl = $('#meterMsg');
    const sample = document.createElement('canvas'); sample.width = sample.height = 36;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    let W = 0, H = 0, dpr = 1, baseSum = 1, pct = 0, done = false, touched = false;
    let last = null, auto = null, lastMeasure = 0, parts = [], fxRunning = false, lastFoam = 0;

    const MSG = [[100, '¡Como nuevo!'], [70, 'Casi como nuevo…'], [40, 'Mira cómo sale la suciedad.'], [15, '¡Ya empieza a verse el cambio!'], [0, 'Aún se ve como un día difícil.']];
    const setPct = (p) => {
      p = clamp(Math.round(p), 0, 100); pct = p;
      ring.style.setProperty('--p', p); numEl.textContent = p;
      msgEl.textContent = (MSG.find((m) => p >= m[0]) || MSG[4])[1];
    };
    const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

    function alphaSum() {
      sctx.clearRect(0, 0, 36, 36);
      sctx.drawImage(dirt, 0, 0, 36, 36);
      const d = sctx.getImageData(0, 0, 36, 36).data; let s = 0;
      for (let i = 3; i < d.length; i += 4) s += d[i];
      return s;
    }
    function paintDirt() {
      const rnd = mulberry(11), m = Math.min(W, H);
      dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, W, H);
      // película de suciedad base
      dctx.fillStyle = 'rgba(92,68,42,.5)'; dctx.fillRect(0, 0, W, H);
      // nubes de polvo
      for (let i = 0; i < 90; i++) {
        const x = rnd() * W, y = rnd() * H, r = (0.05 + rnd() * 0.2) * m;
        const g = dctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(48,32,18,' + (0.1 + rnd() * 0.24) + ')'); g.addColorStop(1, 'rgba(48,32,18,0)');
        dctx.fillStyle = g; dctx.beginPath(); dctx.arc(x, y, r, 0, TAU); dctx.fill();
      }
      // manchas irregulares (derrames): varios círculos desplazados + halo suave
      for (let i = 0; i < 7; i++) {
        const x = (0.14 + rnd() * 0.72) * W, y = (0.14 + rnd() * 0.72) * H, r = (0.05 + rnd() * 0.08) * m;
        const halo = dctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.1);
        halo.addColorStop(0, 'rgba(60,38,18,.3)'); halo.addColorStop(1, 'rgba(60,38,18,0)');
        dctx.fillStyle = halo; dctx.beginPath(); dctx.arc(x, y, r * 2.1, 0, TAU); dctx.fill();
        for (let k = 0; k < 9; k++) {
          const an = rnd() * TAU, d = rnd() * r * 0.8, rr = r * (0.35 + rnd() * 0.5);
          dctx.beginPath(); dctx.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, rr, 0, TAU);
          dctx.fillStyle = 'rgba(50,30,12,' + (0.2 + rnd() * 0.18) + ')'; dctx.fill();
        }
        for (let k = 0; k < 3; k++) { // gotas que escurren
          const gx = x + (rnd() - 0.5) * r * 1.4, gy = y + r * (0.6 + rnd() * 0.5), gl = r * (0.5 + rnd() * 0.9);
          dctx.beginPath(); dctx.ellipse(gx, gy + gl / 2, r * 0.1, gl / 2, 0, 0, TAU);
          dctx.fillStyle = 'rgba(50,30,12,.3)'; dctx.fill();
        }
      }
      // motas
      for (let i = 0; i < 560; i++) {
        dctx.beginPath(); dctx.arc(rnd() * W, rnd() * H, (0.5 + rnd() * 1.9) * dpr, 0, TAU);
        dctx.fillStyle = 'rgba(38,24,12,' + (0.2 + rnd() * 0.4) + ')'; dctx.fill();
      }
      // viñeta
      const v = dctx.createRadialGradient(W / 2, H / 2, m * 0.3, W / 2, H / 2, m * 0.85);
      v.addColorStop(0, 'rgba(30,18,8,0)'); v.addColorStop(1, 'rgba(30,18,8,.35)');
      dctx.fillStyle = v; dctx.fillRect(0, 0, W, H);
      baseSum = alphaSum() || 1;
    }
    function sizeCanvases() {
      const r = stage.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(devicePixelRatio || 1, 2);
      const nw = Math.round(r.width * dpr), nh = Math.round(r.height * dpr);
      if (nw === W && nh === H) return;
      const had = W > 0 && touched && !done;
      let tmp = null;
      if (had) { tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; tmp.getContext('2d').drawImage(dirt, 0, 0); }
      W = nw; H = nh;
      dirt.width = fx.width = W; dirt.height = fx.height = H;
      if (had) dctx.drawImage(tmp, 0, 0, W, H); else if (!done) paintDirt();
    }

    function erase(x, y) {
      const R = Math.max(34 * dpr, Math.min(W, H) * 0.11);
      const g = dctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.globalCompositeOperation = 'destination-out'; dctx.fillStyle = g;
      dctx.beginPath(); dctx.arc(x, y, R, 0, TAU); dctx.fill();
      dctx.globalCompositeOperation = 'source-over';
    }
    function stroke(x, y) {
      if (last) {
        const dx = x - last.x, dy = y - last.y, dist = Math.hypot(dx, dy), step = Math.max(8 * dpr, 16 * dpr);
        const n = Math.max(1, Math.ceil(dist / step));
        for (let i = 1; i <= n; i++) erase(last.x + (dx * i) / n, last.y + (dy * i) / n);
      } else erase(x, y);
      last = { x, y };
      const now = performance.now();
      if (now - lastFoam > 38) { lastFoam = now; foam(x, y); }
      if (now - lastMeasure > 110) { lastMeasure = now; measure(); }
    }
    function measure() {
      const cleaned = 1 - alphaSum() / baseSum;
      const p = clamp(cleaned / 0.8) * 100;
      setPct(p);
      if (p >= 100 && !done) finish();
    }
    function foam(x, y) {
      for (let i = 0; i < 2; i++) parts.push({ x: x + rand(-18, 18) * dpr, y: y + rand(-14, 14) * dpr, vx: rand(-12, 12) * dpr, vy: rand(-46, -16) * dpr, r: rand(3, 11) * dpr, life: 1, k: rand(0.9, 1.6), t: 0 });
      if (Math.random() < 0.35) parts.push({ x: x + rand(-30, 30) * dpr, y: y + rand(-26, 26) * dpr, vx: 0, vy: -10 * dpr, r: rand(7, 14) * dpr, life: 1, k: 1.8, t: 1 });
      runFx();
    }
    function burst() {
      for (let i = 0; i < 34; i++) {
        const an = rand(0, TAU), sp = rand(80, 320) * dpr;
        parts.push({ x: W / 2, y: H / 2, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, r: rand(5, 15) * dpr, life: 1, k: rand(0.5, 1), t: i % 3 === 0 ? 1 : 0 });
      }
      runFx();
    }
    function runFx() {
      if (fxRunning) return; fxRunning = true; let prev = performance.now();
      (function loop(now) {
        const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
        fctx.clearRect(0, 0, W, H);
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]; p.life -= dt * p.k;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.99;
          fctx.globalAlpha = clamp(p.life);
          if (p.t === 1) { // destello de 4 puntas
            const s = p.r * (0.6 + p.life * 0.6); fctx.fillStyle = '#fff'; fctx.beginPath();
            fctx.moveTo(p.x, p.y - s); fctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y); fctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
            fctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y); fctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s); fctx.fill();
          } else {
            fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, TAU);
            fctx.fillStyle = 'rgba(255,255,255,.28)'; fctx.fill();
            fctx.lineWidth = 1.4 * dpr; fctx.strokeStyle = 'rgba(255,255,255,.95)'; fctx.stroke();
          }
        }
        fctx.globalAlpha = 1;
        if (parts.length) requestAnimationFrame(loop); else { fctx.clearRect(0, 0, W, H); fxRunning = false; }
      })(prev);
    }
    function finish() {
      if (done) return; done = true; touched = true;
      setPct(100); last = null;
      stage.classList.add('is-done'); stage.classList.remove('is-active');
      dirt.style.transition = 'opacity .9s'; dirt.style.opacity = '0';
      burst();
    }
    function reset() {
      if (auto) { cancelAnimationFrame(auto.raf); auto = null; }
      done = false; touched = false; last = null; parts = [];
      stage.classList.remove('is-done', 'is-touched', 'is-active');
      dirt.style.transition = 'none'; dirt.style.opacity = '1';
      fctx.clearRect(0, 0, W, H);
      paintDirt(); setPct(0);
    }
    function place(cx, cy) { wand.style.transform = 'translate3d(' + (cx - wand.offsetWidth / 2) + 'px,' + (cy - wand.offsetHeight / 2) + 'px,0) rotate(-16deg)'; }

    function onMove(e) {
      if (done || auto) return;
      const r = stage.getBoundingClientRect();
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      place(cx, cy);
      stage.classList.add('is-active', 'is-touched'); touched = true;
      stroke(cx * (W / r.width), cy * (H / r.height));
    }
    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerdown', onMove, { passive: true });
    stage.addEventListener('pointerleave', () => { last = null; stage.classList.remove('is-active'); const c = $('#cursor'); c && c.classList.remove('is-hidden'); });
    stage.addEventListener('pointerenter', () => { const c = $('#cursor'); c && c.classList.add('is-hidden'); });
    stage.addEventListener('pointerup', () => { last = null; });

    function runAuto() {
      if (done) reset(); else if (auto) return;
      stage.classList.add('is-active', 'is-touched'); touched = true; last = null;
      const rows = 5, pts = [];
      for (let r = 0; r < rows; r++) {
        const y = (0.12 + (r * 0.76) / (rows - 1)) * H, a = r % 2 === 0 ? 0.08 * W : 0.92 * W, b = r % 2 === 0 ? 0.92 * W : 0.08 * W;
        pts.push([a, y], [b, y]);
      }
      const segs = []; let total = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); total += d; }
      const t0 = performance.now(), dur = reduced ? 600 : 3400;
      auto = { raf: 0 };
      (function step(now) {
        const t = clamp((now - t0) / dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        let d = e * total, i = 0;
        while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
        const k = segs[i] ? clamp(d / segs[i]) : 1;
        const x = lerp(pts[i][0], pts[i + 1][0], k), y = lerp(pts[i][1], pts[i + 1][1], k);
        const sc = stage.getBoundingClientRect().width / W;
        place(x * sc, y * sc); stroke(x, y);
        if (t < 1) auto.raf = requestAnimationFrame(step);
        else { auto = null; measure(); if (!done) finish(); }
      })(t0);
    }
    $('#wipeAuto').addEventListener('click', runAuto);
    $('#wipeReset').addEventListener('click', reset);

    sizeCanvases(); setPct(0);
    new ResizeObserver(sizeCanvases).observe(stage);
  }

  /* ======================================================================
     12 · Tilt 3D, magnéticos, cursor, FAQ, formulario, menú
     ====================================================================== */
  function initTilt() {
    if (!fine) return;
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 9).toFixed(2) + 'deg');
        el.style.setProperty('--sx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--sy', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }
  function initMagnetic() {
    if (!fine) return;
    const els = $$('.magnetic');
    addEventListener('pointermove', (e) => {
      els.forEach((el) => {
        const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), reach = Math.max(r.width, 120) * 0.8;
        const inner = el.firstElementChild;
        if (d < reach) {
          el.style.translate = (dx * 0.22).toFixed(1) + 'px ' + (dy * 0.3).toFixed(1) + 'px';
          if (inner) inner.style.translate = (dx * 0.1).toFixed(1) + 'px ' + (dy * 0.14).toFixed(1) + 'px';
        } else { el.style.translate = ''; if (inner) inner.style.translate = ''; }
      });
    }, { passive: true });
  }
  const cursorState = { x: 0, y: 0, tx: 0, ty: 0, el: null };
  function initCursor() {
    const c = $('#cursor'); if (!c || !fine) return;
    cursorState.el = c;
    const label = $('span', c);
    addEventListener('pointermove', (e) => { cursorState.tx = e.clientX; cursorState.ty = e.clientY; pointer.x = e.clientX; pointer.y = e.clientY; pointer.has = true; }, { passive: true });
    document.addEventListener('mouseleave', () => { c.classList.add('is-hidden'); pointer.has = false; });
    document.addEventListener('mouseenter', () => c.classList.remove('is-hidden'));
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest ? e.target.closest('[data-cursor],a,button,input,textarea,label') : null;
      c.classList.toggle('is-text', !!(t && t.dataset && t.dataset.cursor));
      c.classList.toggle('is-link', !!t && !(t.dataset && t.dataset.cursor));
      if (t && t.dataset && t.dataset.cursor) label.textContent = t.dataset.cursor;
    });
  }
  function initFaq() {
    const items = $$('.qa');
    items.forEach((qa) => {
      const btn = $('.qa__q', qa);
      btn.addEventListener('click', () => {
        const open = !qa.classList.contains('is-open');
        items.forEach((o) => { o.classList.remove('is-open'); $('.qa__q', o).setAttribute('aria-expanded', 'false'); });
        if (open) { qa.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
    if (items[0]) { items[0].classList.add('is-open'); $('.qa__q', items[0]).setAttribute('aria-expanded', 'true'); }
  }
  function setMenu(open) {
    const menu = $('#menu'), burger = $('#burger');
    menuOpen = open; locked = open || !root.classList.contains('ready');
    menu.classList.toggle('is-open', open); menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    root.classList.toggle('is-locked', open);
  }
  function initMenu() {
    $('#burger').addEventListener('click', () => setMenu(!menuOpen));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  }
  function initForm() {
    const form = $('#leadForm'); if (!form) return;
    const name = $('#f-name'), field = name.closest('.field'), err = $('.field__err', field), status = $('#formStatus');
    name.addEventListener('input', () => { field.classList.remove('has-err'); err.textContent = ''; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = name.value.trim();
      if (!n) { field.classList.add('has-err'); err.textContent = 'Cuéntanos tu nombre para saludarte.'; name.focus(); return; }
      const tel = $('#f-tel').value.trim(), extra = $('#f-msg').value.trim();
      const servs = $$('input[name="servicio"]:checked', form).map((c) => c.value);
      let msg = 'Hola Marlon, soy ' + n + '. ';
      msg += servs.length ? 'Quiero cotizar el lavado de: ' + servs.join(', ') + '. ' : 'Quiero cotizar un lavado. ';
      if (extra) msg += extra + ' ';
      if (tel) msg += 'Mi número: ' + tel + '.';
      const url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg.trim());
      status.textContent = 'Abriendo WhatsApp con tu mensaje…';
      const w = window.open(url, '_blank');   // sin 'noopener' en el feature string: devolvería siempre null
      if (w) w.opener = null; else location.href = url;   // si el navegador bloquea la ventana, abre en la misma pestaña
    });
  }
  function waTip() {
    const wa = $('#waFloat'); if (!wa) return;
    const show = () => { wa.classList.add('show-tip'); setTimeout(() => wa.classList.remove('show-tip'), 6000); };
    show(); setInterval(show, 28000);
  }

  /* ======================================================================
     13 · BUCLE PRINCIPAL (un solo rAF para todo lo ligado al scroll)
     ====================================================================== */
  const dom = {};
  const cache = {};
  const setVar = (el, k, v) => { const key = k + (el.id || el.className); if (cache[key] !== v) { cache[key] = v; el.style.setProperty(k, v); } };
  const absTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  function measure() {
    vw = innerWidth; vh = innerHeight;
    setupSvc();
    M.man = dom.man ? { top: absTop(dom.man), h: dom.man.offsetHeight } : null;
    M.svc = svc.sec ? { top: absTop(svc.sec), h: svc.sec.offsetHeight, pin: svc.pin.offsetHeight } : null;
    M.proc = proc.sec ? { top: absTop(proc.sec), h: proc.sec.offsetHeight } : null;
    M.gal = $$('[data-parallax]');
    buildMarquee();
  }

  let lastT = performance.now(), lastY = -1, velS = 0, themeY = -1;
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016); lastT = now;
    if (smooth.on) smoothStep(dt);

    const y = window.scrollY, vel = lastY < 0 ? 0 : y - lastY; lastY = y;
    velS += (vel - velS) * 0.18;
    const maxS = maxScroll();

    // progreso global
    dom.bar.style.transform = 'scaleX(' + (maxS ? y / maxS : 0).toFixed(4) + ')';

    // header: ocultar al bajar, mostrar al subir; tema claro/oscuro según la sección debajo
    if (!menuOpen) {
      if (y > 700 && vel > 3 && now > noHideUntil) dom.header.classList.add('is-hidden');
      else if (vel < -3 || y < 700) dom.header.classList.remove('is-hidden');
    }
    let theme = 'dark';
    for (const el of dom.themed) { const r = el.getBoundingClientRect(); if (r.top <= 46 && r.bottom > 46) theme = el.dataset.theme; }
    dom.header.classList.toggle('on-light', theme === 'light' && !menuOpen);

    // hero
    const hp = clamp(y / vh);
    setVar(dom.hero, '--hp', hp.toFixed(3));
    dom.hero.classList.toggle('is-covered', hp >= 0.98);
    if (hp < 0.98) {
      heroState.mx = lerp(heroState.mx, heroState.tx, 0.07); heroState.my = lerp(heroState.my, heroState.ty, 0.07);
      const hv = dom.heroVisual;
      hv.style.setProperty('--mx', heroState.mx.toFixed(3)); hv.style.setProperty('--my', heroState.my.toFixed(3));
      dom.arch.style.setProperty('--ry', (heroState.mx * 8).toFixed(2) + 'deg');
      dom.arch.style.setProperty('--rx', (-heroState.my * 7).toFixed(2) + 'deg');
    }

    // burbujas
    bubbleSystems.forEach((b) => { if (b !== bubbleSystems[0] || hp < 1) b.frame(dt); });

    // cursor
    if (cursorState.el) {
      cursorState.x = lerp(cursorState.x, cursorState.tx, 0.22); cursorState.y = lerp(cursorState.y, cursorState.ty, 0.22);
      cursorState.el.style.transform = 'translate3d(' + cursorState.x.toFixed(1) + 'px,' + cursorState.y.toFixed(1) + 'px,0)';
    }

    // marquee
    const sv = clamp(Math.abs(velS), 0, 60);
    mrows.forEach((r) => {
      if (!r.vis || !r.W) return;
      const sp = (reduced ? 0 : 55) + sv * 28;
      r.x += r.dir * sp * dt;
      if (r.dir < 0) { if (r.x <= -r.W) r.x += r.W; } else if (r.x >= 0) r.x -= r.W;
      r.track.style.transform = 'translate3d(' + r.x.toFixed(1) + 'px,0,0)';
    });

    // manifiesto
    if (M.man && y > M.man.top - vh && y < M.man.top + M.man.h) {
      const p = clamp((y - M.man.top) / Math.max(1, M.man.h - vh));
      setVar(dom.man, '--mp', p.toFixed(3));
      if (!reduced) {
        const N = manWords.length, head = p * 1.06 * (N + 5);
        manWords.forEach((w, i) => w.style.setProperty('--o', (0.14 + 0.86 * clamp((head - i) / 5)).toFixed(2)));
      }
    }
    // el botón del manifiesto depende solo de la posición, así que no se queda oculto si el usuario salta de largo
    if (M.man && dom.manFoot) dom.manFoot.classList.toggle('in', y > M.man.top + 0.84 * Math.max(0, M.man.h - vh));

    // servicios (scroll horizontal)
    if (svc.sec && M.svc) {
      const inView = y > M.svc.top - vh && y < M.svc.top + M.svc.h;
      if (svc.active && inView) {
        const p = clamp((y - M.svc.top) / Math.max(1, M.svc.h - M.svc.pin));
        svc.track.style.transform = 'translate3d(' + (-p * svc.maxX).toFixed(1) + 'px,0,0)';
        svc.bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      }
      if (inView) svc.cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--ix', clamp(((r.left + r.width / 2 - vw / 2) / vw) * -46, -34, 34).toFixed(1) + 'px');
      });
    }

    // proceso (ruta)
    if (proc.sec && M.proc && desk.matches && !reduced) {
      if (y > M.proc.top - vh && y < M.proc.top + M.proc.h) {
        const p = clamp((y - M.proc.top) / Math.max(1, M.proc.h - vh));
        const f = clamp(p / 0.86);
        if (Math.abs(f - proc.last) > 0.0005) { proc.last = f; setRoute(f); }
      }
    } else if (proc.sec && (reduced || !desk.matches) && proc.last !== 1 && desk.matches) { proc.last = 1; setRoute(1); }

    // parallax de imágenes
    if (!reduced) M.gal.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      const f = parseFloat(img.dataset.parallax) || 0.1;
      const py = clamp(-(r.top + r.height / 2 - vh / 2) * f, -r.height * 0.08, r.height * 0.08);
      img.style.setProperty('--py', py.toFixed(1) + 'px');
    });

    // CTA grande: brillo que sigue al cursor
    if (pointer.has && dom.bigcta) {
      const r = dom.bigcta.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        dom.bigcta.style.setProperty('--mx', (pointer.x - r.left).toFixed(0) + 'px');
        dom.bigcta.style.setProperty('--my', (pointer.y - r.top).toFixed(0) + 'px');
      }
    }

    // palabra gigante del footer
    const fr = dom.footer.getBoundingClientRect();
    if (fr.top < vh) {
      const p = clamp((vh - fr.top) / Math.max(1, fr.height));
      dom.footWord.style.setProperty('--fy', ((1 - p) * 55).toFixed(1) + '%');
    }
  }

  /* ======================================================================
     14 · ARRANQUE
     ====================================================================== */
  function init() {
    dom.header = $('#header'); dom.bar = $('#progressBar'); dom.hero = $('#inicio');
    dom.heroVisual = $('.hero__visual'); dom.arch = $('#arch'); dom.man = $('#manifiesto');
    dom.manFoot = $('.manifesto__foot'); dom.bigcta = $('.bigcta'); dom.footer = $('.footer'); dom.footWord = $('#footWord');
    dom.themed = $$('[data-theme]');
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

    initSmooth(); initAnchors(); initLoader();
    initReveal(); initManifesto(); initSvc(); initProcess(); initMarquee();
    initHero(); initTilt(); initMagnetic(); initCursor(); initFaq(); initMenu(); initForm(); initWipe();

    if (!reduced) {
      const c1 = $('#bubbles'), c2 = $('#bubbles2');
      if (c1) new Bubbles(c1, { tint: [150, 220, 255], density: 30000, max: 34 });
      if (c2) new Bubbles(c2, { tint: [255, 255, 255], density: 30000, max: 34 });
    }

    measure();
    new ResizeObserver(() => { clearTimeout(init.t); init.t = setTimeout(measure, 120); }).observe(document.body);
    addEventListener('resize', () => { clearTimeout(init.t); init.t = setTimeout(measure, 120); });
    addEventListener('load', measure);
    if (document.fonts) document.fonts.ready.then(measure);
    desk.addEventListener('change', () => { proc.last = -1; measure(); });
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
