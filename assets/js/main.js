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
 * TOP page only: Stage 1 (#stageIntro, the minimal English intro) and
 * Stage 2 (#heroSection, the Japanese photo hero) are both plain, static
 * full-height sections now - Stage 2 carries .fade-section like every
 * other section on the page, so the generic IntersectionObserver at the
 * top of this file reveals it the same proven way. There is deliberately
 * no bespoke scroll-pinning/scrub JS here anymore: an earlier scroll-
 * pinned version was fragile across browsers (Stage 2 could fail to
 * appear at all), so this was rebuilt on the same simple, reliable
 * mechanism already used elsewhere on the site.
 */

/**
 * TOP page only: a subtle scroll-parallax on Stage 2's photo.
 * Deliberately NOT a scroll-pin/scrub setup (see note above on why that
 * was removed) - just a plain scroll listener nudging a translateY offset
 * on `.hero__bg-wrap`, throttled to one requestAnimationFrame per scroll
 * event. The wrapper is oversized (see CSS) so this small movement never
 * reveals an edge. Skipped entirely under reduced-motion.
 */
(function () {
  var wrap = document.querySelector('.hero .hero__bg-wrap');
  var section = document.querySelector('.hero');
  if (!wrap || !section) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var ticking = false;

  function update() {
    var rect = section.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    // 0 when the section's top has just reached the bottom of the
    // viewport, 1 when its bottom has just reached the top - i.e. how far
    // through its own scroll journey the section currently is.
    var progress = (vh - rect.top) / (vh + rect.height);
    progress = Math.max(0, Math.min(1, progress));
    var offset = (progress - 0.5) * 50; // a restrained ±25px drift, not a full parallax scene
    wrap.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/**
 * TOP page only: falling plum-blossom petals, intro-only.
 * Each of the 10 source petals (numbered (1)-(10) in the reference sheet)
 * has been individually cut out - background removed, no number labels -
 * into its own transparent PNG at assets/images/petals/petal-01.png
 * through petal-10.png. One is picked at random per falling petal, and
 * they drift near the top-left branch with a gentle side-to-side sway.
 * Petals only spawn while Stage 1 (#stageIntro) is still on screen; a
 * small IntersectionObserver below stops spawning for good the moment
 * #stageIntro scrolls fully out of view (scrolling back up afterward does
 * not bring it back - only a reload does), and any still-falling petals
 * fade out. Purely decorative (aria-hidden, pointer-events: none) and
 * never starts at all when the visitor has requested reduced motion.
 */
(function () {
  var layer = document.getElementById('petalLayer');
  if (!layer) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var MIN_PETALS = 10;
  var MAX_PETALS = 16;
  var PETAL_COUNT = 10;
  var active = 0;
  var stopped = false;
  var spawnTimer = null;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function petalUrl(n) {
    var num = n < 10 ? '0' + n : '' + n;
    return 'url(assets/images/petals/petal-' + num + '.png)';
  }

  function spawnPetal() {
    if (stopped || active >= MAX_PETALS) return;
    active++;

    var petal = document.createElement('div');
    petal.className = 'petal';

    var size = rand(12, 24);
    var which = 1 + Math.floor(rand(0, PETAL_COUNT));
    // "かなりゆっくり" - a slow, unhurried fall.
    var duration = rand(16, 26);
    var spin = rand(0, 200) * (Math.random() < 0.5 ? 1 : -1);
    var opacity = rand(0.6, 1);
    var startLeft = rand(0, 260);

    petal.style.width = size + 'px';
    petal.style.height = size + 'px';
    petal.style.left = startLeft + 'px';
    petal.style.opacity = opacity;
    petal.style.backgroundImage = petalUrl(which);
    // Gentle wind sway: alternating left/right drift at each keyframe stop.
    petal.style.setProperty('--petal-dx1', rand(10, 26) + 'px');
    petal.style.setProperty('--petal-dx2', -rand(10, 26) + 'px');
    petal.style.setProperty('--petal-dx3', rand(8, 22) + 'px');
    petal.style.setProperty('--petal-dx4', -rand(4, 14) + 'px');
    petal.style.setProperty('--petal-spin', spin + 'deg');
    petal.style.animationDuration = duration + 's';

    petal.addEventListener('animationend', function () {
      petal.remove();
      active--;
    });

    layer.appendChild(petal);
  }

  function stopPetals() {
    stopped = true;
    if (spawnTimer) {
      window.clearInterval(spawnTimer);
      spawnTimer = null;
    }
    // Let any already-falling petals fade out naturally rather than
    // yanking them away mid-fall.
    var falling = layer.querySelectorAll('.petal');
    falling.forEach(function (p) {
      p.style.transition = 'opacity 1.2s ease';
      p.style.opacity = '0';
    });
  }

  // Seed an initial batch so the effect is already present on load.
  for (var i = 0; i < MIN_PETALS; i++) {
    window.setTimeout(spawnPetal, i * 220);
  }

  spawnTimer = window.setInterval(function () {
    var target = MIN_PETALS + Math.floor(Math.random() * (MAX_PETALS - MIN_PETALS + 1));
    if (active < target) spawnPetal();
  }, 900);

  // Stop spawning once Stage 1 has fully scrolled out of view.
  var stageIntro = document.getElementById('stageIntro');
  if (stageIntro && window.IntersectionObserver) {
    var stageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          stopPetals();
          stageObserver.disconnect();
        }
      });
    }, { threshold: 0 });
    stageObserver.observe(stageIntro);
  }
})();
