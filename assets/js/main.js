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
 * TOP page only: intro screen with a fixed-speed reveal, shown once per
 * page load. Rather than scrubbing opacity/scale directly off scroll
 * position (which made the reveal depend on how fast/far the visitor
 * scrolled - scroll slowly and stop, and the Hero copy could be left
 * permanently hidden), the page scroll is locked the moment it loads.
 * The first scroll/wheel/touch/keyboard gesture the visitor makes is
 * treated purely as a "go" signal: it starts a single, fixed-duration
 * animation (INTRO_DURATION) that always runs to completion at the same
 * speed, driven by elapsed time rather than by continued scrolling.
 * Nothing the visitor does after that first nudge changes its pace.
 *
 * Because the page never actually scrolls during this animation, the
 * Hero - which sits immediately after the header in normal document
 * flow - is guaranteed to land exactly at its own top the moment the
 * lock is released. There is no separate scroll-distance bookkeeping to
 * keep in sync.
 *
 * Once the reveal finishes, the intro and the branch/petals effect are
 * retired for good and the scroll lock is released - scrolling back to
 * the top afterward never brings any of it back. Only a full page
 * reload resets this. No-ops on any page without these elements
 * (About/Services/etc. are untouched).
 *
 * Dispatches a "shiraume:hero-revealed" event on window the moment the
 * reveal completes, which the petal effect below listens for to stop for
 * good.
 */
(function () {
  var intro = document.getElementById('introScreen');
  var hero = document.getElementById('heroSection');
  var nav = document.getElementById('siteNav');
  var branch = document.querySelector('.plum-branch');
  if (!intro || !hero) return;

  // A slow, unhurried crossfade - always this long, regardless of how
  // the visitor scrolls.
  var INTRO_DURATION = 2600;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var started = false;
  var locked = false;
  var pinning = false;

  // Smoothstep: eases in and out rather than a straight linear fade.
  function ease(p) {
    return p * p * (3 - 2 * p);
  }

  function paint(progress) {
    intro.style.opacity = String(1 - progress);
    intro.style.transform = 'translateY(' + (-progress * 60) + 'px)';

    // Hero fades/scales in as one unified block (background, copy and
    // buttons all live inside it) rather than switching on abruptly.
    hero.style.opacity = String(progress);
    hero.style.transform = 'scale(' + (1.03 - progress * 0.03) + ')';

    // The fixed header stays out of the way during the brand moment and
    // arrives together with the Hero, instead of sitting over the intro.
    if (nav) nav.style.opacity = String(progress);

    // The branch fades out together with the intro instead of vanishing
    // abruptly the instant the reveal finishes.
    if (branch) branch.style.opacity = String(1 - progress);
  }

  // While the fixed-speed reveal plays, any scrolling the visitor does is
  // immediately cancelled (scrollY snapped back to 0) every frame, so the
  // page visually stays put and the animation is the only thing moving -
  // regardless of input device (wheel, trackpad, touch, keyboard,
  // scrollbar drag all simply produce native "scroll" events, which is
  // the one thing every input method has in common).
  function onScrollWhilePinned() {
    if (pinning && window.scrollY !== 0) window.scrollTo(0, 0);
  }

  // hideBranch is false for the reduced-motion path: that skips the
  // animated intro immediately, but per the original brief the static
  // branch should keep showing for reduced-motion visitors (only the
  // falling-petals motion is the thing being suppressed).
  function finish(hideBranch) {
    if (locked) return;
    locked = true;
    pinning = false;

    paint(1);
    if (nav) nav.style.pointerEvents = 'auto';
    intro.style.display = 'none';
    if (branch && hideBranch) branch.style.display = 'none';
    window.removeEventListener('scroll', onScrollWhilePinned);

    // Kicks off the staggered top-to-bottom / left-to-right cascade for
    // the Hero copy and buttons (see .hero-fade / .hero-fade--text in
    // style.css) right as the Hero finishes taking over the screen.
    hero.classList.add('is-content-revealed');

    window.dispatchEvent(new Event('shiraume:hero-revealed'));
  }

  function runFixedSpeedReveal() {
    var startTime = null;

    function frame(now) {
      if (startTime === null) startTime = now;
      var raw = Math.min(1, (now - startTime) / INTRO_DURATION);
      paint(ease(raw));

      if (raw < 1) {
        window.requestAnimationFrame(frame);
      } else {
        finish(true);
      }
    }

    window.requestAnimationFrame(frame);
  }

  function beginOnce() {
    if (started) return;
    started = true;
    if (window.scrollY !== 0) window.scrollTo(0, 0);
    runFixedSpeedReveal();
  }

  if (reduceMotion) {
    // Skip the timed intro entirely; keep the branch static.
    paint(1);
    finish(false);
  } else {
    if (nav) nav.style.pointerEvents = 'none';
    paint(0);
    pinning = true;
    // The first "scroll" event - from wheel, trackpad, touch, keyboard,
    // or dragging the scrollbar, it makes no difference - is the one and
    // only "go" signal. Passive: cheapest possible listener, and pinning
    // during playback is handled by onScrollWhilePinned above.
    window.addEventListener('scroll', function onFirstScroll() {
      window.removeEventListener('scroll', onFirstScroll);
      beginOnce();
    }, { passive: true });
    window.addEventListener('scroll', onScrollWhilePinned, { passive: true });
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

  var MIN_PETALS = 5;
  var MAX_PETALS = 8;
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
    window.setTimeout(spawnPetal, i * 400);
  }

  spawnTimer = window.setInterval(function () {
    var target = MIN_PETALS + Math.floor(Math.random() * (MAX_PETALS - MIN_PETALS + 1));
    if (active < target) spawnPetal();
  }, 1200);

  window.addEventListener('shiraume:hero-revealed', stopPetals);
})();
