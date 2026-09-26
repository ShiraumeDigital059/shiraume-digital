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

  /* Capacitor は registerPlugin('Koyomi') を呼んで初めて Plugins に入れてくれる。
     呼ばないと Plugins は空のままなので、ここで一度だけ登録する。 */
  const native = () => {
    try {
      const C = window.Capacitor;
      if (!(C && C.isNativePlatform && C.isNativePlatform())) return null;
      if (C.Plugins && C.Plugins.Koyomi) return C.Plugins.Koyomi;
      if (typeof C.registerPlugin === 'function') {
        if (!window.__KoyomiPlugin) window.__KoyomiPlugin = C.registerPlugin('Koyomi');
        return window.__KoyomiPlugin;
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

  /* ---- 通知を予約する（自分が参加する、これからの予定） ---- */
  function reminderPayload() {
    if (!window.DB || !DB.authed) return [];
    const now = Date.now(), u = me(), tz = effTz(u);
    return DB.events
      .filter(e => e.who.includes(u.id) && e.kind !== 'holiday' && e.start > now
                   && e.start < now + 7 * 86400000)
      .sort((a, b) => a.start - b.start)
      .slice(0, 45)
      .map(e => {
        const lead = (e.rem == null ? 10 : e.rem);
        const at = e.start - lead * 60000;
        if (at <= now + 30000) return null;
        const others = e.who.map(person).filter(p => p && effTz(p) !== tz)
          .map(p => (CITIES[effCity(p)] || {}).flag + ' ' + hhmm(e.start, effTz(p)));
        return {
          id: e.id,
          at: Math.round(at / 1000),
          title: e.title || '予定',
          body: hhmm(e.start, tz) + (e.place ? '　' + e.place : '')
                + (others.length ? '\n' + others.join('　') : '')
        };
      })
      .filter(Boolean);
  }

  /* ---- 終業のお知らせを予約する（これから7日ぶん・休みの日は入れない） ---- */
  function endOfDayPayload() {
    if (!window.DB || !DB.authed) return [];
    if (DB.company && DB.company.notify && DB.company.notify.done === false) return [];
    if (typeof dayWork !== 'function') return [];
    const now = Date.now(), u = me(), tz = effTz(u), out = [];
    for (let i = 0; i < 7; i++) {
      const c = addDays(civil(now, tz), i);
      const ms = zToUTC(c.y, c.m, c.d, 12, 0, tz);          /* その日の正午で判定 */
      if (typeof isDayOff === 'function' && isDayOff(u, ms)) continue;
      const w = dayWork(u, cdow(c));
      if (w.off) continue;
      const [h, mi] = w.e.split(':').map(Number);
      const at = zToUTC(c.y, c.m, c.d, h, mi, tz);
      if (at <= now + 60000) continue;
      out.push({
        id: 'eod-' + c.y + '-' + c.m + '-' + c.d,
        at: Math.round(at / 1000),
        title: '今日はここまで',
        body: 'おつかれさまでした。'
      });
    }
    return out;
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
        const r = reminderPayload().concat(endOfDayPayload())
                    .sort((a, b) => a.at - b.at).slice(0, 55);
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
