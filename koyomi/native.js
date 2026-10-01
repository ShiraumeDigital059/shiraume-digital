/* ============================================================
   Koyomi — ネイティブ連携
   iOS アプリとして動いているときだけ有効になる。
   ブラウザで開いたときは何もしない（そのまま今までどおり動く）。
   ------------------------------------------------------------
   やること:
     1. ホーム画面ウィジェット用のデータを渡す
     2. 予定の通知を端末に予約する
   ============================================================ */
(function () {
  'use strict';

  /* iOS のネイティブ機能への入口。
     Capacitor のネイティブ橋渡し（nativePromise）を直接使う。
     registerPlugin はアプリの中では存在しないことがある。 */
  const KOYOMI_METHODS = ['requestPermission','checkPermission','openSettings',
    'scheduleReminders','clearReminders','setWidgetData','notifyNow',
    'storeGet','storeSet','storeDel','signInWithApple'];
  const native = () => {
    try {
      const C = window.Capacitor;
      if (!(C && C.isNativePlatform && C.isNativePlatform())) return null;
      if (window.__KoyomiPlugin) return window.__KoyomiPlugin;
      if (C.Plugins && C.Plugins.Koyomi) return (window.__KoyomiPlugin = C.Plugins.Koyomi);
      if (typeof C.nativePromise === 'function') {
        const P = {};
        KOYOMI_METHODS.forEach(m => { P[m] = o => C.nativePromise('Koyomi', m, o || {}); });
        try { if (C.Plugins) C.Plugins.Koyomi = P; } catch (e) {}
        return (window.__KoyomiPlugin = P);
      }
      if (typeof C.registerPlugin === 'function') {
        const p = C.registerPlugin('Koyomi');
        if (p) return (window.__KoyomiPlugin = p);
      }
      return null;
    } catch (e) { return null; }
  };
  if (!native()) return;                     // ブラウザなら何もしない
  document.documentElement.classList.add('native');

  /* ---- ウィジェットに渡すデータを作る ---- */
  function widgetPayload() {
    if (!window.DB || !DB.authed || !DB.people || !DB.people.length) return null;
    const now = Date.now();
    const u = me();
    const homeTz = effTz(u);
    const members = DB.people.map(p => ({
      name: p.name,
      flag: (CITIES[effCity(p)] || {}).flag || '',
      city: (CITIES[effCity(p)] || {}).en || '',
      tz: effTz(p),
      ws: p.work.s,
      we: p.work.e,
      days: p.work.days,
      off: p.location === 'holiday' || onHoliday(p, now)
    }));
    let overlap = '';
    try {
      const c = civil(now, homeTz);
      const ds = zToUTC(c.y, c.m, c.d, 0, 0, homeTz);
      const seg = overlapSegs(ds);
      if (seg.length) overlap = seg.map(g => pctTime(g[0]) + '–' + pctTime(g[1])).join('  ');
    } catch (e) {}
    return { updated: now, homeTz, members, overlap };
  }

  /* ---- 鳴らすものの一覧を、本体（notifPlan）からもらう ----
     「いつ・何を鳴らすか」は index.html の notifPlan() が1か所で決めている。
     ここはそれを iOS に預けるだけ。文面がずれないし、英語にも自動で付いていく。
     iOS の予約は64件までなので、早い順に55件だけ渡す。 */
  /* 中身が変わったかどうかの印。
     文面や時刻が変わったら別の id になるので、iOS 側で入れ直される。 */
  function stamp(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function planPayload() {
    if (typeof notifPlan !== 'function') return [];
    let p = [];
    try { p = notifPlan() || []; } catch (e) { return []; }
    return p
      .filter(it => it && it.at > Date.now() + 3000)
      .sort((a, b) => a.at - b.at)
      .slice(0, 55)
      .map(it => {
        const title = String(it.title || 'Koyomi'), body = String(it.body || '');
        const at = Math.round(it.at / 1000);
        return {
          id: String(it.id) + '~' + stamp(at + '|' + title + '|' + body),
          at: at, title: title, body: body
        };
      });
  }

  /* ---- まとめて送る（連続で呼ばれても最後の1回だけ） ---- */
  let t = null, lastW = '', lastR = '';
  function sync(force) {
    clearTimeout(t);
    t = setTimeout(async () => {
      try {
        const w = widgetPayload();
        if (w) {
          const j = JSON.stringify(w);
          if (force || j !== lastW) { lastW = j; await native().setWidgetData({ json: j }); }
        }
        /* 予定のリマインドと終業のお知らせをまとめ、早い順に並べる。
           iOS の予約上限（64件）に当たっても、先の予定から順に残るようにする。 */
        const r = planPayload();
        const rj = JSON.stringify(r);
        if (force || rj !== lastR) { lastR = rj; await native().scheduleReminders({ items: r }); }
      } catch (e) { console.warn('[Koyomi] native sync', e); }
    }, 600);
  }

  window.__koyomiSync = sync;      /* 画面側（設定など）から呼べるように */

  /* ---- save() に相乗りする ---- */
  const origSave = window.save;
  window.save = function () { origSave.apply(this, arguments); sync(false); };

  /* ---- 起動時・復帰時・1分ごと ---- */
  window.addEventListener('load', () => setTimeout(() => sync(true), 1200));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync(true);
  });
  setInterval(() => sync(false), 60000);

  /* ---- 通知の許可 ----
     ・いまの状態を画面（プロフィール）に映す
     ・まだ一度も聞いていなければ、ログインしたあとに一度だけ聞く
     ・iPhone の設定で変えられたときのために、戻ってくるたびに見直す */
  async function refreshPerm() {
    try {
      const P = native();
      if (!P || !P.checkPermission) return '';
      const r = await P.checkPermission();
      const st = (r && r.status) || '';
      if (typeof window.NOTIF_PERM !== 'undefined' && window.NOTIF_PERM !== st) {
        window.NOTIF_PERM = st;
        try { if (window.DB && DB.authed && !document.querySelector('#layer').innerHTML) softRender(); } catch (e) {}
      }
      return st;
    } catch (e) { return ''; }
  }
  window.__koyomiPerm = refreshPerm;

  /* ---- いますぐ1件だけ知らせる（メッセージが届いたときなど）----
     プラグインに notifyNow があれば使う。無い古いビルドでは何もしない。 */
  window.__koyomiNotifyNow = function (title, body, tag) {
    try {
      const P = native();
      if (!P || !P.notifyNow) return;
      P.notifyNow({ title: String(title || 'Koyomi'), body: String(body || ''), tag: String(tag || '') });
    } catch (e) {}
  };

  (async () => {
    try {
      const st = await refreshPerm();
      if (st === 'granted') { sync(true); return; }
      /* iOS 側がまだ一度も聞かれていない（prompt）なら、前回の「聞いた」印は当てにしない。
         プラグインが読み込めていなかった場合など、印だけ残って永久に聞かなくなるのを防ぐ。 */
      if (st !== 'prompt' && localStorage.getItem('koyomi.notifAsked')) return;
      const wait = setInterval(async () => {
        if (!window.DB || !DB.authed) return;
        clearInterval(wait);
        try {
          const P = native();
          if (!P || !P.requestPermission) return;      /* プラグインが無いなら印も付けない */
          localStorage.setItem('koyomi.notifAsked', '1');
          const r = await P.requestPermission();
          window.NOTIF_PERM = (r && r.granted) ? 'granted' : 'denied';
        } catch (e) {}
        sync(true);
      }, 1500);
    } catch (e) {}
  })();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshPerm();
  });
})();
