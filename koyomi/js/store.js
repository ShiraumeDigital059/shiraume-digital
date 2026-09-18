/* ============================================================
   Koyomi — 保存層（localStorage → Supabase）
   白梅デジタル

   今のアプリは DB というひとつのオブジェクトを持ち、
   変更したら save() を呼ぶ、という作りになっている。
   このファイルはその save() / load() の中身だけを差し替える。
   画面のコードは一切変えなくていい。

   使い方:
     await Store.init(SUPABASE_URL, SUPABASE_ANON_KEY);
     const DB = await Store.pull();          // 起動時
     Store.push(DB);                         // save() から呼ぶ（自動でまとめて送る）
     Store.onRemoteChange(() => { ... });    // 他の人の変更が届いたとき
   ============================================================ */
(function (global) {
  'use strict';

  let sb = null;          // supabase client
  let me = null;          // 自分の members 行
  let companyId = null;
  let snap = null;        // 最後に同期できた状態（差分を出すための控え）
  let pushTimer = null;
  let pushing = false;
  let remoteCb = null;

  /* iOS アプリの中で動いているか */
  function nativePlugin() {
    const C = window.Capacitor;
    return (C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Koyomi)
      ? C.Plugins.Koyomi : null;
  }
  /* Apple サインインのボタンを出してよいか
     iOS アプリ = 常に出す / ブラウザ = config.js で有効にしたときだけ */
  function appleAvailable() {
    if (nativePlugin()) return true;
    return !!window.KOYOMI_APPLE_WEB;
  }

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const iso = (ms) => new Date(ms).toISOString();
  const ms = (s) => Date.parse(s);
  const newId = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 3 | 8)).toString(16);
      }));

  /* ---------- 初期化 ---------- */
  async function init(url, anonKey) {
    if (!url || !anonKey)
      throw new Error('接続設定がまだ済んでいません。config.js に Supabase の URL とキーを書いてください。');
    if (!global.supabase) throw new Error('supabase-js が読み込まれていません');
    sb = global.supabase.createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    return sb;
  }
  const client = () => sb;

  /* 接続設定（config.js）がまだ無いときに、英語のエラーではなく
     日本語で「設定がまだ」と伝えるための番人 */
  function need() {
    if (!sb) throw new Error('接続設定がまだ済んでいません。config.js に Supabase の URL とキーを書いてください。');
    return sb;
  }

  async function session() {
    need();
    const { data } = await sb.auth.getSession();
    return data.session || null;
  }

  /* ---------- 読み込み ---------- */
  async function pull() {
    const s = await session();
    if (!s) return null;                       // 未ログイン

    const { data: m, error: me1 } = await sb
      .from('members').select('*').eq('id', s.user.id).maybeSingle();
    if (me1) throw me1;
    if (!m) return { needsCompany: true };     // ログイン済みだが会社未所属

    me = m; companyId = m.company_id;

    const [company, members, events, evMem, msgs, notifs, logs, audit, invites, plans,
           summary, invoices] =
      await Promise.all([
        sb.from('companies').select('*').eq('id', companyId).single(),
        sb.from('members').select('*').eq('company_id', companyId).order('created_at'),
        sb.from('events').select('*').eq('company_id', companyId).order('starts_at'),
        sb.from('event_members').select('*').eq('company_id', companyId),
        sb.from('messages').select('*').eq('company_id', companyId).order('created_at'),
        sb.from('notifications').select('*').eq('company_id', companyId)
          .order('created_at', { ascending: false }).limit(300),
        sb.from('day_logs').select('*').eq('company_id', companyId),
        sb.from('audit_logs').select('*').eq('company_id', companyId)
          .order('created_at', { ascending: false }).limit(500),
        sb.from('invites').select('*').eq('company_id', companyId),
        sb.from('plans').select('*').order('sort'),
        sb.rpc('billing_summary'),
        sb.from('invoices').select('*').order('issued_at', { ascending: false }).limit(36)
      ]);
    for (const r of [company, members, events, evMem, msgs, notifs, logs, audit, invites, plans]) {
      if (r.error) throw r.error;
    }
    // 請求書は管理者しか読めない。読めなくてもエラーにしない。
    const bill    = summary.error ? null : (summary.data || null);
    const invRows = invoices.error ? [] : (invoices.data || []);

    const whoOf = {};
    evMem.data.forEach(r => (whoOf[r.event_id] = whoOf[r.event_id] || []).push(r.member_id));

    const threads = {}, dms = {};
    msgs.data.forEach(r => {
      const item = { id: r.id, by: r.author_id, at: ms(r.created_at), text: r.body };
      if (r.event_id) (threads[r.event_id] = threads[r.event_id] || []).push(item);
      else (dms[r.dm_key] = dms[r.dm_key] || []).push(item);
    });

    const logMap = {};
    logs.data.forEach(r => {
      (logMap[r.member_id] = logMap[r.member_id] || {})[r.day] = r.body;
    });

    const c = company.data;
    const DB = {
      v: 2,
      demo: false,
      authed: true,
      userId: m.id,
      company: {
        id: c.id, name: c.name, nameEn: c.name_en, tz: c.tz, plan: c.plan,
        joinCode: c.join_code, defaultWork: c.default_work, locPolicy: c.loc_policy,
        notify: c.notify, logo: c.logo_url || undefined,
        setupDone: !!c.setup_done,
        billing: Object.assign({}, c.billing || {}, c.billing_info || {}, {
          contact: c.billing_email || '',
          billTo:  c.billing_name  || '',
          status:  c.billing_status,
          interval: c.billing_interval,
          trialEnds: c.trial_ends_at,
          next: c.period_end ? String(c.period_end).slice(0, 10) : '',
          cancelAtEnd: !!c.cancel_at_period_end,
          seats: c.seats_limit,
          ready: !!c.stripe_customer_id,
          invoices: invRows.map(v => ({
            date: v.issued_at, number: v.number, total: v.total,
            status: v.status, pdf: v.pdf_url || v.hosted_url || ''
          }))
        })
      },
      billing: bill,
      people: members.data.map(p => ({
        id: p.id, name: p.name, nameEn: p.name_en, email: p.email, city: p.city, tz: p.tz,
        dept: p.dept, title: p.title, role: p.role, location: p.location, work: p.work,
        privacy: p.privacy, override: p.override, tripCity: p.trip_city,
        photo: p.photo_url || undefined
      })),
      events: events.data.map(e => ({
        id: e.id, title: e.title, kind: e.kind, start: ms(e.starts_at), end: ms(e.ends_at),
        tz: e.tz, place: e.place, url: e.url, note: e.note, vis: e.vis, rem: e.rem,
        owner: e.owner_id, who: whoOf[e.id] || [], seed: false
      })),
      threads, dms,
      notifs: notifs.data.map(n => ({
        id: n.id, to: n.to_id, by: n.by_id, type: n.type, text: n.body,
        ref: n.ref, day: n.day, at: ms(n.created_at), read: n.read
      })),
      logs: logMap,
      audit: audit.data.map(a => ({
        id: a.id, by: a.by_id, action: a.action, detail: a.detail, at: ms(a.created_at)
      })),
      invites: invites.data.map(i => ({
        id: i.id, email: i.email, dept: i.dept, title: i.title, role: i.role, used: i.used
      })),
      plans: plans.data.map(p => ({
        id: p.id, name: p.name, price: p.price, priceYear: p.price_year,
        seats: p.seats, feat: p.features
      })),
      images: {}, imgVer: 3,
      day: null
    };
    snap = clone(DB);
    return DB;
  }

  /* ---------- 書き込み（差分だけ送る） ---------- */
  function push(DB, immediate) {
    if (!sb || !companyId || !DB || !DB.authed) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => flush(DB), immediate ? 0 : 400);
  }

  async function flush(DB) {
    if (pushing) { push(DB); return; }
    pushing = true;
    try {
      await pushCompany(DB);
      await pushPeople(DB);
      await pushEvents(DB);
      await pushMessages(DB);
      await pushNotifs(DB);
      await pushLogs(DB);
      await pushAudit(DB);
      await pushInvites(DB);
      snap = clone(DB);
    } catch (e) {
      console.error('[Koyomi] 同期に失敗しました', e);
      if (global.toast) global.toast('同期に失敗しました。通信を確認してください');
    } finally {
      pushing = false;
    }
  }

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const byId = (arr) => Object.fromEntries((arr || []).map(x => [x.id, x]));

  async function pushCompany(DB) {
    const a = DB.company, b = snap && snap.company;
    if (b && same(a, b)) return;
    const bi = a.billing || {};
    const { error } = await sb.from('companies').update({
      name: a.name, name_en: a.nameEn || '', tz: a.tz,
      default_work: a.defaultWork, loc_policy: a.locPolicy,
      notify: a.notify, logo_url: a.logo || null,
      setup_done: !!a.setupDone,
      billing_email: bi.contact || null,
      billing_name:  bi.billTo  || null,
      billing_info:  { zip: bi.zip || '', addr: bi.addr || '', tel: bi.tel || '' }
      // plan / billing_status などは Stripe 側が正。ここからは送らない。
    }).eq('id', companyId);
    if (error) throw error;
  }

  async function pushPeople(DB) {
    const cur = byId(DB.people), old = byId(snap && snap.people);
    for (const p of DB.people) {
      if (old[p.id] && same(p, old[p.id])) continue;
      const row = {
        company_id: companyId, name: p.name, name_en: p.nameEn || '', email: p.email,
        city: p.city, tz: p.tz, dept: p.dept || '', title: p.title || '', role: p.role,
        location: p.location, work: p.work, privacy: p.privacy,
        override: p.override || null, trip_city: p.tripCity || null,
        photo_url: p.photo || null
      };
      const { error } = await sb.from('members').update(row).eq('id', p.id);
      if (error) throw error;      // 新規メンバーは join_company RPC 経由でしか増えない
    }
    for (const id of Object.keys(old)) {
      if (!cur[id]) {
        const { error } = await sb.from('members').delete().eq('id', id);
        if (error) throw error;
      }
    }
  }

  async function pushEvents(DB) {
    const cur = byId(DB.events), old = byId(snap && snap.events);
    for (const e of DB.events) {
      const o = old[e.id];
      if (o && same(e, o)) continue;
      const row = {
        id: e.id, company_id: companyId, title: e.title, kind: e.kind,
        starts_at: iso(e.start), ends_at: iso(e.end), tz: e.tz,
        place: e.place || '', url: e.url || '', note: e.note || '',
        vis: e.vis || 'public', rem: e.rem || 0, owner_id: e.owner || null,
        updated_at: new Date().toISOString()
      };
      const { error } = await sb.from('events').upsert(row);
      if (error) throw error;
      const before = new Set((o && o.who) || []);
      const after = new Set(e.who || []);
      const add = [...after].filter(x => !before.has(x));
      const del = [...before].filter(x => !after.has(x));
      if (add.length) {
        const { error: e2 } = await sb.from('event_members')
          .upsert(add.map(m2 => ({ event_id: e.id, member_id: m2, company_id: companyId })));
        if (e2) throw e2;
      }
      if (del.length) {
        const { error: e3 } = await sb.from('event_members')
          .delete().eq('event_id', e.id).in('member_id', del);
        if (e3) throw e3;
      }
    }
    for (const id of Object.keys(old)) {
      if (!cur[id]) {
        const { error } = await sb.from('events').delete().eq('id', id);
        if (error) throw error;
      }
    }
  }

  async function pushMessages(DB) {
    const rows = [];
    Object.entries(DB.threads || {}).forEach(([evId, list]) =>
      list.forEach(m2 => {
        if (m2.id) return;
        m2.id = newId();
        rows.push({ id: m2.id, company_id: companyId, event_id: evId,
                    author_id: m2.by, body: m2.text,
                    created_at: iso(m2.at || Date.now()) });
      }));
    Object.entries(DB.dms || {}).forEach(([key, list]) =>
      list.forEach(m2 => {
        if (m2.id) return;
        m2.id = newId();
        rows.push({ id: m2.id, company_id: companyId, dm_key: key,
                    author_id: m2.by, body: m2.text,
                    created_at: iso(m2.at || Date.now()) });
      }));
    if (!rows.length) return;
    const { error } = await sb.from('messages').insert(rows);
    if (error) throw error;
  }

  async function pushNotifs(DB) {
    const ins = [], upd = [];
    const old = byId(snap && snap.notifs);
    (DB.notifs || []).forEach(n => {
      if (!n.id || !old[n.id]) {
        n.id = n.id || newId();
        if (!old[n.id]) {
          ins.push({ id: n.id, company_id: companyId, to_id: n.to, by_id: n.by || null,
                     type: n.type, body: n.text, ref: n.ref || '', day: n.day || null,
                     read: !!n.read, created_at: iso(n.at || Date.now()) });
          return;
        }
      }
      if (old[n.id] && old[n.id].read !== n.read) upd.push(n);
    });
    if (ins.length) {
      const { error } = await sb.from('notifications').insert(ins);
      if (error) throw error;
    }
    for (const n of upd) {
      const { error } = await sb.from('notifications').update({ read: n.read }).eq('id', n.id);
      if (error) throw error;
    }
  }

  async function pushLogs(DB) {
    const rows = [];
    Object.entries(DB.logs || {}).forEach(([pid, days]) =>
      Object.entries(days).forEach(([day, body]) => {
        const before = snap && snap.logs && snap.logs[pid] && snap.logs[pid][day];
        if (before === body) return;
        rows.push({ member_id: pid, day, company_id: companyId, body,
                    updated_at: new Date().toISOString() });
      }));
    if (!rows.length) return;
    const { error } = await sb.from('day_logs').upsert(rows);
    if (error) throw error;
  }

  async function pushAudit(DB) {
    const rows = (DB.audit || []).filter(a => !a.id).map(a => {
      a.id = newId();
      return { id: a.id, company_id: companyId, by_id: a.by || null,
               action: a.action, detail: a.detail || '', at: undefined,
               created_at: iso(a.at || Date.now()) };
    });
    if (!rows.length) return;
    const { error } = await sb.from('audit_logs').insert(rows);
    if (error) throw error;
  }

  async function pushInvites(DB) {
    const cur = byId(DB.invites), old = byId(snap && snap.invites);
    const rows = (DB.invites || []).filter(i => !old[i.id] || !same(i, old[i.id]))
      .map(i => ({ id: i.id && i.id.length === 36 ? i.id : newId(),
                   company_id: companyId, email: i.email, dept: i.dept || '',
                   title: i.title || '', role: i.role || 'member', used: !!i.used }));
    if (rows.length) {
      const { error } = await sb.from('invites').upsert(rows);
      if (error) throw error;
    }
    for (const id of Object.keys(old)) {
      if (!cur[id]) await sb.from('invites').delete().eq('id', id);
    }
  }

  /* ---------- リアルタイム（他の人の変更を受け取る） ---------- */
  let chan = null;
  function onRemoteChange(cb) {
    remoteCb = cb;
    if (chan || !companyId) return;
    chan = sb.channel('koyomi-' + companyId);
    ['companies','members','events','event_members','messages','notifications','day_logs','invites',
     'subscriptions','invoices']
      .forEach(t => chan.on('postgres_changes',
        { event: '*', schema: 'public', table: t }, debounced));
    chan.subscribe();
  }
  let rTimer = null;
  function debounced() {
    clearTimeout(rTimer);
    rTimer = setTimeout(async () => {
      if (pushing) return debounced();
      try {
        const fresh = await pull();
        if (fresh && remoteCb) remoteCb(fresh);
      } catch (e) { console.error('[Koyomi] 再読み込みに失敗', e); }
    }, 600);
  }

  /* ---------- 認証 ---------- */
  const auth = {
    async signIn(email, password) {
      need();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(jaAuthError(error.message));
    },
    async signUp(email, password) {
      need();
      const { error } = await sb.auth.signUp({ email, password });
      if (error) throw new Error(jaAuthError(error.message));
    },
    async signOut() {
      if (!sb) return;
      if (chan) { sb.removeChannel(chan); chan = null; }
      snap = null; me = null; companyId = null;
      await sb.auth.signOut();
    },
    async resetPassword(email) {
      need();
      // アプリの中は capacitor://localhost なので、戻り先はウェブ上の固定URLにする
      const back = window.KOYOMI_RESET_URL || (location.origin + '/reset.html');
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: back });
      if (error) throw new Error(jaAuthError(error.message));
    },
    /* Apple でサインイン
       iOS アプリ: 端末標準のシートを出して、返ってきた身分証(identityToken)を Supabase に渡す
       ブラウザ  : Apple のページへ飛ばす（戻ってきたら自動でログイン済みになる） */
    async signInWithApple() {
      need();
      const P = nativePlugin();
      if (P) {
        let r;
        try {
          r = await P.signInWithApple();
        } catch (e) {
          const msg = (e && (e.message || e.errorMessage)) || '';
          const code = (e && e.code) || '';
          if (code === 'CANCELED' || /cancel/i.test(msg)) {
            const x = new Error('キャンセルしました'); x.code = 'CANCELED'; throw x;
          }
          throw new Error('Apple でのサインインに失敗しました。' + (msg ? '（' + msg + '）' : ''));
        }
        const { error } = await sb.auth.signInWithIdToken({
          provider: 'apple', token: r.identityToken, nonce: r.nonce
        });
        if (error) throw new Error(jaAuthError(error.message));
        return { name: r.name || '', email: r.email || '' };
      }
      const back = (window.KOYOMI_RESET_URL || (location.origin + '/reset.html'))
                     .replace(/reset\.html$/, '');
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'apple', options: { redirectTo: back }
      });
      if (error) throw new Error(jaAuthError(error.message));
      return null;                      // このあとリダイレクトする
    },
    async createCompany(args) {
      need();
      const { data, error } = await sb.rpc('bootstrap_company', {
        p_company: args.company, p_name: args.name, p_city: args.city, p_tz: args.tz,
        p_title: args.title || '代表', p_dept: args.dept || '',
        p_work_s: args.workS || '09:00', p_work_e: args.workE || '18:00',
        p_plan: args.plan || 'starter'
      });
      if (error) throw new Error(error.message);
      return data;
    },
    async joinCompany(args) {
      need();
      const { data, error } = await sb.rpc('join_company', {
        p_code: (args.code || '').toUpperCase(), p_name: args.name,
        p_city: args.city, p_tz: args.tz,
        p_work_s: args.workS || '09:00', p_work_e: args.workE || '18:00'
      });
      if (error) throw new Error(error.message);
      return data;
    },
    async rotateJoinCode() {
      need();
      const { data, error } = await sb.rpc('rotate_join_code');
      if (error) throw new Error(error.message);
      return data;
    }
  };

  function jaAuthError(msg) {
    const m = (msg || '').toLowerCase();
    if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed'))
      return 'サーバに接続できませんでした。通信環境を確認して、もう一度お試しください。';
    if (m.includes('email not confirmed'))
      return 'メールアドレスの確認が終わっていません。届いたメールのリンクを開いてください。';
    if (m.includes('rate limit') || m.includes('too many'))
      return '試行回数が多すぎます。しばらく待ってからお試しください。';
    if (m.includes('invalid login')) return 'メールアドレスまたはパスワードが違います。';
    if (m.includes('already registered')) return 'このメールアドレスは既に登録されています。';
    if (m.includes('password')) return 'パスワードは8文字以上にしてください。';
    if (m.includes('email')) return 'メールアドレスの形式が正しくありません。';
    return msg;
  }

  /* ---------- お支払い（Stripe） ----------
     カード番号はこのアプリを通りません。Stripe の画面へ行ってもらうだけ。 */
  const billing = {
    /* 申し込み・プラン変更 → Stripe の支払いページのURLを返す */
    async checkout(plan, interval) {
      need();
      const { data, error } = await sb.functions.invoke('billing-checkout', {
        body: { plan, interval: interval === 'year' ? 'year' : 'month' }
      });
      if (error) throw new Error(await fnError(error, 'お申し込みの手続きを始められませんでした。'));
      if (data && data.error) throw new Error(data.error);
      return data;                       // { url } または { changed:true, message }
    },
    /* 支払い方法の変更・請求書・解約 → Stripe の管理ページへ */
    async portal() {
      need();
      const { data, error } = await sb.functions.invoke('billing-portal', {});
      if (error) throw new Error(await fnError(error, 'お支払い情報の画面を開けませんでした。'));
      if (data && data.error) throw new Error(data.error);
      return data;                       // { url }
    },
    /* iPhone アプリの中で買ったレシートを、サーバに確かめてもらう */
    async verifyApple(jwsRepresentation) {
      need();
      const { data, error } = await sb.functions.invoke('verify-iap', {
        body: { jwsRepresentation }
      });
      if (error) throw new Error(await fnError(error, 'お支払いの確認ができませんでした。'));
      if (data && data.error) throw new Error(data.error);
      return data;                       // { ok:true, plan, interval, status, active, expiresDate }
    },
    /* 画面を描き直すための最新の状態 */
    async summary() {
      need();
      const { data, error } = await sb.rpc('billing_summary');
      if (error) throw error;
      return data;
    }
  };

  /* Edge Function のエラーは本文に理由が入っている */
  async function fnError(error, fallback) {
    try {
      if (error && error.context && typeof error.context.json === 'function') {
        const j = await error.context.json();
        if (j && j.error) return j.error;
      }
    } catch (e) {}
    const m = (error && error.message) || '';
    if (/failed to fetch|networkerror|load failed/i.test(m))
      return 'サーバに接続できませんでした。通信環境を確認してください。';
    return fallback;
  }

  /* ---------- 写真・ロゴのアップロード ---------- */
  async function uploadImage(file, path) {
    const key = companyId + '/' + path + '-' + Date.now();
    const { error } = await sb.storage.from('avatars')
      .upload(key, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = sb.storage.from('avatars').getPublicUrl(key);
    return data.publicUrl;
  }

  global.Store = { init, client, session, pull, push, flush, onRemoteChange, auth, billing, uploadImage, newId, appleAvailable };
})(window);
