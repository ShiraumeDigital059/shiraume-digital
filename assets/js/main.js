/**
 * Shiraume Digital - all pages
 * Scroll-triggered fade-in for sections, ported from the original
 * per-page React IntersectionObserver logic to a single generic vanilla JS
 * observer that works on any element with the `.fade-section` class.
 */
(function () {
  var targets = document.querySelectorAll('.fade-section');
  if (!targets.length) return;

  // Trigger as soon as a section starts entering the viewport (threshold: 0),
  // offset slightly from the bottom edge (rootMargin) so it doesn't fire the
  // instant a single pixel is visible. Using a fixed rootMargin instead of a
  // percentage-of-target threshold means very tall sections (long forms,
  // stacked mobile layouts, etc.) still animate in at a consistent scroll
  // distance instead of requiring an unreasonable amount of scrolling.
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: '0px 0px -10% 0px' }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
})();

/**
 * Mobile nav: hamburger toggle for the collapsed menu (<=768px).
 * Works the same way on every page since the nav markup/classes are shared.
 */
(function () {
  var toggles = document.querySelectorAll('.nav__toggle');

  toggles.forEach(function (btn) {
    var nav = btn.closest('.nav');
    if (!nav) return;
    var links = nav.querySelector('.nav__links');
    if (!links) return;

    btn.addEventListener('click', function () {
      var isOpen = links.classList.toggle('nav__links--open');
      btn.classList.toggle('is-active', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('nav__links--open');
        btn.classList.remove('is-active');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  });
})();

/**
 * InquiryForm.html: inquiry form category picker.
 * Selecting a category navigates to that category's dedicated form page
 * (a native page on this site, e.g. Inquiry-Restaurant.html). Categories
 * without a form yet show a "coming soon" message instead.
 *
 * To add a new category's form once it's ready, just add an entry below:
 *   '業種名': 'PageName.html'
 */
(function () {
  var buttons = document.querySelectorAll('#inquiry-category-list .filter-pill');
  if (!buttons.length) return;

  var pendingMsg = document.getElementById('inquiry-pending-message');

  var categoryForms = {
    '飲食店（レストラン・居酒屋・カフェ）': 'Inquiry-Restaurant.html'
  };

  function fadeIn(el) {
    el.classList.remove('is-visible');
    el.style.display = 'block';
    void el.offsetWidth; // force reflow
    el.classList.add('is-visible');
  }

  function fadeOut(el) {
    el.classList.remove('is-visible');
    window.setTimeout(function () {
      if (!el.classList.contains('is-visible')) el.style.display = 'none';
    }, 400);
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      buttons.forEach(function (b) { b.classList.remove('filter-pill--active'); });
      btn.classList.add('filter-pill--active');

      var category = btn.getAttribute('data-category');
      var url = categoryForms[category];

      if (url) {
        if (pendingMsg) fadeOut(pendingMsg);
        window.location.href = url;
      } else if (pendingMsg) {
        fadeIn(pendingMsg);
        pendingMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

/**
 * TOP page only: scroll intro screen.
 * Shows a centered "Shiraume Digital" wordmark + Scroll cue over the Hero
 * on first paint; fades out once the visitor scrolls down ~50-80px, then
 * the Hero fades/scales in underneath it. No-ops on any page without these
 * elements (About/Services/etc. are untouched).
 */
(function () {
  var intro = document.getElementById('introScreen');
  var hero = document.getElementById('heroSection');
  if (!intro || !hero) return;

  var revealed = false;
  var threshold = 64; // within the requested 50-80px range

  function reveal() {
    if (revealed) return;
    revealed = true;
    intro.classList.add('intro-screen--hidden');
    hero.classList.add('is-revealed');
    window.removeEventListener('scroll', onTrigger);
    window.removeEventListener('wheel', onTrigger);
    window.removeEventListener('touchmove', onTrigger);
    window.setTimeout(function () {
      intro.style.display = 'none';
    }, 850);
  }

  function onTrigger() {
    if (window.scrollY >= threshold) reveal();
  }

  window.addEventListener('scroll', onTrigger, { passive: true });
  window.addEventListener('wheel', onTrigger, { passive: true });
  window.addEventListener('touchmove', onTrigger, { passive: true });
})();

/**
 * TOP page only: falling plum-blossom petals.
 * Reads 10 petal sprites (5 columns x 2 rows) from
 * assets/images/plum-petals.png via the .petal background-image declared
 * in style.css, and picks one at random per petal. Purely decorative
 * (aria-hidden, pointer-events: none) and stays off entirely when the
 * visitor has requested reduced motion - only the static branch remains.
 */
(function () {
  var layer = document.getElementById('petalLayer');
  if (!layer) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var MIN_PETALS = 5;
  var MAX_PETALS = 8;
  var SPRITE_COLS = 5;
  var SPRITE_ROWS = 2;
  var active = 0;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawnPetal() {
    if (active >= MAX_PETALS) return;
    active++;

    var petal = document.createElement('div');
    petal.className = 'petal';

    var size = rand(12, 24);
    var col = Math.floor(rand(0, SPRITE_COLS));
    var row = Math.floor(rand(0, SPRITE_ROWS));
    var duration = rand(9, 16);
    var drift = rand(-70, 90);
    var spin = rand(0, 360) * (Math.random() < 0.5 ? 1 : -1);
    var opacity = rand(0.6, 1);
    var startLeft = rand(0, 260);

    petal.style.width = size + 'px';
    petal.style.height = size + 'px';
    petal.style.left = startLeft + 'px';
    petal.style.opacity = opacity;
    petal.style.backgroundPosition = (col / (SPRITE_COLS - 1) * 100) + '% ' + (row / (SPRITE_ROWS - 1) * 100) + '%';
    petal.style.setProperty('--petal-drift', drift + 'px');
    petal.style.setProperty('--petal-spin', spin + 'deg');
    petal.style.animationDuration = duration + 's';

    petal.addEventListener('animationend', function () {
      petal.remove();
      active--;
    });

    layer.appendChild(petal);
  }

  // Seed an initial batch so the effect is already present on load.
  for (var i = 0; i < MIN_PETALS; i++) {
    window.setTimeout(spawnPetal, i * 500);
  }

  window.setInterval(function () {
    var target = MIN_PETALS + Math.floor(Math.random() * (MAX_PETALS - MIN_PETALS + 1));
    if (active < target) spawnPetal();
  }, 1400);
})();
