/**
 * Shiraume Digital - JP/EN language toggle (currently wired up on the TOP
 * page only; other pages keep the static JP|EN label until their
 * dictionaries are added).
 *
 * How it works: TEXT maps every Japanese text node on the page (trimmed)
 * to its English translation. On load we walk the DOM once, remember each
 * matching text node together with its original Japanese, and the toggle
 * simply swaps the stored values in place - so switching back to JP is
 * always lossless and the layout/markup is never rebuilt. The choice is
 * persisted in localStorage under 'shiraume-lang'.
 *
 * NOTE for the next editor: strings are keyed on the EXACT trimmed text
 * node content. Text nodes split by <br> need one entry per fragment.
 * If you edit Japanese copy in index.html, update the matching key here.
 */
(function () {
  'use strict';

  var TEXT = {
    /* ---- Nav / shared buttons ---- */
    'お問い合わせ': 'Contact',

    /* ---- Stage 1 (intro) ---- */
    'ホームページ制作　｜　LP制作　｜　LINE構築': 'Website Creation | Landing Pages | LINE Setup',
    'SNS運用サポート　｜　SEO　｜　AI導入支援': 'SNS Support | SEO | AI Consulting',
    'お問い合わせはこちら': 'Contact Us',

    /* ---- Stage 2 (hero) ---- */
    'ともに、': 'Together,',
    '未来を、作ろう。': "Let's Create the Future.",
    'シンプルで洗練されたデザインと、成果につながる': 'Simple, sophisticated design and results-driven',
    'Web制作・デジタル支援を。新世代のデジタルパートナー。': 'web production and digital support. A new generation of digital partners.',
    'サービスを見る': 'View Services',
    'LINEで友だち追加': 'Add Us on LINE',

    /* ---- Services ---- */
    'サービス概要': 'Our Services',
    'ホームページ制作からLINE構築、AI活用まで、': 'From website creation to LINE setup and AI adoption,',
    'お客様の課題や目的に合わせて、必要な支援を必要な形でご提供します。': 'we provide the support you need, in the form you need, tailored to your goals.',
    'ホームページ制作': 'Website Creation',
    '集客や採用など目的に合わせた設計と、': 'Purpose-driven design for attracting customers, recruiting and more,',
    '洗練された表現で魅力を伝えます。': 'conveying your appeal with refined expression.',
    'LINE公式アカウント構築': 'LINE Official Account Setup',
    '予約や問い合わせに使える': 'We create customer touchpoints for reservations and inquiries,',
    '顧客接点をつくり、関係を継続します。': 'and keep those relationships growing.',
    'AI導入・業務効率化': 'AI Adoption & Efficiency',
    '問い合わせ対応や日常業務を、': 'Streamline inquiry handling and daily operations',
    '最先端のAI技術で効率化します。': 'with cutting-edge AI technology.',
    'Webデザイン': 'Web Design',
    'ブランドの世界観を大切にした、': "High-quality visuals that honor your brand's",
    '高品質なビジュアルで魅力を伝えます。': 'identity and convey its appeal.',
    '保守・運用サポート': 'Maintenance & Support',
    '公開後の更新や不具合対応まで、': 'From post-launch updates to troubleshooting,',
    '安心の継続サポート体制でお守りします。': 'our ongoing support keeps you covered.',
    'サービス一覧を見る': 'View All Services',

    /* ---- Strengths ---- */
    'Shiraume Digital、': 'Shiraume Digital —',
    '他社にはない４つの強み': 'Four Strengths That Set Us Apart',
    '日本らしい上品さ': 'Japanese Elegance',
    '余白を活かした、静かで洗練された佇まい。': 'A quiet, refined presence that embraces space.',
    '伴走型のパートナーシップ': 'Partnership That Walks With You',
    '公開後も、事業の成長にあわせて共に歩む。': 'We keep pace with your business as it grows, even after launch.',
    '成果につながる設計': 'Design Built for Results',
    '見た目だけでなく、事業成果から逆算する。': 'Working backward from business outcomes, not just looks.',
    '誠実な対応': 'Sincere Support',
    '一社一社と丁寧に向き合う姿勢。': 'We engage carefully and honestly with every client.',
    '制作実績を見る': 'View Our Works',

    /* ---- Works ---- */
    '制作実績': 'Our Works',
    'これまで手がけたプロジェクトの一部をご紹介します。': 'A selection of the projects we have worked on.',
    'コーポレートサイト制作': 'Corporate Website',
    'ブランドサイト制作': 'Brand Website',
    'スマートフォン最適化サイト': 'Mobile-Optimized Website',
    '飲食店・店舗サイト制作': 'Restaurant & Store Website',
    'SNS運用マーケティング': 'SNS Marketing',
    '実績追加予定': 'More Coming Soon',
    '実績をもっと見る': 'See More Works',

    /* ---- Flow ---- */
    '制作の流れ': 'Our Process',
    'ご相談から公開・運用まで。': 'From consultation to launch and beyond.',
    '一つひとつの工程を丁寧に進め、お客様の想いを形にします。': 'We move through each step with care, shaping your vision into reality.',
    'フォーム・LINE・メールからお気軽にご相談ください。': 'Feel free to reach out via form, LINE, or email.',
    'ヒアリング': 'Consultation',
    '目的や課題、ご希望のデザインについて詳しくお伺いします。': 'We listen closely to your goals, challenges, and design preferences.',
    'ご提案・お見積り': 'Proposal & Quote',
    '最適なプランと制作内容、お見積りをご提案します。': 'We propose the best plan, scope of work, and estimate.',
    'デザイン・制作': 'Design & Production',
    'ブランドの魅力を引き出すデザインと、高品質なWebサイトを制作します。': "We build high-quality websites with design that brings out your brand's appeal.",
    'ご確認・修正': 'Review & Revisions',
    '内容をご確認いただき、細かな調整・修正を行います。': 'You review the work, and we make fine adjustments and revisions.',
    '公開・運用サポート': 'Launch & Ongoing Support',
    'サイト公開後も、保守・更新・改善まで継続してサポートします。': 'After launch, we continue supporting maintenance, updates, and improvements.',

    /* ---- CTA ---- */
    'まずは、お気軽にご相談ください。': "Let's start with a conversation.",
    'ヒアリングからご提案まで、丁寧に伴走いたします。': "From consultation to proposal, we'll be with you every step of the way.",

    /* ---- Footer ---- */
    '新世代のデジタルパートナーとして、': 'As a new generation of digital partners,',
    'シンプルで洗練されたデザインと、': 'we deliver simple, sophisticated design',
    '成果につながる支援を提供します。': 'and support that drives real results.'
  };

  /* Translations for attribute values (alt / aria-label). */
  var ATTR = {
    'メニュー': 'Menu',
    'コーポレートサイト実績': 'Corporate website project',
    'ブランドサイト実績': 'Brand website project',
    'モバイル対応実績': 'Mobile optimization project',
    '飲食店・店舗サイト実績': 'Restaurant & store website project',
    'SNS運用マーケティング実績': 'SNS marketing project'
  };

  var TITLE_EN = "Shiraume Digital | Let's Create the Future, Together.";
  var STORAGE_KEY = 'shiraume-lang';

  var buttons = document.querySelectorAll('.nav__lang-btn');
  if (!buttons.length) return; // page without the toggle - do nothing

  var titleJa = document.title;

  /* Collect every translatable text node once, up front. */
  var entries = [];
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  var node;
  while ((node = walker.nextNode())) {
    var parent = node.parentNode && node.parentNode.nodeName;
    if (parent === 'SCRIPT' || parent === 'STYLE' || parent === 'NOSCRIPT') continue;
    var key = node.nodeValue.trim();
    if (key && Object.prototype.hasOwnProperty.call(TEXT, key)) {
      entries.push({
        node: node,
        ja: node.nodeValue,
        en: node.nodeValue.replace(key, TEXT[key])
      });
    }
  }

  /* Collect translatable attributes. */
  var attrEntries = [];
  ['alt', 'aria-label', 'title', 'placeholder'].forEach(function (name) {
    var els = document.querySelectorAll('[' + name + ']');
    Array.prototype.forEach.call(els, function (el) {
      var val = (el.getAttribute(name) || '').trim();
      if (val && Object.prototype.hasOwnProperty.call(ATTR, val)) {
        attrEntries.push({ el: el, name: name, ja: el.getAttribute(name), en: ATTR[val] });
      }
    });
  });

  function setLang(lang) {
    var en = lang === 'en';

    entries.forEach(function (e) {
      e.node.nodeValue = en ? e.en : e.ja;
    });
    attrEntries.forEach(function (a) {
      a.el.setAttribute(a.name, en ? a.en : a.ja);
    });

    document.documentElement.setAttribute('lang', en ? 'en' : 'ja');
    document.title = en ? TITLE_EN : titleJa;

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-lang') === (en ? 'en' : 'ja'));
    });

    try { window.localStorage.setItem(STORAGE_KEY, en ? 'en' : 'ja'); } catch (err) { /* private mode etc. */ }
  }

  Array.prototype.forEach.call(buttons, function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-lang'));
    });
  });

  /* Restore the visitor's previous choice. */
  var saved = null;
  try { saved = window.localStorage.getItem(STORAGE_KEY); } catch (err) { /* ignore */ }
  if (saved === 'en') setLang('en');
})();
