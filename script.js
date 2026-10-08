/* evanexanes.com — Pass 2 (2026-09-29)
   The mobile drawer: at 1024 px and below the hamburger opens a modal side panel with the
   same three links, Schedule a call, Download CV and the theme switch. Focus moves in and is
   trapped; Esc, the close button and the shade close it and return focus to the hamburger. */
(function () {
  'use strict';

  var toggle = document.getElementById('nav-toggle');
  var drawer = document.getElementById('site-drawer');
  var shade = document.getElementById('drawer-shade');
  if (!toggle || !drawer || !shade) { return; }
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hideTimer = null;

  function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }

  function focusables() {
    var all = drawer.querySelectorAll('a[href], button:not([disabled])');
    var out = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].getClientRects().length) { out.push(all[i]); }
    }
    return out;
  }

  function open() {
    clearTimeout(hideTimer);
    drawer.hidden = false;
    shade.hidden = false;
    root.classList.add('drawer-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    void drawer.offsetWidth;   /* commit the shown frame so the slide-in runs */
    drawer.classList.add('is-open');
    shade.classList.add('is-open');
    var start = drawer.querySelector('.drawer-nav a');   /* the first page link, not the wordmark */
    var f = focusables();
    if (start) { start.focus(); } else if (f.length) { f[0].focus(); }
  }

  function close(returnFocus) {
    if (!isOpen()) { return; }
    drawer.classList.remove('is-open');
    shade.classList.remove('is-open');
    root.classList.remove('drawer-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    hideTimer = setTimeout(function () { drawer.hidden = true; shade.hidden = true; },
                           reduce.matches ? 0 : 260);
    if (returnFocus) { toggle.focus(); }
  }

  toggle.addEventListener('click', function () {
    if (isOpen()) { close(true); } else { open(); }
  });
  shade.addEventListener('click', function () { close(true); });
  drawer.addEventListener('click', function (e) {
    if (e.target.closest('[data-drawer-close]')) { close(true); return; }
    /* A link (a page, the CV, or Schedule a call, whose pop-up must not sit behind the panel).
       The link is about to be hidden and a hidden element cannot keep focus, so focus goes back to
       the hamburger, except for an in-page anchor (#work): there the browser moves focus to the
       target, and pulling it back to the hamburger would fight that. */
    var link = e.target.closest('a[href]');
    if (link) { close(link.getAttribute('href').indexOf('#') < 0); }
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen()) { return; }
    if (e.key === 'Escape') { e.preventDefault(); close(true); return; }   /* the quick-answer panel then leaves this Esc alone */
    if (e.key !== 'Tab') { return; }
    var f = focusables();
    if (!f.length) { return; }
    var first = f[0], last = f[f.length - 1];
    if (!drawer.contains(document.activeElement)) {   /* focus escaped (for example to <body>): pull it back in */
      e.preventDefault(); (e.shiftKey ? last : first).focus(); return;
    }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* Returning to desktop width closes the drawer. */
  var wide = window.matchMedia('(min-width: 1025px)');
  var onChange = function (e) { if (e.matches) { close(false); } };
  if (wide.addEventListener) { wide.addEventListener('change', onChange); }
  else if (wide.addListener) { wide.addListener(onChange); }
})();

/* Theme switch (final prototype, 2026-09-28). The starting theme is already
   on <html> — set by the inline script in <head> before first paint. This
   only flips it, remembers the choice, and keeps aria-pressed in step. */
(function () {
  'use strict';

  var root = document.documentElement;
  var btns = document.querySelectorAll('[data-theme-toggle]');
  if (!btns.length) { return; }

  function sync() {
    var dark = String(root.getAttribute('data-theme') === 'dark');
    for (var i = 0; i < btns.length; i++) { btns[i].setAttribute('aria-pressed', dark); }
  }

  function flip() {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  }

  for (var i = 0; i < btns.length; i++) { btns[i].addEventListener('click', flip); }
  sync();
})();

/* Floating header (2026-09-29). A 24 px sentinel sits at the very top of the
   page; once it has scrolled out of view the header takes its gradient state.
   An IntersectionObserver rather than a scroll listener: no work per frame. */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  if (!header || !('IntersectionObserver' in window)) { return; }

  var sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;';
  document.body.insertBefore(sentinel, document.body.firstChild);

  new IntersectionObserver(function (entries) {
    header.classList.toggle('is-scrolled', !entries[entries.length - 1].isIntersecting);
  }).observe(sentinel);
})();

/* FAQ: one answer open at a time. name="faq" makes the browser do this
   natively; this covers browsers that ignore the attribute and is a no-op
   where they don't. */
(function () {
  'use strict';

  var items = document.querySelectorAll('details[name="faq"]');
  function closeOthers() {
    if (!this.open) { return; }
    for (var j = 0; j < items.length; j++) {
      if (items[j] !== this && items[j].open) { items[j].open = false; }
    }
  }
  for (var i = 0; i < items.length; i++) {
    items[i].addEventListener('toggle', closeOthers);
  }
})();

/* Cookie and embed consent (2026-09-29). Nothing third-party loads until the visitor says yes:
   the Google Map on Contact (a gate that mounts the iframe) and Cal.com's pop-up script. The
   choice is one localStorage note, 'site-consent' = 'accepted' | 'declined'. Without scripts the
   map stays a link and Schedule a call opens Cal.com in a new tab. */
(function () {
  'use strict';

  var KEY = 'site-consent';
  var root = document.documentElement;
  var banner = null;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  window.siteConsent = { allowed: function () { return read() === 'accepted'; } };

  function mount(fig) {
    if (fig.querySelector('iframe')) { return; }
    var f = document.createElement('iframe');
    f.src = fig.getAttribute('data-map-src');
    f.title = fig.getAttribute('data-map-title') || 'Map';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    var gate = fig.querySelector('.map-gate');
    if (gate) { gate.hidden = true; }
    fig.insertBefore(f, fig.firstChild);
  }
  function unmount(fig) {
    var f = fig.querySelector('iframe');
    if (f) { fig.removeChild(f); }
    var gate = fig.querySelector('.map-gate');
    if (gate) { gate.hidden = false; }
  }
  function eachMap(fn) {
    var figs = document.querySelectorAll('[data-map-src]');
    for (var i = 0; i < figs.length; i++) { fn(figs[i]); }
  }

  function hide() {
    if (!banner) { return; }
    banner.parentNode.removeChild(banner);
    banner = null;
    root.classList.remove('consent-open');
    root.style.removeProperty('--consent-h');
  }

  function choose(v) {
    var was = read();
    write(v);
    hide();
    if (v === 'accepted') { eachMap(mount); return; }
    eachMap(unmount);
    /* Cal.com's script cannot be unloaded; a page that already has it starts over without it. */
    if (was === 'accepted' && window.Cal && window.Cal.loaded) { location.reload(); }
  }

  function show(focus) {
    if (banner) { return; }
    banner = document.createElement('section');
    banner.className = 'consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookies and embedded content');
    banner.tabIndex = -1;
    banner.innerHTML =
      '<p class="consent-title">Cookies and embedded content</p>' +
      '<p class="consent-text">This site keeps two small notes on your device: your light or dark theme, if you switch it, ' +
      'and this choice. If you allow embeds, the Google Map on Contact and the Cal.com booking pop-up load too, and Google ' +
      'and Cal.com may set their own cookies. If you decline, the map stays off and Schedule a call opens Cal.com in a new tab.</p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="btn btn-secondary" data-consent="accepted">Allow embeds</button>' +
      '<button type="button" class="btn btn-secondary" data-consent="declined">Decline</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-consent]');
      if (b) { choose(b.getAttribute('data-consent')); }
    });
    document.body.insertBefore(banner, document.body.firstChild);
    root.classList.add('consent-open');
    root.style.setProperty('--consent-h', (banner.offsetHeight + 24) + 'px');
    if (focus) { banner.focus(); }
  }

  window.addEventListener('resize', function () {
    if (banner) { root.style.setProperty('--consent-h', (banner.offsetHeight + 24) + 'px'); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && banner && read() !== null) { hide(); }
  });

  var reopen = document.querySelectorAll('[data-consent-open]');
  for (var i = 0; i < reopen.length; i++) {
    reopen[i].hidden = false;
    reopen[i].addEventListener('click', function () { show(true); });
  }
  var loaders = document.querySelectorAll('[data-map-load]');
  for (var k = 0; k < loaders.length; k++) {
    loaders[k].hidden = false;
    loaders[k].addEventListener('click', function (e) { mount(e.target.closest('[data-map-src]')); });
  }

  var saved = read();
  if (saved === 'accepted') { eachMap(mount); }
  if (saved === null) { show(false); }
})();

/* Schedule a call (Cal.com pop-up). Every [data-cal-link] is a real link to the
   booking page, so it still works with scripts blocked. Cal's embed script is
   fetched on the first sign of intent (pointer over, focus, touch) on one of
   those links, not on page load, and only once embeds are allowed; it then turns the click into a pop-up. Cal's
   embed never calls preventDefault, so once it has really loaded (its
   cal-modal-box element is defined) one capture listener cancels the plain
   click, leaving the pop-up only; a blocked embed leaves the link to open. */
(function () {
  'use strict';

  if (!document.querySelector('[data-cal-link]')) { return; }
  var loaded = false;

  function load() {
    if (loaded) { return; }
    loaded = true;
    /* Cal.com's official embed bootstrap, unminified to ES5. */
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal; var ar = arguments;
        if (!cal.loaded) {
          cal.ns = {}; cal.q = cal.q || [];
          d.head.appendChild(d.createElement('script')).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          var namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ['initNamespace', namespace]);
          } else { p(cal, ar); }
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');
    window.Cal('init', '30min', { origin: 'https://cal.com' });
    window.Cal.ns['30min']('ui', { hideEventTypeDetails: false, layout: 'month_view' });
  }

  function onIntent(e) {
    if (!(window.siteConsent && window.siteConsent.allowed())) { return; }
    if (e.target && e.target.closest && e.target.closest('[data-cal-link]')) { load(); }
  }
  document.addEventListener('click', function (e) {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) { return; }
    if (!(window.customElements && customElements.get('cal-modal-box'))) { return; }
    if (e.target && e.target.closest && e.target.closest('[data-cal-link]')) { e.preventDefault(); }
  }, true);
  document.addEventListener('pointerover', onIntent);
  document.addEventListener('focusin', onIntent);
  document.addEventListener('touchstart', onIntent, { passive: true });
})();


/* Quick answers (Pass 2, 2026-09-29). Pre-written answers to common questions: tap a question,
   read the answer. Not AI, and it says so. No network request, no storage. Built here so a page
   without scripts simply doesn't show it; Schedule a call and Email me stay on every page anyway. */
(function () {
  'use strict';

  var CAL = 'https://cal.com/evan-exanes/30min';
  var QA = [
    { q: 'Who is Evan Prens P. Exanes?', a: 'I\'m Evan, a web developer and SEO specialist in Metro Manila, Philippines. I build business websites in WordPress and Elementor, write HTML and CSS by hand where a page has to be exact, and do the technical SEO that lets search engines and AI assistants read them.\n\nI\'m also studying for a Bachelor of Science in Information Technology at Asia Pacific College, 2025 to 2029.', link: { href: '06-about.html', text: 'More about me' } },
    { q: 'What do you build?', a: 'Business websites: company sites, blogs and online stores. WordPress and Elementor for content teams, hand-written HTML and CSS where a page has to be exact.', link: { href: 'index.html#work', text: 'See the work' } },
    { q: 'Do you do SEO?', a: 'Yes, technical SEO: structured data (JSON-LD), clean slugs, redirects that don\'t chain, and AEO and GEO so AI assistants can read the site too.' },
    { q: 'Which tools do you use?', a: 'WordPress, Elementor, ACF, WooCommerce, HTML and CSS. Each case study lists the exact stack.', link: { href: 'index.html#work', text: 'See the case studies' } },
    { q: 'Where are you based?', a: 'Taguig City, Metro Manila, Philippines, and I work remotely. Calls are booked on Cal.com.' },
    { q: 'How fast do you reply?', a: 'Within one working day.' },
    { q: 'How do rates work?', a: 'I quote each project after a 30-minute call, because a four-page company site and a thirty-product store are different jobs. There\'s no public rate card.' },
    { q: 'Can I see your CV?', a: 'Yes, here it is as a PDF.', link: { href: 'assets/Evan_Exanes_CV.pdf', text: 'Download CV (PDF)', download: 'Evan_Exanes_CV.pdf' } }
  ];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text) { n.textContent = text; }
    return n;
  }
  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 5h16v11H9l-5 4z"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var launcher = el('button', 'qa-launcher');
  launcher.type = 'button';
  launcher.id = 'qa-launcher';
  launcher.setAttribute('aria-label', 'Quick answers');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'qa-panel');
  launcher.innerHTML = ICON_CHAT;

  var panel = el('div', 'qa-panel');
  panel.id = 'qa-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'qa-title');
  panel.hidden = true;

  var head = el('div', 'qa-head');
  var titles = el('div');
  var title = el('p', 'qa-title', 'Quick answers');
  title.id = 'qa-title';
  titles.appendChild(title);
  titles.appendChild(el('p', 'qa-sub', 'Common questions about working with Evan'));
  var closeBtn = el('button', 'qa-close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close quick answers');
  closeBtn.innerHTML = ICON_X;
  head.appendChild(titles);
  head.appendChild(closeBtn);

  var log = el('div', 'qa-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  log.appendChild(el('p', 'qa-bubble', 'Hi! Pick a question below. For anything else, book a call or send an email.'));

  var chips = el('div', 'qa-chips');
  var body = el('div', 'qa-body');
  body.appendChild(log);
  body.appendChild(chips);
  var foot = el('div', 'qa-foot');
  foot.innerHTML = '<a class="btn btn-primary" href="' + CAL + '" target="_blank" rel="noopener noreferrer" data-cal-link="evan-exanes/30min" data-cal-namespace="30min" data-cal-config=\'{"layout":"month_view"}\'>Schedule a call<span class="visually-hidden"> (opens a booking calendar in a pop-up or a new tab)</span></a>' +
                   '<a class="btn btn-secondary" href="mailto:exanesevan@gmail.com">Email me</a>';
  var note = el('p', 'qa-note', 'Pre-written answers, not AI.');

  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(foot);
  panel.appendChild(note);
  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  var asked = [];

  function renderChips() {
    chips.innerHTML = '';
    var left = [];
    for (var i = 0; i < QA.length; i++) { if (asked.indexOf(i) < 0) { left.push(i); } }
    if (!left.length) { asked = []; left = QA.map(function (_, k) { return k; }); }
    for (var j = 0; j < left.length; j++) {
      var b = el('button', 'qa-chip', QA[left[j]].q);
      b.type = 'button';
      b.setAttribute('data-qa', String(left[j]));
      chips.appendChild(b);
    }
  }

  function answer(i) {
    var item = QA[i];
    log.appendChild(el('p', 'qa-bubble qa-bubble--me', item.q));
    var reply = el('div', 'qa-bubble');
    item.a.split('\n\n').forEach(function (para) { reply.appendChild(el('p', 'qa-para', para)); });
    if (item.link) {
      var a = el('a', 'qa-link', item.link.text);
      a.href = item.link.href;
      if (item.link.download) { a.setAttribute('download', item.link.download); }
      reply.appendChild(a);
    }
    log.appendChild(reply);
    asked.push(i);
    renderChips();
    /* Keep the answer, not the next chip, in view: the question and its reply scroll to the top of the body. */
    var question = reply.previousSibling;
    body.scrollTop += question.getBoundingClientRect().top - body.getBoundingClientRect().top - 8;
    var first = chips.querySelector('.qa-chip');
    if (first) { first.focus({ preventScroll: true }); }
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('qa-open', open);
    if (open) {
      var first = chips.querySelector('.qa-chip');
      if (first) { first.focus(); }
    }
  }

  launcher.addEventListener('click', function () { setOpen(panel.hidden); });
  closeBtn.addEventListener('click', function () { setOpen(false); launcher.focus(); });
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('[data-qa]');
    if (b) { answer(Number(b.getAttribute('data-qa'))); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden && !e.defaultPrevented) { setOpen(false); launcher.focus(); }
  });

  renderChips();
})();

/* Back to top: a floating button stacked above the Quick answers launcher, shown after one
   screen of scrolling. It replaces the footer link, which stays in the HTML for no-JS visits. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'to-top';
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 19V5M5 12l7-7 7 7"/></svg><span class="visually-hidden">Back to top</span>';
  btn.hidden = true;
  document.body.appendChild(btn);

  Array.prototype.forEach.call(document.querySelectorAll('.footer-top'), function (a) { a.hidden = true; });

  var ticking = false;
  function update() {
    ticking = false;
    /* Never hide the button while it has focus, or keyboard focus falls back to the body. */
    if (document.activeElement === btn) { return; }
    btn.hidden = window.scrollY < window.innerHeight;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  /* activeElement still points at the button during blur, so re-check on the next tick. */
  btn.addEventListener('blur', function () { window.setTimeout(update, 0); });
  update();

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    /* Keyboard users continue from the top of the page, not from the hidden button. */
    var home = document.querySelector('.wordmark');
    if (home) { home.focus({ preventScroll: true }); }
  });
})();

/* About stats: each number counts up from 0 the first time it scrolls into view. The real
   number is already in the HTML, so a visitor without JavaScript, or one who asked for reduced
   motion, sees it straight away. Screen readers get the hidden copy, never the moving one. */
(function () {
  'use strict';

  var nums = document.querySelectorAll('.stat-num[data-count-to]');
  if (!nums.length || !('IntersectionObserver' in window)) { return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

  function finish() {
    nums.forEach(function (el) { el.textContent = el.getAttribute('data-count-to'); });
  }

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10);
    var start = null;
    function step(now) {
      if (start === null) { start = now; }
      var p = Math.min(1, (now - start) / 1500);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));  /* ease-out cubic */
      if (p < 1) { window.requestAnimationFrame(step); }
    }
    window.requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) { return; }
      io.unobserve(entry.target);
      countUp(entry.target);
    });
  }, { threshold: 0.5 });

  nums.forEach(function (el) {
    el.textContent = '0';
    io.observe(el);
  });
  window.addEventListener('beforeprint', finish);
})();

/* Certificates (2026-10-09): the subject tiles jump into a list that sits behind one
   <details>. Open it first, so the jump lands on a visible group. A link that arrives with
   #cert-... in the URL gets the same treatment. Without JavaScript a tile still scrolls to
   the closed list, and its "Show all 33 certificates" summary is right there. */
(function () {
  'use strict';

  var list = document.getElementById('cert-list');
  if (!list) { return; }

  function openFor(hash) {
    if (!hash || hash.length < 2) { return null; }
    var target = document.getElementById(hash.slice(1));
    if (!target || !list.contains(target)) { return null; }
    list.open = true;
    return target;
  }

  document.querySelectorAll('.cert-topic').forEach(function (a) {
    a.addEventListener('click', function () { openFor(a.getAttribute('href')); });
  });
  window.addEventListener('hashchange', function () { openFor(window.location.hash); });

  var arrived = openFor(window.location.hash);
  if (arrived) { arrived.scrollIntoView(); }
})();

/* Contact form. Sends through Web3Forms, which emails the message to the site owner.
   The status line only claims success when the service confirms it; otherwise it says
   so and points at the email address. The browser still runs its own required-field
   checks first. */
(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (!form || !status || !window.fetch) { return; }

  var button = form.querySelector('button[type="submit"]');

  function show(message) {
    status.textContent = message;
    status.hidden = false;
    /* role="status" announces it; moving focus makes it findable by keyboard. */
    status.setAttribute('tabindex', '-1');
    status.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (button) { button.disabled = true; }
    fetch(form.action, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success) {
          form.reset();
          show('Thanks \u2014 your message has been sent. I reply within one working day.');
        } else {
          show('Sorry, that did not send. Please email me directly at exanesevan@gmail.com.');
        }
      })
      .catch(function () {
        show('Sorry, that did not send. Please email me directly at exanesevan@gmail.com.');
      })
      .then(function () { if (button) { button.disabled = false; } });
  });
})();
