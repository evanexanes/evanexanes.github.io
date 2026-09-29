/* evanexanes.com — Final Prototype (2026-09-28)
   Three behaviours: the mobile menu disclosure, the theme switch, and the
   contact-form confirmation. The menu is collapsed at
   narrow widths, never removed — IA v2 requires the same three items in the
   same order at 360 px. */

(function () {
  'use strict';

  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!toggle || !nav) { return; }

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  /* Escape closes the menu and returns focus to the control that opened it. */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  /* Following a link should not leave an open menu behind it. */
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { setOpen(false); }
  });

  /* Returning to desktop width clears the mobile state. */
  var wide = window.matchMedia('(min-width: 801px)');
  var onChange = function (e) { if (e.matches) { setOpen(false); } };
  if (wide.addEventListener) { wide.addEventListener('change', onChange); }
  else if (wide.addListener) { wide.addListener(onChange); }
})();

/* Theme switch (final prototype, 2026-09-28). The starting theme is already
   on <html> — set by the inline script in <head> before first paint. This
   only flips it, remembers the choice, and keeps aria-pressed in step. */
(function () {
  'use strict';

  var root = document.documentElement;
  var btn = document.querySelector('[data-theme-toggle]');
  if (!btn) { return; }

  function sync() {
    btn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
  }

  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });

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

/* Schedule a call (Cal.com pop-up). Every [data-cal-link] is a real link to the
   booking page, so it still works with scripts blocked. Cal's embed script is
   fetched on the first sign of intent (pointer over, focus, touch) on one of
   those links, not on page load; it then turns the click into a pop-up. Cal's
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
