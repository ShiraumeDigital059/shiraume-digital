/* ============================================================
   Koyomi — 接続設定
   このファイルを config.js という名前でコピーして、値を入れてください。

   Supabase ダッシュボード → Project Settings → API
     Project URL      → KOYOMI_SUPABASE_URL
     anon public key  → KOYOMI_SUPABASE_ANON_KEY

   ※ anon key は公開されても大丈夫な鍵です（データは RLS で守られます）。
   ※ service_role key は絶対にここに書かないこと。
   ============================================================ */
window.KOYOMI_SUPABASE_URL      = 'https://ysxvsrixarelqidgegyj.supabase.co';
window.KOYOMI_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzeHZzcml4YXJlbHFpZGdlZ3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzAxNjgsImV4cCI6MjEwNTMwNjE2OH0.A56-S7jr-O7wgGccR-B9Xn_pA91sR-cHniLrCI7jTt8';

/* パスワード再設定のメールから戻ってくるページ。
   アプリの中は capacitor://localhost なので、ウェブ上の固定URLを書きます。 */
window.KOYOMI_RESET_URL = 'https://shiraumedigital.com/koyomi/reset.html';

/* お金を受け取る仕組みを使うか。
   事業者登録・銀行口座・税務情報が済み、Stripe と App Store の商品登録が
   終わってから true にしてください。false のあいだは、
   購入の画面も、期限切れの締め出しも、いっさい出ません（＝無料のアプリ）。 */
window.KOYOMI_SELL = false;

/* ブラウザ版でも「Appleでサインイン」を出すか。
   iPhone アプリでは、この設定に関係なく常に出ます。
   ブラウザでも使うには Apple Developer で Services ID の登録が必要なので、
   まずは false のままで大丈夫です。 */
window.KOYOMI_APPLE_WEB = false;
