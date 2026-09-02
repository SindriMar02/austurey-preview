/* Austurey · the KUBE direct-booking machine, ported from Sky Retreat.
   Nav condense, full-screen menu with per-link image crossfade, the stays index
   (CMS-style clone into tag targets, uncheckable tags, self-pluralising count,
   deep-linkable #stays?tags=), hover-crossfade rows, one -4rem parallax, masked
   line reveals, the range calendar handing off to THEIR Godo checkout.
   Lenis DESKTOP ONLY; ignoreMobileResize; width-only resize guard. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  root.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var phone = window.matchMedia('(max-width: 860px)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var meta = document.getElementById('themeColor');

  /* ---------- ground writer ---------- */
  function setGround(g) {
    if (body.dataset.ground === g) return;
    body.dataset.ground = g;
    root.style.colorScheme = g === 'night' ? 'dark' : 'light';
    if (meta) meta.setAttribute('content', g === 'night' ? '#13191C' : '#F4F2EC');
  }

  /* ---------- lazy media from data-img / data-w / data-p ----------
     Below 860px a frame with a portrait ladder (data-p) serves its 9:16 centre crop,
     and any narrow desktop `sizes` is treated as most of the width (memory
     sizes-dpr3-candidate-cliff). */
  function wireLazy(scope) {
    var imgs = Array.prototype.slice.call((scope || document).querySelectorAll('img[data-img]'));
    imgs.forEach(function (img) {
      if (img.dataset.wired || !img.dataset.w) return;
      img.dataset.wired = '1';
      var usePortrait = phone && img.dataset.p;
      var name = img.dataset.img + (usePortrait ? '-p' : '');
      var ws = (usePortrait ? img.dataset.p : img.dataset.w).split(/\s+/).map(Number);
      var srcset = ws.map(function (w) { return 'assets/img/' + name + '@' + w + '.webp ' + w + 'w'; }).join(', ');
      if (phone) img.sizes = img.dataset.sm || (parseFloat(img.sizes) < 60 ? '80vw' : img.sizes || '100vw');
      img.decoding = 'async';
      if (!img.getAttribute('loading')) img.loading = 'lazy';
      img.srcset = srcset;
      img.src = 'assets/img/' + name + '@' + ws[Math.min(1, ws.length - 1)] + '.webp';
    });
  }
  wireLazy(document);

  /* ---------- the stays: one villa, eight cottages, from their own pages ---------- */
  var GODO_COTT = 'https://property.godo.is/booking2.php?propid=57635&referer=austurey.is';
  var GODO_VILLA = 'https://property.godo.is/booking2.php?propid=197629&referer=austurey.is';
  var STAYS = [
    { name: 'Austurey Lakefront Villa', img: 'villa-porch', villa: true,
      facts: '184 m² · four bedrooms · sleeps 8 · two bathrooms',
      tags: ['Sleeps 8', 'Sauna', 'Hot tub', 'Kayaks', 'EV charger'],
      alt: 'The villa’s terrace with the hot tub, the lake beyond', url: GODO_VILLA },
  ];
  var cottImgs = ['cott-glass', 'cott-cabin', 'cott-cabin-sheep', 'cott-terrace', 'cott-winter', 'hero-sheep', 'cott-corner', 'cott-bed'];
  var cottAlts = ['The glass front of a cottage', 'A cottage in the field at dusk', 'Sheep in front of a cottage', 'A cottage terrace with the grill', 'A cottage in the snow', 'A cottage with sheep grazing in front', 'A cottage corner and the lake', 'A cottage bedroom'];
  for (var i = 0; i < 8; i++) {
    STAYS.push({ name: 'Cottage ' + (i + 1), img: cottImgs[i], alt: cottAlts[i],
      facts: 'for two · 160 cm bed · kitchenette · heated veranda · lake view',
      tags: ['Sleeps 2', 'EV charger'], url: GODO_COTT });
  }
  var host = document.getElementById('stayList');
  if (host) {
    host.innerHTML = STAYS.map(function (s) {
      return '<article class="stay' + (s.villa ? ' stay--villa' : '') + '" data-tags="' + s.tags.join('|') + '">' +
        '<div class="stay_media"><img data-img="' + s.img + '" data-w="' + (s.villa ? '720 1440 2560' : '720 1440') + '" sizes="' + (s.villa ? '60vw' : '30vw') + '" alt="' + s.alt + '" loading="lazy"></div>' +
        '<div class="stay_type"><h3 class="stay_name">' + s.name + '</h3>' +
        '<p class="stay_facts">' + s.facts + '</p>' +
        '<div class="stay_tags">' + s.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>' +
        '<a class="stay_more" href="' + s.url + '" target="_blank" rel="noopener">Book direct</a></div></article>';
    }).join('') + '<p class="stays_empty" id="staysEmpty" hidden>No stay has all of those. Take one filter off.</p>';
    wireLazy(host);
  }

  /* tags: uncheckable radios, count that pluralises itself, deep link in the hash */
  (function tags() {
    var bar = document.getElementById('tags'); if (!bar) return;
    var buttons = Array.prototype.slice.call(bar.querySelectorAll('.tag'));
    var count = document.getElementById('staysCount');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.stay'));
    var empty = document.getElementById('staysEmpty');
    var active = [];
    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var have = c.dataset.tags.split('|');
        var ok = active.every(function (t) { return have.indexOf(t) > -1; });
        c.hidden = !ok; if (ok) shown++;
      });
      if (count) count.textContent = shown + (shown === 1 ? ' stay' : ' stays');
      if (empty) empty.hidden = shown > 0;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(active.indexOf(b.dataset.tag) > -1)); });
      var h = active.length ? '#stays?tags=' + active.map(encodeURIComponent).join(',') : (location.hash.indexOf('#stays') === 0 ? '#stays' : location.hash);
      if (location.hash !== h) history.replaceState(null, '', h || location.pathname);
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.dataset.tag, i = active.indexOf(t);
        if (i > -1) active.splice(i, 1); else active.push(t);
        apply();
      });
    });
    var m = location.hash.match(/tags=([^&]+)/);
    if (m) active = m[1].split(',').map(decodeURIComponent).filter(function (t) { return buttons.some(function (b) { return b.dataset.tag === t; }); });
    apply();
  })();

  /* ---------- masked line reveal ---------- */
  function splitLines(el) {
    if (el.dataset.split === 'done') return;
    var html = el.dataset.html || el.innerHTML.trim().replace(/\s+/g, ' ');
    el.dataset.html = html;
    /* keep <i> italics: tokenise on words but carry the italic flag */
    var tokens = [];
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    Array.prototype.slice.call(tmp.childNodes).forEach(function (n) {
      var italic = n.nodeType === 1 && n.tagName === 'I';
      var text = n.textContent;
      text.split(' ').forEach(function (w) { if (w) tokens.push({ w: w, i: italic }); });
    });
    el.textContent = '';
    var probes = tokens.map(function (t, k) {
      var s = document.createElement(t.i ? 'i' : 'span');
      s.textContent = t.w + (k < tokens.length - 1 ? ' ' : '');
      s.style.display = 'inline-block'; s.style.whiteSpace = 'pre';
      el.appendChild(s); return s;
    });
    var lines = [], last = null;
    probes.forEach(function (s, k) {
      var top = s.offsetTop;
      if (last === null || top > last + 2) { lines.push([]); last = top; }
      lines[lines.length - 1].push(tokens[k]);
    });
    el.textContent = '';
    lines.forEach(function (ws) {
      var mask = document.createElement('span'); mask.className = 'rl';
      var inner = document.createElement('i');
      inner.style.fontStyle = 'normal';
      ws.forEach(function (t, k) {
        var node = t.i ? document.createElement('i') : document.createTextNode('');
        if (t.i) { node.style.fontStyle = 'italic'; node.textContent = t.w + (k < ws.length - 1 ? ' ' : ''); inner.appendChild(node); }
        else inner.appendChild(document.createTextNode(t.w + (k < ws.length - 1 ? ' ' : '')));
      });
      mask.appendChild(inner); el.appendChild(mask);
    });
    el.dataset.split = 'done';
  }
  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  function buildReveals() { reveals.forEach(splitLines); }

  /* ---------- nav: condense + full-screen menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  var menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    body.classList.toggle('menu-open', open);
    body.classList.toggle('no-scroll', open);
    burger.setAttribute('aria-expanded', String(open));
    if (open) menu.removeAttribute('hidden');
    menu.querySelectorAll('.menu_links a').forEach(function (a, i) { a.style.transitionDelay = open ? (0.08 + i * 0.055) + 's' : '0s'; });
    if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!menuOpen); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    var mItems = menu.querySelectorAll('#menuList li');
    var mImgs = menu.querySelectorAll('.menu_img');
    mItems.forEach(function (li, i) {
      var pick = function () { mImgs.forEach(function (im, k) { im.classList.toggle('is-visible', k === i); }); };
      li.addEventListener('mouseenter', pick); li.addEventListener('focusin', pick);
    });
  }
  function syncScrolled() { body.classList.toggle('scrolled', window.scrollY > 12); }
  syncScrolled();
  window.addEventListener('scroll', syncScrolled, { passive: true });

  /* ---------- crossfades ---------- */
  function wireCrossfade(rowSel, imgSel, cls, defaultOnLeave) {
    var rows = document.querySelectorAll(rowSel);
    var imgs = document.querySelectorAll(imgSel);
    if (!rows.length || !imgs.length) return;
    function pick(i) { var j = Math.min(i, imgs.length - 1); imgs.forEach(function (im, k) { im.classList.toggle(cls, k === j); }); }
    rows.forEach(function (r, i) {
      var t = r.querySelector('button') || r;
      r.addEventListener('mouseenter', function () { pick(i); });
      t.addEventListener('click', function () { pick(i); });
      r.addEventListener('focusin', function () { pick(i); });
      if (defaultOnLeave) r.addEventListener('mouseleave', function () { pick(0); });
    });
  }
  wireCrossfade('#expRows li', '.exp_img', 'is-visible', false);
  wireCrossfade('#farmRows .farm_row', '.farm_img', 'is-active', true);

  /* the sticky mobile bar hides while the hero is on screen and at the form */
  (function () {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    new IntersectionObserver(function (es) { es.forEach(function (e) { body.classList.toggle('at-hero', e.isIntersecting); }); }, { rootMargin: '-45% 0px 0px 0px' }).observe(hero);
    var boka = document.getElementById('boka');
    if (boka) new IntersectionObserver(function (es) { es.forEach(function (e) { body.classList.toggle('at-book', e.isIntersecting); }); }, { rootMargin: '0px 0px -25% 0px' }).observe(boka);
  })();

  /* ---------- ground flip ---------- */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) setGround(e.target.dataset.ground || 'day'); }); }, { rootMargin: '-12% 0% -62% 0%' });
  document.querySelectorAll('[data-ground]').forEach(function (s) { if (s !== body && s.dataset.ground) io.observe(s); });
  document.querySelectorAll('section:not([data-ground])').forEach(function (s) { s.dataset.groundDefault = 'day'; io.observe(s); });

  /* ---------- range calendar → their Godo checkout ---------- */
  (function calendar() {
    var grid = document.getElementById('calGrid'); if (!grid) return;
    var monthEl = document.getElementById('calMonth');
    document.getElementById('calDow').innerHTML = ['Mo','Tu','We','Th','Fr','Sa','Su'].map(function (d) { return '<div>' + d + '</div>'; }).join('');
    var outS = document.getElementById('outStart'), outE = document.getElementById('outEnd');
    var outSum = document.getElementById('outSum'), go = document.getElementById('bkGo');
    var prev = document.getElementById('calPrev'), next = document.getElementById('calNext');
    var which = Array.prototype.slice.call(document.querySelectorAll('.bk_w'));
    var MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if ((monthEnd - today) / 86400000 < 7) view.setMonth(view.getMonth() + 1);
    var start = null, end = null, prop = '57635', propName = 'a cottage';
    function fmt(d) { return d ? MON[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + ', ' + d.getFullYear() : null; }
    function paint() {
      var old = monthEl.querySelector('span');
      if (old) { old.classList.add('is-out'); setTimeout(function () { old.remove(); }, 200); }
      var sp = document.createElement('span'); sp.textContent = MON[view.getMonth()] + ' ' + view.getFullYear(); monthEl.appendChild(sp);
      prev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
      var lead = (new Date(view).getDay() + 6) % 7;
      var cur = new Date(view); cur.setDate(1 - lead);
      var out = [];
      for (var i = 0; i < 42; i++) {
        var d = new Date(cur); var cls = ['bk_day'];
        if (start && end && d > start && d < end) cls.push('in-range');
        if (start && +d === +start) cls.push(end ? 'is-start' : 'is-start is-only');
        if (end && +d === +end) cls.push('is-end');
        out.push('<button type="button" class="' + cls.join(' ') + '"' + (d.getMonth() !== view.getMonth() ? ' data-out' : '') + (d < today ? ' disabled' : '') + (+d === +today ? ' data-today' : '') + ' data-d="' + d.toISOString().slice(0, 10) + '">' + d.getDate() + '</button>');
        cur.setDate(cur.getDate() + 1);
      }
      grid.innerHTML = out.join('');
    }
    function sync() {
      outS.textContent = fmt(start) || 'Select a date';
      outE.textContent = fmt(end) || 'Select a date';
      if (!start) outSum.textContent = 'Choose your arrival night to begin.';
      else if (!end) outSum.textContent = 'Arriving ' + fmt(start) + '. Now choose your departure.';
      else { var n = Math.round((end - start) / 86400000); outSum.textContent = n + (n === 1 ? ' night' : ' nights') + ' in ' + propName + ', ' + fmt(start) + ' to ' + fmt(end) + '. Availability is confirmed in the farm’s own checkout.'; }
      go.setAttribute('aria-disabled', String(!(start && end)));
      go.href = (prop === '57635' ? GODO_COTT : GODO_VILLA);
    }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.bk_day'); if (!b || b.disabled) return;
      var d = new Date(b.dataset.d + 'T00:00:00');
      if (!start || (start && end)) { start = d; end = null; }
      else if (d < start) { start = d; }
      else if (+d === +start) { start = null; end = null; }
      else { end = d; }
      paint(); sync();
    });
    which.forEach(function (w) { w.addEventListener('click', function () { which.forEach(function (x) { x.classList.toggle('is-on', x === w); }); prop = w.dataset.prop; propName = w.dataset.name; sync(); }); });
    prev.addEventListener('click', function () { view.setMonth(view.getMonth() - 1); paint(); });
    next.addEventListener('click', function () { view.setMonth(view.getMonth() + 1); paint(); });
    paint(); sync();
  })();

  /* ---------- scrubbed word wave (rest .55, windows overlap) ---------- */
  var scrubWords = [];
  function buildScrubWords() {
    document.querySelectorAll('[data-scrub-words]').forEach(function (el) {
      if (el.dataset.swDone) return;
      var frag = document.createDocumentFragment();
      function wordSpan(t) { var sp = document.createElement('span'); sp.className = 'sw'; sp.textContent = t; return sp; }
      [].slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var parts = node.textContent.replace(/\s+/g, ' ').split(' ');
          parts.forEach(function (w, i) { if (!w) return; frag.appendChild(wordSpan(w + (i < parts.length - 1 ? ' ' : ''))); });
        } else { var sp = wordSpan(''); sp.appendChild(node.cloneNode(true)); frag.appendChild(sp); }
      });
      el.textContent = ''; el.appendChild(frag); el.dataset.swDone = '1'; scrubWords.push(el);
    });
  }
  function wordOpacity(p, s, e) { if (p <= s) return 0.55; if (p >= e) return 1; return 0.55 + 0.45 * ((p - s) / (e - s)); }

  function showAllText() {
    buildScrubWords();
    document.querySelectorAll('.sw').forEach(function (w) { w.style.opacity = 1; });
    document.querySelectorAll('.rl').forEach(function (l) { l.classList.add('in'); });
    var f = document.getElementById('footWm'); if (f) f.classList.add('in');
  }
  if (!hasGSAP || reduced) { buildReveals(); showAllText(); return; }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (!isTouch) {
    var lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    window.__lenis = lenis;
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function armReveals() {
    buildReveals();
    reveals.forEach(function (el) {
      var lines = el.querySelectorAll('.rl'); if (!lines.length) return;
      if (el.getBoundingClientRect().top <= window.innerHeight * 0.92) { lines.forEach(function (l) { l.classList.add('in'); }); return; }
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true,
        onEnter: function () { lines.forEach(function (l, i) { l.style.transitionDelay = (i * 0.08) + 's'; l.classList.add('in'); }); },
        onRefresh: function (self) { if (self.progress > 0) lines.forEach(function (l) { l.classList.add('in'); }); } });
    });
    ScrollTrigger.refresh();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(armReveals); else armReveals();

  buildScrubWords();
  scrubWords.forEach(function (el) {
    var ws = el.querySelectorAll('.sw'); var n = ws.length, last = new Array(n);
    ScrollTrigger.create({ trigger: el, start: 'top 85%', end: 'bottom 55%', scrub: .5,
      onUpdate: function (self) { var p = self.progress; for (var i = 0; i < n; i++) { var s = n <= 1 ? 0 : (i / (n - 1)) * 0.8; var v = wordOpacity(p, s, Math.min(1, s + 0.2)).toFixed(3); if (last[i] !== v) { last[i] = v; ws[i].style.opacity = v; } } } });
  });

  /* KUBE's one parallax: every marked image drifts -4rem, ≥768px only */
  ScrollTrigger.matchMedia({
    '(min-width: 768px)': function () {
      document.querySelectorAll('[data-img-wrap]').forEach(function (wrap) {
        var img = wrap.querySelector('img'); if (!img) return;
        gsap.fromTo(img, { y: '0rem' }, { y: '-4rem', ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 70%', end: 'bottom 30%', scrub: true } });
      });
      /* the hero photograph drifts under the card as the card scrolls away */
      var hp = document.querySelector('.hero_img');
      if (hp) gsap.fromTo(hp, { y: '-2rem' }, { y: '3rem', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    },
    '(max-width: 767px)': function () { gsap.set('[data-img-wrap] img', { y: 0 }); }
  });

  /* block reveals */
  document.querySelectorAll('.rev').forEach(function (el) {
    if (el.getBoundingClientRect().top <= window.innerHeight * 0.9) return;
    el.setAttribute('data-armed', '');
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { el.classList.add('in'); }, onRefresh: function (self) { if (self.progress > 0) el.classList.add('in'); } });
  });

  /* the footer statement */
  (function footer() {
    var wm = document.getElementById('footWm'); var stage = document.getElementById('footStage'); if (!wm || !stage) return;
    ScrollTrigger.create({ trigger: wm, start: 'top 92%', once: true, onEnter: function () { wm.classList.add('in'); }, onRefresh: function (self) { if (self.progress > 0) wm.classList.add('in'); } });
    if (!isTouch) {
      var words = wm.querySelectorAll('.foot_wm_word');
      gsap.fromTo(words[0], { xPercent: 5 }, { xPercent: -2, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom bottom', scrub: .6 } });
      gsap.fromTo(words[1], { xPercent: -5 }, { xPercent: 2, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom bottom', scrub: .6 } });
    }
  })();

  /* width-only resize guard */
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (isTouch && window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    reveals.forEach(function (el) { el.dataset.split = ''; });
    armReveals();
  });
})();
