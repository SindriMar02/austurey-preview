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

  /* ---------- the arrival curtain ----------
     Runs once per session and never under prefers-reduced-motion. The bar is
     honest about the two things worth waiting for, fonts and the hero image,
     and it holds a beat so the wordmark is actually read rather than flashed.
     A hard cap means a slow connection still gets in. */
  (function arrival() {
    var el = document.getElementById('arrival');
    if (!el) return;
    var fill = document.getElementById('arrivalFill');
    var seen = false;
    try { seen = sessionStorage.getItem('austurey_arrived') === '1'; } catch (e) { /* private mode */ }
    if (seen || reduced) {
      el.remove();
      var p0 = document.querySelector('.plate');
      if (p0) p0.classList.add('is-lit');
      return;
    }

    root.classList.add('arrival-on');
    var MIN_HOLD = 900, CAP = 4200, t0 = Date.now(), done = false;

    function lift() {
      if (done) return; done = true;
      try { sessionStorage.setItem('austurey_arrived', '1'); } catch (e) { /* private mode */ }
      fill.style.transform = 'scaleX(1)';
      var wait = Math.max(0, MIN_HOLD - (Date.now() - t0));
      setTimeout(function () {
        el.classList.add('is-up');
        root.classList.remove('arrival-on');
        var plate = document.querySelector('.plate');
        if (plate) plate.classList.add('is-lit');
        /* the element keeps painting through the lift, then stops existing */
        setTimeout(function () { el.remove(); }, 1000);
      }, wait);
    }

    /* progress: fonts, then the hero image, then whatever is left */
    var steps = 0;
    function step() { steps = Math.min(steps + 1, 3); fill.style.transform = 'scaleX(' + (steps / 3) + ')'; }
    setTimeout(step, 120);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(step); else setTimeout(step, 400);
    var hero = document.querySelector('.plate_img');
    if (hero && hero.complete) step();
    else if (hero) hero.addEventListener('load', step, { once: true });
    else step();

    window.addEventListener('load', lift);
    setTimeout(lift, CAP);
  })();

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

  /* ---------- the stays: the plate picker ----------
     Nine near-identical cards down a page is a catalogue, not a choice. The
     eight cottages differ only in the photograph, so the list carries the
     names and one stage carries the picture: move through the names and the
     picture wipes. Behaviour taken from 21st.dev "Slideshow" (25998), which
     does exactly this with staggered text indicators and a clip-path reveal;
     the code there is React, this build is vanilla, so only the mechanism
     crosses over. Selection is explicit and sticky, because unlike that
     component this one has to end in a booking. */
  var GODO_COTT = 'https://property.godo.is/booking2.php?propid=57635&referer=austurey.is';
  var GODO_VILLA = 'https://property.godo.is/booking2.php?propid=197629&referer=austurey.is';
  var STAYS = [
    { name: 'Lakefront Villa', img: 'villa-porch', w: '720 1440 2560', villa: true,
      facts: '184 m² · four bedrooms · sleeps eight · two bathrooms · sauna, hot tub and the kayaks',
      alt: 'The villa terrace with the hot tub, the lake beyond', url: GODO_VILLA },
  ];
  var cottImgs = ['cott-glass', 'cott-cabin', 'cott-cabin-sheep', 'cott-terrace', 'cott-winter', 'hero-sheep', 'cott-corner', 'cott-bed'];
  /* the ladder each file actually has on disk, not an assumed one */
  var cottW = ['720 1440 2560', '720 1440 2560', '720 1440 2560', '720 1440', '720 1440 2560', '720 1440', '720 1440', '720 1440'];
  var cottP = ['', '720 1080', '720 1080', '', '', '', '720', ''];
  var cottAlts = ['The glass front of a cottage', 'A cottage in the field at dusk', 'Sheep in front of a cottage', 'A cottage terrace with the grill', 'A cottage in the snow', 'A cottage with sheep grazing in front', 'A cottage corner and the lake', 'A cottage bedroom'];
  for (var ci = 0; ci < 8; ci++) {
    STAYS.push({ name: 'Cottage ' + (ci + 1), img: cottImgs[ci], alt: cottAlts[ci], w: cottW[ci], p: cottP[ci],
      facts: 'for two · 160 cm bed · kitchenette · heated veranda · the lake in front', url: GODO_COTT });
  }

  (function picker() {
    var stage = document.getElementById('pickStage');
    var list = document.getElementById('pickList');
    if (!stage || !list) return;

    stage.innerHTML = STAYS.map(function (s, i) {
      return '<figure class="pick_shot' + (i === 0 ? ' is-on' : '') + '" data-i="' + i + '">' +
        '<img data-img="' + s.img + '" data-w="' + s.w + '"' + (s.p ? ' data-p="' + s.p + '"' : '') + ' sizes="(max-width: 900px) 100vw, 56vw" alt="' + s.alt + '" loading="lazy">' +
        '</figure>';
    }).join('');

    list.innerHTML = STAYS.map(function (s, i) {
      return '<li class="pick_row' + (s.villa ? ' is-villa' : '') + (i === 0 ? ' is-on' : '') + '">' +
        '<button type="button" data-i="' + i + '" aria-pressed="' + (i === 0) + '">' +
          '<span class="pick_no">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="pick_name">' + s.name + '</span>' +
          '<span class="pick_line" aria-hidden="true"></span>' +
        '</button></li>';
    }).join('');

    var shots = [].slice.call(stage.querySelectorAll('.pick_shot'));
    var rows = [].slice.call(list.querySelectorAll('.pick_row'));
    var btns = [].slice.call(list.querySelectorAll('button'));
    var factsEl = document.getElementById('pickFacts');
    var goEl = document.getElementById('pickGo');
    var current = 0, locked = 0;

    function show(i) {
      if (i === current) return;
      current = i;
      shots.forEach(function (f, j) { f.classList.toggle('is-on', j === i); });
      rows.forEach(function (r, j) { r.classList.toggle('is-hot', j === i); });
      if (factsEl) factsEl.textContent = STAYS[i].facts;
    }
    function lock(i) {
      locked = i;
      btns.forEach(function (b, j) { b.setAttribute('aria-pressed', String(j === i)); });
      rows.forEach(function (r, j) { r.classList.toggle('is-on', j === i); });
      if (goEl) { goEl.href = STAYS[i].url; goEl.textContent = 'Book ' + STAYS[i].name.toLowerCase(); }
      show(i);
    }
    btns.forEach(function (b, i) {
      /* pointerenter, not mouseover: a touch device must not preview on the
         way to a tap, it should only ever commit on the tap itself */
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(i); });
      b.addEventListener('focus', function () { show(i); });
      b.addEventListener('click', function () { lock(i); });
    });
    list.addEventListener('pointerleave', function () { show(locked); });
    lock(0);
    wireLazy(stage);
  })();

  /* the picker rows write in once, and the painted ground drifts behind them */
  (function pickMotion() {
    var sec = document.querySelector('.pick');
    if (!sec) return;
    new IntersectionObserver(function (es, o) {
      es.forEach(function (e) { if (e.isIntersecting) { sec.classList.add('is-in'); o.disconnect(); } });
    }, { rootMargin: '0px 0px -18% 0px' }).observe(sec);
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
    /* The links now wait for the ink column to arrive before they write
       themselves in, and 70ms apart rather than 55 so the cascade is legible. */
    menu.querySelectorAll('.menu_links a').forEach(function (a, i) { a.style.transitionDelay = open ? (0.22 + i * 0.07) + 's' : '0s'; });
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
    var hero = document.querySelector('.plate');
    if (!hero) return;
    new IntersectionObserver(function (es) { es.forEach(function (e) {
      body.classList.toggle('at-hero', e.isIntersecting);
      /* The status strip is tinted from html's background-color, not from the
         4px .tintplate: a plate that thin does not win the sampling. Over the
         dark hero the strip therefore stayed cream and read as a pale bar
         above the photograph, so the page root follows the hero too. */
      document.documentElement.classList.toggle('at-hero', e.isIntersecting);
      /* At scroll 0 nothing has scrolled into the status strip yet, so iOS
         tints it from the theme-color meta rather than from html's background:
         colouring html was not enough and the strip stayed cream above the
         dark hero. */
      var tc = document.querySelector('meta[name="theme-color"]');
      if (tc) tc.setAttribute('content', e.isIntersecting ? '#13191C' : '#F4F2EC');
    }); }, { rootMargin: '-45% 0px 0px 0px' }).observe(hero);
    var boka = document.getElementById('boka');
    if (boka) new IntersectionObserver(function (es) { es.forEach(function (e) { body.classList.toggle('at-book', e.isIntersecting); }); }, { rootMargin: '0px 0px -25% 0px' }).observe(boka);
  })();

  /* ---------- ground flip ---------- */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) setGround(e.target.dataset.ground || 'day'); }); }, { rootMargin: '-12% 0% -62% 0%' });
  document.querySelectorAll('[data-ground]').forEach(function (s) { if (s !== body && s.dataset.ground) io.observe(s); });
  document.querySelectorAll('section:not([data-ground])').forEach(function (s) { s.dataset.groundDefault = 'day'; io.observe(s); });

  /* ---------- the stay picker → their Godo checkout ---------- */
  /* Was a bespoke calendar: it paged months and drew a range, but it enforced
     no minimum stay, showed no preview of the range being drawn, had no party
     control, and the Continue link carried none of the chosen dates into Godo.
     It now runs the same picker the other builds carry, and the dates travel. */
  (function calendar() {
    var mount = document.getElementById('bkCal');
    if (!mount || !window.createStayPicker) return;
    var outSum = document.getElementById('outSum'), go = document.getElementById('bkGo');
    var which = Array.prototype.slice.call(document.querySelectorAll('.bk_w'));
    var gEl = document.getElementById('bkG'), gMax = document.getElementById('bkGmax');
    var prop = '57635', propName = 'a cottage', guests = 2;
    var L = {
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      weekdays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      checkIn: 'Arrival', checkOut: 'Departure', pickDate: 'Pick a date', afterCheckIn: 'After arrival',
      night: 'night', nights: 'nights', prevMonth: 'Previous month', nextMonth: 'Next month',
      empty: 'Pick an arrival, then a departure. Two nights is the shortest stay.',
      minStay: function (d) { return 'Two nights is the shortest stay, so the earliest departure is ' + d + '.'; },
      chosen: function (a, b) { return a + ' to ' + b + '.'; },
    };
    var picker = window.createStayPicker({ mount: mount, prefix: 'au-stay', minStay: 2, L: L, onChange: sync });

    function sleeps() { var on = which.filter(function (w) { return w.classList.contains('is-on'); })[0]; return parseInt(on.dataset.sleeps, 10) || 2; }
    function syncGuests() {
      guests = Math.min(guests, sleeps());
      gEl.textContent = guests; gMax.textContent = sleeps();
      document.querySelector('[data-g="-1"]').disabled = guests <= 1;
      document.querySelector('[data-g="1"]').disabled = guests >= sleeps();
    }
    function sync() {
      var r = picker.get();
      if (!r.start) outSum.textContent = 'Choose your arrival night to begin.';
      else if (!r.end) outSum.textContent = 'Arriving ' + picker.fmtLong(r.start) + '. Now choose your departure.';
      else outSum.textContent = r.nights + (r.nights === 1 ? ' night' : ' nights') + ' in ' + propName + ', for ' + guests + (guests === 1 ? ' guest' : ' guests') + '. Availability and the exact rate are confirmed in the farm\u2019s own checkout.';
      go.setAttribute('aria-disabled', String(!(r.start && r.end)));
      go.textContent = r.nights > 0
        ? 'Continue with these ' + r.nights + (r.nights === 1 ? ' night' : ' nights')
        : "Continue to Austurey's checkout";
      /* The dates leave with the guest. Godo ignores parameters it does not
         know, so this can only help, and the summary still says plainly that
         availability is confirmed on their side. */
      var base = 'https://property.godo.is/booking2.php?propid=' + prop + '&referer=austurey.is';
      go.href = (r.start && r.end)
        ? base + '&checkin=' + picker.key(r.start) + '&checkout=' + picker.key(r.end) + '&adults=' + guests
        : base;
    }
    which.forEach(function (w) {
      w.addEventListener('click', function () {
        which.forEach(function (x) { x.classList.toggle('is-on', x === w); });
        prop = w.dataset.prop; propName = w.dataset.name; syncGuests(); sync();
      });
    });
    document.querySelectorAll('[data-g]').forEach(function (b) {
      b.addEventListener('click', function () { guests += parseInt(b.dataset.g, 10); syncGuests(); sync(); });
    });
    syncGuests(); sync();
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
          var txt = node.textContent.replace(/\s+/g, ' ');
          /* A text node that FOLLOWS an element begins with the space that
             separated them ("</strong> from"). split(' ') turns that into an
             empty first part, and skipping it welded the two together on the
             page as "Booking.comfrom". Put the space back as its own node: it
             cannot go on the previous span, because that span holds the
             <strong> and setting textContent on it would flatten the markup. */
          if (txt.charAt(0) === ' ' && frag.lastChild) frag.appendChild(document.createTextNode(' '));
          var parts = txt.split(' ');
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
      /* the painted ground behind the picker drifts against the list */
      var pw = document.querySelector('.pick_wash img');
      if (pw) gsap.fromTo(pw, { y: '-3rem', scale: 1.06 }, { y: '3rem', scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: '.pick', start: 'top bottom', end: 'bottom top', scrub: true } });

      /* the painting drifts as the plate scrolls away, slower than the page */
      var hp = document.querySelector('.plate_img');
      if (hp) gsap.fromTo(hp, { y: '-2.5rem' }, { y: '4rem', ease: 'none', scrollTrigger: { trigger: '.plate', start: 'top top', end: 'bottom top', scrub: true } });
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
