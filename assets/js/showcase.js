/* Shiraume Digital — showcase.js (v1 / 2026-09-28)
   1) reveal .mock / .show-card / .showcase__devices when in view (staggered)
   2) auto-scroll long screenshots inside .mock__screen
   3) pointer tilt on .mock[data-tilt] */
(function(){
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupScroll(mock){
    mock.querySelectorAll('.mock__shot').forEach(function(img){
      function apply(){
        var screen = img.closest('.mock__screen'); if(!screen) return;
        var over = img.offsetHeight - screen.offsetHeight;
        if(over > 24){
          img.style.setProperty('--scroll', over + 'px');
          img.style.setProperty('--dur', Math.max(8, Math.min(26, over / 60)) + 's');
          img.classList.add('is-scroll');
        }else{ img.classList.remove('is-scroll'); }
      }
      if(img.complete) apply(); else img.addEventListener('load', apply);
      window.addEventListener('resize', apply);
    });
  }

  function setupTilt(mock){
    if(reduce || !window.matchMedia('(hover:hover)').matches) return;
    var max = 7;
    mock.addEventListener('pointerenter', function(){ mock.classList.add('is-hover'); });
    mock.addEventListener('pointermove', function(e){
      var r = mock.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      mock.style.setProperty('--ry', (px * max * 2) + 'deg');
      mock.style.setProperty('--rx', (-py * max * 2) + 'deg');
    });
    mock.addEventListener('pointerleave', function(){
      mock.classList.remove('is-hover'); mock.style.setProperty('--rx','0deg'); mock.style.setProperty('--ry','0deg');
    });
  }

  var targets = document.querySelectorAll('.mock, .show-card, .showcase__devices, .m-intro, .flw-step');
  if(!targets.length) return;
  document.querySelectorAll('.mock').forEach(function(m){ setupScroll(m); if(m.hasAttribute('data-tilt')) setupTilt(m); });

  if(!('IntersectionObserver' in window) || reduce){
    targets.forEach(function(t){ t.classList.add('is-inview'); }); return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting) return;
      var el = en.target;
      var group = el.closest('.showcase__grid, .services__grid, .grid-3');
      if(el.classList.contains('flw-step')) delay = 0;
      var delay = 0;
      if(group){ var kids = Array.prototype.slice.call(group.children); delay = Math.max(0, kids.indexOf(el.closest('.show-card, .svc-card, .works-grid-card') || el)) * 110; }
      setTimeout(function(){ el.classList.add('is-inview'); }, delay);
      io.unobserve(el);
    });
  }, {threshold: .18, rootMargin: '0px 0px -8% 0px'});
  targets.forEach(function(t){ io.observe(t); });
})();

/* 制作の流れ：縦線の進み具合をスクロールで更新 */
(function(){
  var wrap=document.querySelector('.flw'); if(!wrap) return;
  var t=false;
  function u(){ t=false; var r=wrap.getBoundingClientRect(); var vh=window.innerHeight;
    var p=(vh*0.6 - r.top)/r.height; p=Math.max(0,Math.min(1,p)); wrap.style.setProperty('--flwp',p.toFixed(3)); }
  window.addEventListener('scroll',function(){ if(!t){t=true;requestAnimationFrame(u);} },{passive:true});
  window.addEventListener('resize',u); u();
})();
