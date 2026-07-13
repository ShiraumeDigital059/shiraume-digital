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
 * TOP page only: scroll-scrubbed intro screen, shown once per page load.
 * The intro (branch + wordmark + Scroll cue) and the Hero underneath it
 * are driven directly by how far the visitor has scrolled, Apple-style:
 * at scrollY 0 the intro is fully shown and the Hero is invisible; by the
 * time scrollY reaches INTRO_RANGE the intro has completely faded/lifted
 * away and the Hero is fully in place (opacity 0->1, scale 1.03->1.00).
 * A smoothstep easing curve (slow to start, fastest through the middle,
 * settling at the end) keeps the two in lockstep with scroll position
 * rather than a straight linear fade. Scrolling back up before reaching
 * the end smoothly reverses it.
 *
 * Once the visitor scrolls all the way through a single time, the intro
 * (and the branch/petals effect) is retired for good: the Hero is pinned
 * fully visible and the scroll listener is torn down, so scrolling back
 * to the top afterward never brings the intro, branch, or petals back.
 * Only a full page reload resets this. No-ops on any page without these
 * elements (About/Services/etc. are untouched).
 *
 * Dispatches a "shiraume:hero-revealed" event on window the moment this
 * lock happens, which the petal effect below listens for to stop for
 * good.
 */
(function () {
  var intro = document.getElementById('introScreen');
  var hero = document.getElementById('heroSection');
  var spacer = document.getElementById('introSpacer');
  var nav = document.getElementById('siteNav');
  var branch = document.querySelector('.plum-branch');
  if (!intro || !hero || !spacer) return;

  // ~4.5x the original 64px threshold - a long, unhurried scroll before
  // the Hero fully takes over. Must match the spacer's inline fallback
  // height in index.html (kept as a plain no-JS fallback only).
  var INTRO_RANGE = 420;
  spacer.style.height = INTRO_RANGE + 'px';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ticking = false;
  var locked = false;

  // Smoothstep: eases in and out rather than tracking scroll linearly.
  function ease(p) {
    return p * p * (3 - 2 * p);
  }

  // Collapses the reserved scroll distance and compensates scrollY by the
  // exact same amount, so the visible frame doesn't jump: the Hero's own
  // top was already sitting at the top of the viewport at this instant
  // (that's the whole point of the spacer), and it stays exactly there
  // after the spacer disappears. This also means scrolling back up
  // afterward has no intro-distance left to scroll back into - the intro
  // and petals are gone for good until the page is reloaded.
  //
  // hideBranch is false for the reduced-motion path: that skips the
  // animated intro immediately, but per the original brief the static
  // branch should keep showing for reduced-motion visitors (only the
  // falling-petals motion is the thing being suppressed).
  function lockRevealed(hideBranch) {
    if (locked) return;
    locked = true;

    var removedHeight = spacer.offsetHeight;
    var newScrollY = Math.max(0, window.scrollY - removedHeight);

    spacer.style.height = '0px';
    window.scrollTo(0, newScrollY);

    hero.style.opacity = '1';
    hero.style.transform = 'scale(1)';
    if (nav) {
      nav.style.opacity = '1';
      nav.style.pointerEvents = 'auto';
    }
    intro.style.display = 'none';
    if (branch && hideBranch) branch.style.display = 'none';

    window.removeEventListener('scroll', onScroll);
    window.dispatchEvent(new Event('shiraume:hero-revealed'));
  }

  function apply() {
    ticking = false;
    if (locked) return;

    var raw = Math.max(0, Math.min(1, window.scrollY / INTRO_RANGE));
    var progress = ease(raw);

    intro.style.opacity = String(1 - progress);
    intro.style.transform = 'translateY(' + (-progress * 60) + 'px)';

    // Hero fades/scales in as one unified block (background, copy and
    // buttons all live inside it) rather than switching on abruptly.
    hero.style.opacity = String(progress);
    hero.style.transform = 'scale(' + (1.03 - progress * 0.03) + ')';

    // The fixed header stays out of the way during the brand moment and
    // arrives together with the Hero, instead of sitting over the intro.
    if (nav) {
      nav.style.opacity = String(progress);
      nav.style.pointerEvents = progress > 0.9 ? 'auto' : 'none';
    }

    if (raw >= 1) lockRevealed(true);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  }

  if (reduceMotion) {
    // Skip the scroll-driven intro entirely; keep the branch static.
    lockRevealed(false);
  } else {
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
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
