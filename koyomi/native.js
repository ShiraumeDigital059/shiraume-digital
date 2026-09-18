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

  const native = () =>
    window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()
      ? window.Capacitor.Plugins.Koyomi : null;

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
      .slice(0, 60)
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
        const r = reminderPayload();
        const rj = JSON.stringify(r);
        if (force || rj !== lastR) { lastR = rj; await native().scheduleReminders({ items: r }); }
      } catch (e) { console.warn('[Koyomi] native sync', e); }
    }, 600);
  }

  /* ---- save() に相乗りする ---- */
  const origSave = window.save;
  window.save = function () { origSave.apply(this, arguments); sync(false); };

  /* ---- 起動時・復帰時・1分ごと ---- */
  window.addEventListener('load', () => setTimeout(() => sync(true), 1200));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync(true);
  });
  setInterval(() => sync(false), 60000);

  /* ---- 通知の許可を、最初のログイン後に一度だけ聞く ---- */
  (async () => {
    try {
      if (localStorage.getItem('koyomi.notifAsked')) return;
      const wait = setInterval(async () => {
        if (!window.DB || !DB.authed) return;
        clearInterval(wait);
        localStorage.setItem('koyomi.notifAsked', '1');
        await native().requestPermission();
        sync(true);
      }, 1500);
    } catch (e) {}
  })();
})();
