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
 * TOP page only: scroll-scrubbed Hero reveal (reference: findrealestate.com's
 * pinned hero where a photo and wordmark transform continuously as you
 * scroll, rather than a one-shot timed intro).
 *
 * .hero sits inside a taller wrapper (#heroScrub) and is pinned to the top
 * of the viewport via position:sticky (CSS) for the extra height of that
 * wrapper. Progress (0-1) is derived purely from how far the visitor has
 * scrolled into that pinned range - a plain function of scroll position,
 * so it can never get "stuck" partway regardless of how fast, slow, or
 * far the visitor scrolls, and it responds identically to every input
 * device since it just reads native scroll position each frame.
 *
 * Two stages live stacked inside the same pinned .hero: Stage 1
 * (#stageIntro - the minimal English "Designing Growth, Building Trust."
 * first view) fades out over the first ~32% of progress, handing off to
 * Stage 2 (the existing Japanese photo hero), whose own elements carry
 * data-reveal="start,end" (a sub-range of the 0-1 progress) and
 * data-reveal-mode ("wipe" / "wipe-down" / "fade"), painted directly from
 * scroll position - no CSS keyframe animations or timers involved. The
 * background photo enters from the left and brightens as Stage 2 takes
 * over.
 *
 * Dispatches "shiraume:hero-revealed" once progress first reaches ~1,
 * which the petal effect below listens for to stop spawning for good
 * (scrolling back up afterward does not bring it back - only a reload
 * does). No-ops on any page without these elements.
 */
(function () {
  var scrub = document.getElementById('heroScrub');
  var hero = document.getElementById('heroSection');
  var branch = document.querySelector('.plum-branch');
  var bg = hero ? hero.querySelector('.hero__bg') : null;
  var stageIntro = document.getElementById('stageIntro');
  if (!scrub || !hero) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fadeEls = Array.prototype.slice.call(hero.querySelectorAll('[data-reveal]'));
  var settled = false;
  var ticking = false;

  // Smoothstep: eases in and out rather than a straight linear fade.
  function ease(p) {
    return p * p * (3 - 2 * p);
  }

  // Maps p into the 0-1 sub-range [a,b], clamped at both ends.
  function seg(p, a, b) {
    if (p <= a) return 0;
    if (p >= b) return 1;
    return (p - a) / (b - a);
  }

  function paint(p) {
    var e = ease(p);

    // Photo: enters from the left with a slight scale-down and starts
    // noticeably dimmer, settling into its normal brightness and position.
    if (bg) {
      bg.style.transform = 'translateX(' + ((1 - e) * -6) + '%) scale(' + (1.08 - e * 0.08) + ')';
      bg.style.filter = 'brightness(' + (0.34 + e * 0.28) + ')';
    }

    // Stage 1 (minimal English intro) fades out early, handing off to
    // Stage 2 (the Japanese photo hero) underneath. Once mostly gone it
    // stops intercepting clicks so Stage 2's own button is reachable.
    if (stageIntro) {
      var s1 = 1 - seg(e, 0, 0.32);
      stageIntro.style.opacity = String(s1);
      stageIntro.style.pointerEvents = s1 > 0.15 ? 'auto' : 'none';
    }

    // Branch fades out as the Hero settles in, same as before.
    if (branch) branch.style.opacity = String(1 - seg(e, 0.15, 0.55));

    fadeEls.forEach(function (el) {
      var range = (el.getAttribute('data-reveal') || '0,1').split(',').map(Number);
      var v = ease(seg(e, range[0], range[1]));
      el.style.opacity = String(v);
      var mode = el.getAttribute('data-reveal-mode');
      if (mode === 'wipe') {
        el.style.clipPath = 'inset(0 ' + (100 - v * 100) + '% 0 0)';
        el.style.transform = 'translateY(' + ((1 - v) * 16) + 'px)';
      } else if (mode === 'wipe-down') {
        el.style.clipPath = 'inset(0 0 ' + (100 - v * 100) + '% 0)';
        el.style.transform = 'translateY(' + ((1 - v) * 10) + 'px)';
      }
      // mode === 'fade' (buttons): opacity only, no motion, no clip.
    });

    if (p >= 0.98 && !settled) {
      settled = true;
      window.dispatchEvent(new Event('shiraume:hero-revealed'));
    }
  }

  function update() {
    var range = scrub.offsetHeight - hero.offsetHeight;
    var scrolled = -scrub.getBoundingClientRect().top;
    var p = range > 0 ? Math.min(1, Math.max(0, scrolled / range)) : 1;
    paint(p);
  }

  if (reduceMotion) {
    // Skip the scrub entirely; show the settled state immediately, but
    // keep the branch static per the original brief.
    paint(1);
    if (branch) branch.style.opacity = '1';
    window.dispatchEvent(new Event('shiraume:hero-revealed'));
  } else {
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();

/**
 * TOP page only: falling plum-blossom petals, intro-only.
 * Each of the 10 source petals (numbered (1)-(10) in the reference sheet)
 * has been individually cut out - background removed, no number labels -
 * into its own transparent PNG at assets/images/petals/petal-01.png
 * through petal-10.png. One is picked at random per falling petal, and
 * they drift near the top-left branch with a gentle side-to-side sway.
 * Petals only spawn while the intro is still showing; once the Hero has
 * fully scrolled into view ("shiraume:hero-revealed") spawning stops for
 * good and any still-falling petals fade out. Purely decorative
 * (aria-hidden, pointer-events: none) and never starts at all when the
 * visitor has requested reduced motion - only the static branch remains.
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

  window.addEventListener('shiraume:hero-revealed', stopPetals);
})();
