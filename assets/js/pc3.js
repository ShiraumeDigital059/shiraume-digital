/* pc3 — 料金ページのアニメーション（表示時のフェード・数字カウント・SPタブ） */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.pc3,.pc3t,.tkt,.adp,.adx,.pdca,.rvw,.ph-gal');

  // 段差をつける（リスト・表の行・審査ステップ）
  document.querySelectorAll('.pc3-card').forEach(function (card, ci) {
    card.querySelectorAll('.pc3-list li').forEach(function (li, i) {
      li.style.transitionDelay = (0.45 + ci * 0.14 + i * 0.05).toFixed(2) + 's';
    });
  });
  document.querySelectorAll('.pc3t tbody tr').forEach(function (tr, i) {
    tr.style.transitionDelay = (i * 0.035).toFixed(3) + 's';
  });
  document.querySelectorAll('.pc3t .pc3-ok path').forEach(function (p, i) {
    p.style.transitionDelay = (0.3 + (i % 30) * 0.03).toFixed(2) + 's';
  });
  document.querySelectorAll('.rvw__item').forEach(function (el, i) {
    el.style.transitionDelay = (i * 0.12).toFixed(2) + 's';
  });

  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach(function (el) {
      if (el.dataset.done) return; el.dataset.done = '1';
      var end = parseInt(el.getAttribute('data-count'), 10); if (!end || reduce) return;
      var t0 = null, dur = 1100;
      function fmt(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
      function step(ts) {
        if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = 1 - Math.pow(1 - p, 3);
        el.firstChild ? (el.firstChild.nodeValue = fmt(Math.round(end * e))) : (el.textContent = fmt(Math.round(end * e)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function show(el) { el.classList.add('is-in'); countUp(el); }
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(show);
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    targets.forEach(function (t) { io.observe(t); });
  }

  // SP：タブとスワイプの同期
  document.querySelectorAll('.pc3').forEach(function (sec) {
    var grid = sec.querySelector('.pc3__grid'); var tabs = sec.querySelectorAll('.pc3__tabs button');
    if (!grid || !tabs.length) return;
    var cards = grid.querySelectorAll('.pc3-card');
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () {
        var c = cards[i]; if (!c) return;
        grid.scrollTo({ left: c.offsetLeft - (grid.clientWidth - c.clientWidth) / 2, behavior: 'smooth' });
      });
    });
    var tick = null;
    grid.addEventListener('scroll', function () {
      if (tick) return; tick = requestAnimationFrame(function () {
        tick = null; var mid = grid.scrollLeft + grid.clientWidth / 2, best = 0, bd = 1e9;
        cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
        tabs.forEach(function (t, i) { t.classList.toggle('is-active', i === best); });
      });
    }, { passive: true });
    // 初期位置：おすすめのカード
    var recIdx = Array.prototype.findIndex.call(cards, function (c) { return c.classList.contains('pc3-card--rec'); });
    if (recIdx > 0 && window.innerWidth <= 900) {
      setTimeout(function () { var c = cards[recIdx]; grid.scrollLeft = c.offsetLeft - (grid.clientWidth - c.clientWidth) / 2; }, 60);
    }
  });
  // 料金タイル：押すとそのプランのカードへ
  document.querySelectorAll('.pq-tile[data-idx]').forEach(function (t) {
    t.addEventListener('click', function (e) {
      var i = +t.getAttribute('data-idx'); var card = document.getElementById('plan-' + i);
      var sec = document.querySelector('.pc3');
      if (!card || !sec) { var pl = document.getElementById('plan'); if (pl) { e.preventDefault(); window.scrollTo({ top: pl.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' }); } return; }
      e.preventDefault();
      var grid = sec.querySelector('.pc3__grid');
      if (window.innerWidth <= 900 && grid) {
        grid.scrollTo({ left: card.offsetLeft - (grid.clientWidth - card.clientWidth) / 2, behavior: 'smooth' });
        var y = sec.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        var y2 = card.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: y2, behavior: 'smooth' });
        card.classList.remove('is-ping'); void card.offsetWidth; card.classList.add('is-ping');
      }
    });
  });
})();