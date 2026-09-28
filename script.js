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
  var wide = window.matchMedia('(min-width: 721px)');
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
