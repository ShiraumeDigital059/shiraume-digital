/**
 * Shiraume Digital - JP/EN language toggle (all pages).
 *
 * How it works: TEXT maps every Japanese text node (trimmed) to its English
 * translation, shared across all pages. On load we walk the DOM once,
 * remember each matching text node with its original Japanese, and the
 * toggle swaps the stored values in place - switching back to JP is always
 * lossless. The choice persists in localStorage ('shiraume-lang').
 *
 * The English copy is written to carry the brand's Japanese sensibility -
 * quiet refinement, ma (the beauty of space), omotenashi - not just a
 * literal translation.
 *
 * Safe by design for forms: only TEXT NODES and display attributes
 * (alt / aria-label / title / placeholder) are translated. Form `name` and
 * `value` attributes - the data actually submitted by FormSubmit - are
 * never touched, so submissions keep arriving in Japanese as before.
 *
 * Prices: nodes containing "¥" are translated mechanically (〜 → +,
 * ／月 → " / month", （税込） → " (tax incl.)", digit ranges → en dash).
 *
 * NOTE for the next editor: keys are the EXACT trimmed text node content.
 * Fragments split by <br> need one entry per fragment. If you edit
 * Japanese copy in the HTML, update the matching key here.
 */
(function () {
  'use strict';

  var TEXT = {
    /* ================= Shared (nav / CTA / footer) ================= */
    'お問い合わせ': 'Contact',
    'お問い合わせ →': 'Contact →',
    'LINEで友だち追加': 'Add Us on LINE',
    '新世代のデジタルパートナーとして、': 'As a new generation of digital partners,',
    'シンプルで洗練されたデザインと、': 'we deliver quietly refined design',
    '成果につながる支援を提供します。': 'and support that drives real results.',
    'まずは、お気軽にご相談ください。': "Let's start with a conversation.",
    'まずはお気軽にご相談ください。': 'Start with a friendly conversation.',
    'ヒアリングからご提案まで、丁寧に伴走いたします。': "From consultation to proposal, we'll be with you every step of the way.",
    'お客様に最適なプランを、丁寧にご提案いたします。': "We'll carefully propose the plan that fits you best.",
    'あなたのビジネスを、次のステージへ。': 'Take your business to the next stage.',

    /* ================= index.html ================= */
    'ホームページ制作　｜　LP制作　｜　LINE構築': 'Website Creation | Landing Pages | LINE Setup',
    'SNS運用サポート　｜　SEO　｜　AI導入支援': 'SNS Support | SEO | AI Consulting',
    'お問い合わせはこちら': 'Contact Us',
    'ともに、': 'Together,',
    '未来を、作ろう。': "Let's Create the Future.",
    'シンプルで洗練されたデザインと、成果につながる': 'Design rooted in Japanese simplicity and refinement, with results-driven',
    'Web制作・デジタル支援を。新世代のデジタルパートナー。': 'web production and digital support. A new generation of digital partners.',
    'サービスを見る': 'View Services',
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
    'Shiraume Digital、': 'Shiraume Digital —',
    '他社にはない４つの強み': 'Four Strengths That Set Us Apart',
    '日本らしい上品さ': 'Japanese Elegance',
    '余白を活かした、静かで洗練された佇まい。': 'A quiet, refined presence born of ma — the Japanese beauty of space.',
    '伴走型のパートナーシップ': 'Partnership That Walks With You',
    '公開後も、事業の成長にあわせて共に歩む。': 'We keep pace with your business as it grows, even after launch.',
    '成果につながる設計': 'Design Built for Results',
    '見た目だけでなく、事業成果から逆算する。': 'Working backward from business outcomes, not just looks.',
    '誠実な対応': 'Sincere Support',
    '一社一社と丁寧に向き合う姿勢。': 'We meet each client with the sincere care of Japanese omotenashi.',
    '制作実績を見る': 'View Our Works',
    '制作実績': 'Our Works',
    'これまで手がけたプロジェクトの一部をご紹介します。': 'A selection of the projects we have worked on.',
    'コーポレートサイト制作': 'Corporate Website',
    'ブランドサイト制作': 'Brand Website',
    'スマートフォン最適化サイト': 'Mobile-Optimized Website',
    '飲食店・店舗サイト制作': 'Restaurant & Store Website',
    'SNS運用マーケティング': 'SNS Marketing',
    '実績追加予定': 'More Coming Soon',
    '実績をもっと見る': 'See More Works',
    '居酒屋M様 公式サイト制作': 'Izakaya M — Official Website',
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

    /* ================= About.html ================= */
    '想いをカタチに、': 'Shaping Your Vision,',
    'ビジネスを': 'Guiding Your Business',
    '次のステージへ。': 'to the Next Stage.',
    'Web制作だけではなく、お客様のビジネスの成長を支えるデジタルパートナーとして、': 'More than web production — as a digital partner supporting your growth,',
    '一つひとつ丁寧に伴走します。': 'we walk beside you with care at every step.',
    '新世代の': 'A New Generation',
    'デジタルパートナー': 'of Digital Partners',
    'ホームページ制作からLINE公式アカウント構築、AI活用、Webデザイン、運用サポートまで。': 'From website creation to LINE official accounts, AI, web design, and ongoing support.',
    'は、窓口をひとつに、あらゆるデジタル施策をワンストップでサポートします。': ' provides one-stop support for all your digital needs, through a single point of contact.',
    '「作って終わり」にはしません。公開後も専任のスタッフが伴走し、ちょっとした疑問やご相談にも、顔の見える距離感で向き合います。': 'We never "build it and walk away." After launch, dedicated staff stay close at hand — approachable, personal, and ready for even the smallest question.',
    'デジタルの力で、': 'With the power of digital,',
    '挑戦をもっと身近に。': 'bringing new challenges within reach.',
    'WebサイトやAI、LINEなどのデジタルツールを活用し、': 'Using websites, AI, LINE and other digital tools,',
    '企業や店舗がより成長できる環境を提供します。': 'we create an environment where businesses and shops can grow.',
    '地域から、世界へ。': 'From Local Roots to the World.',
    '一つひとつのビジネスの価値を最大限に引き出し、多くの人に選ばれる': 'We draw out the full value of each business,',
    'ブランドづくりをサポートします。': 'and help build brands that people choose.',
    '大切にしている価値観': 'The Values We Hold Dear',
    '必要なものだけを、': 'Only what is needed,',
    '美しく。': 'made beautiful — in the Japanese spirit.',
    '誠実な対応と、': 'Sincere service,',
    '丁寧なものづくり。': 'and craftsmanship with care.',
    '公開して終わりではなく、': 'Launch is not the end —',
    'その先まで支える。': 'we support what comes after.',
    '常に新しい技術と': 'Always embracing new',
    'アイデアを取り入れる。': 'technology and ideas.',
    '選ばれる理由': 'Why Clients Choose Us',
    'デザイン性': 'Design Quality',
    'シンプルで高級感のある、ブランド価値': 'Simple, refined design that elevates',
    'を高めるデザイン。': "your brand's value.",
    '提案力': 'Strategic Proposals',
    '目的や課題に合わせた最適なWeb戦略をご提案。': 'Web strategies tailored to your goals and challenges.',
    'ワンストップ対応': 'One-Stop Service',
    '企画・デザイン・制作・運用まで一貫サポート。': 'Consistent support from planning and design through production and operation.',
    'スピード対応': 'Quick Response',
    '迅速かつ丁寧なコミュニケーションで安心して進められます。': 'Prompt, courteous communication keeps everything moving smoothly.',
    '会社概要': 'Company Profile',
    '会社名': 'Company',
    '事業内容': 'Business',
    'ホームページ制作・Webデザイン・LINE構築・SNS運用・AI導入支援・外国人向け日本語勉強サイト運用・保守運用': 'Website creation, web design, LINE setup, SNS management, AI consulting, a Japanese-learning site for international users, and maintenance',
    '所在地': 'Location',
    '後日追加': 'Coming soon',
    '準備中': 'Coming soon',
    'メール': 'Email',
    '電話番号': 'Phone',
    'ホームページ制作からWeb集客、AI活用までなんでも': 'From websites to web marketing and AI adoption —',
    'お気軽にご相談ください。': 'feel free to talk to us about anything.',

    /* ================= Works.html ================= */
    'こんなサイトが、': 'These are the sites',
    '作れます。': 'we can create.',
    '業種・目的に合わせたショーケースです。実績が増えるごとに、': 'A showcase by industry and purpose. As our portfolio grows,',
    '実際の制作事例へ更新していきます。': "we'll update it with real client projects.",
    'すべて': 'All',
    'スマートフォン最適化': 'Mobile Optimization',
    'SNS運用・マーケティング': 'SNS & Marketing',
    '企業の信頼を伝えるホームページを制作します。': 'Websites that convey corporate trust and credibility.',
    'ブランドデザイン': 'Brand design',
    'スマホ対応': 'Mobile-friendly',
    'SEO設計': 'SEO architecture',
    'おすすめ：新規開業／リニューアルをお考えの企業': 'Best for: new businesses and site renewals',
    'ブランドの世界観を最大限に伝えるWebサイト。': "Websites that fully express your brand's world.",
    'オリジナルデザイン': 'Original design',
    '高級感UI': 'Premium UI',
    'ブランディング設計': 'Brand strategy',
    'おすすめ：アパレル／カフェ／美容サロン／クリエイター': 'Best for: apparel, cafés, beauty salons, creators',
    'スマホで見やすく、使いやすいサイトへ。': 'Sites that are easy to read and use on mobile.',
    'レスポンシブ対応': 'Responsive',
    '表示速度改善': 'Speed optimization',
    'タッチ操作最適化': 'Touch-optimized',
    'おすすめ：モバイル利用が多いすべてのサイト': 'Best for: any site with mobile-heavy traffic',
    'お店の魅力を伝え、来店につなげるホームページ。': "Websites that convey your restaurant's appeal and bring guests through the door.",
    'メニュー掲載': 'Menu pages',
    'Googleマップ連携': 'Google Maps',
    '予約導線': 'Reservation flow',
    'おすすめ：カフェ／レストラン／居酒屋／美容室／整体院': 'Best for: cafés, restaurants, izakaya, salons, clinics',
    'SNSを活用し、認知拡大と集客をサポートします。': 'We use SNS to expand awareness and attract customers.',
    'Instagram運用': 'Instagram management',
    '投稿デザイン': 'Post design',
    'LINE連携': 'LINE integration',
    'おすすめ：集客導線を強化したい店舗・企業': 'Best for: shops and companies strengthening customer acquisition',
    '実績を追加予定': 'More projects coming soon',
    '居酒屋M様 公式Webサイト': 'Izakaya M — Official Website',
    '初めてでも入りやすい店の空気感を、和の温かみあるデザインで表現。公開後3ヶ月で新規予約数 約150%UP、サイトアクセス数 約200%UPを達成しました。': 'A welcoming, first-visit-friendly atmosphere expressed through warm Japanese design. Within three months of launch: new reservations up about 150%, site traffic up about 200%.',
    '飲食店サイト': 'Restaurant site',
    'スマホ最適化': 'Mobile optimization',
    '※守秘のため店名は伏せています。': '* Client name withheld for confidentiality.',
    'あなたのビジネスに合うサイトを、一緒に。': "Together, let's build the right site for your business.",
    '業種・目的に合わせて最適なプランをご提案します。': "We'll propose the best plan for your industry and goals.",

    /* ================= Services.html ================= */
    'ビジネスの成長を支える、': 'Digital solutions that support',
    'デジタルソリューション。': 'the growth of your business.',
    'ホームページ制作からAI活用、運用サポートまで、お客様の課題に合わせた': 'From website creation to AI and ongoing support,',
    '最適なサービスをご提供します。': 'we deliver the services that fit your needs.',
    '企業・店舗・個人事業主向けに、目的やブランドに合わせたオリジナルホームページを制作します。': 'Original websites for companies, shops, and sole proprietors, tailored to your goals and brand.',
    'コーポレートサイト': 'Corporate sites',
    'ブランドサイト': 'Brand sites',
    '飲食店・店舗サイト': 'Restaurant & shop sites',
    'SEO対策': 'SEO',
    '料金を見る': 'See Pricing',
    'LINEを活用した集客やリピーター獲得をサポートします。': 'We help you attract and retain customers through LINE.',
    'リッチメニュー制作': 'Rich menu design',
    '自動応答設定': 'Auto-reply setup',
    'クーポン配信': 'Coupon delivery',
    '予約導線構築': 'Reservation flow',
    '運用サポート': 'Ongoing support',
    'AIを活用し、日々の業務を効率化。時間とコストの削減をサポートします。': 'Streamline daily operations with AI, saving both time and cost.',
    'AI導入サポート': 'AI adoption support',
    '業務自動化': 'Workflow automation',
    'AIチャットボット': 'AI chatbot',
    '活用コンサルティング': 'AI consulting',
    'ブランドイメージを高める、シンプルで高品質なデザインをご提案します。': 'Simple, high-quality design that elevates your brand image.',
    'UI/UXデザイン': 'UI/UX design',
    'バナー制作': 'Banner design',
    'LPデザイン': 'LP design',
    '公開後も安心して運用できるよう、継続的なサポートをご提供します。': 'Ongoing support so you can run your site with confidence after launch.',
    'サイト更新': 'Site updates',
    '保守・管理': 'Maintenance',
    'セキュリティ対策': 'Security',
    'アクセス解析': 'Analytics',
    '改善提案': 'Improvement proposals',
    'ご相談から公開後まで': 'From First Consultation to Launch and Beyond',
    '一貫してサポートします。': 'Consistent support, end to end.',
    '目的やご要望、課題を丁寧にお伺いします。': 'We listen carefully to your goals, requests, and challenges.',
    '最適なプランとお見積りをご提案します。': 'We propose the best plan and estimate.',
    'デザインからコーディングまで一貫して制作します。': 'We handle everything from design to coding.',
    '完成前にご確認いただき、ご要望に応じて修正します。': 'You review before completion, and we revise as requested.',
    '公開後の更新や保守、改善まで継続してサポートします。': 'We continue with updates, maintenance, and improvements after launch.',
    'あなたのビジネスに最適なご提案を。': 'The right proposal for your business.',
    'サービス内容や料金についてのご相談は、お気軽にお問い合わせください。': 'For questions about services or pricing, feel free to get in touch.',

    /* ================= Pricing.html ================= */
    '料金プラン': 'Pricing Plans',
    '掲載の料金はあくまで目安です。最終的なお見積りは、ヒアリング内容に基づいてご案内いたします。': 'Listed prices are a guide. Your final quote is based on our consultation.',
    '個人・小規模店舗向け': 'For individuals & small shops',
    'シンプルなホームページ': 'Simple website',
    'お問い合わせフォーム': 'Contact form',
    '基本SEO設定': 'Basic SEO setup',
    'おすすめ': 'Recommended',
    '企業・店舗向け': 'For companies & shops',
    '5〜8ページ': '5–8 pages',
    'SEO対応': 'SEO ready',
    'Googleマップ': 'Google Maps',
    '集客を重視する方向け': 'For growth-focused businesses',
    '完全オリジナルデザイン': 'Fully custom design',
    'UI/UX設計': 'UI/UX design',
    'SNS導線': 'SNS integration',
    'LINE構築': 'LINE setup',
    'オプション': 'Options',
    'SNS運用': 'SNS Management',
    'AI導入支援': 'AI Consulting',
    'ドメイン取得サポート': 'Domain Registration Support',
    'オプション料金を詳しく見る': 'See Full Options Pricing',
    '※掲載料金は目安です。制作内容やページ数、機能によって料金は変動します。詳しくはお気軽にお問い合わせください。': '* Prices shown are estimates and vary with scope, page count, and features. Please contact us for details.',

    /* ================= Options.html ================= */
    'オプション料金一覧': 'Full Options Pricing',
    '掲載料金は目安です。制作内容や機能に応じてお見積りいたします。': "Prices are estimates; we'll quote based on scope and features.",
    '（税込）〜': ' (tax incl.) +',
    '※ドメイン費用は別途必要です。': '* Domain fees are billed separately.',
    'ホームページの住所となるドメインの選定から取得・設定までサポートします。': "We support everything from choosing your domain — your website's address — to registration and setup.",
    'サポート内容': "What's included",
    '・ドメイン名のご提案': '• Domain name suggestions',
    '・ドメイン取得代行': '• Registration on your behalf',
    '・DNS設定': '• DNS setup',
    '・SSL（https）設定': '• SSL (https) setup',
    '・サーバーとの接続': '• Server connection',
    '・公開までの初期設定': '• Initial setup through launch',
    'ドメイン年間料金の目安': 'Typical annual domain fees',
    'ドメイン': 'Domain',
    '年間料金': 'Annual fee',
    '.co.jp（法人のみ）': '.co.jp (companies only)',
    '※取得会社によって料金は異なります。': '* Fees vary by registrar.',
    'Shiraume Digitalでは、お客様ご本人名義での取得を推奨しています。資産として安心して管理でき、将来的に制作会社を変更する場合もスムーズに運用できます。': 'We recommend registering the domain in your own name. It remains safely yours as an asset, and stays easy to manage even if you ever change production partners.',
    'ページ・機能追加': 'Pages & Features',
    'ページ追加（1ページ）': 'Additional page (per page)',
    'ランディングページ（LP）追加': 'Landing page (LP)',
    'お問い合わせフォーム追加': 'Contact form',
    'ブログ機能追加': 'Blog feature',
    'お知らせ機能追加': 'News & updates feature',
    '飲食店・店舗向け': 'For Restaurants & Shops',
    'レストランメニュー追加・更新': 'Menu additions & updates',
    'メニュー・料金表作成': 'Menu / price list creation',
    'ギャラリー追加': 'Photo gallery',
    'Googleマップ設置': 'Google Maps embed',
    'Instagram・SNS埋め込み': 'Instagram / SNS embed',
    'YouTube埋め込み': 'YouTube embed',
    'LINE関連': 'LINE',
    'LINE公式アカウント初期設定': 'LINE official account initial setup',
    'LINEリッチメニュー制作': 'LINE rich menu design',
    'LINE自動応答設定': 'LINE auto-reply setup',
    'SEO・解析・表示速度': 'SEO, Analytics & Speed',
    'Googleビジネスプロフィール設定': 'Google Business Profile setup',
    'Google Analytics設定': 'Google Analytics setup',
    'Google Search Console設定': 'Google Search Console setup',
    'SEO記事ページ追加': 'SEO article page',
    'サイト表示速度改善': 'Site speed optimization',
    'セキュリティ・サーバー': 'Security & Server',
    'セキュリティ強化': 'Security hardening',
    'SSL設定': 'SSL setup',
    '独自メールアドレス設定（1件）': 'Custom email address (per address)',
    'サーバー契約代行': 'Server contract handling',
    'デザイン・素材制作': 'Design & Assets',
    'バナー制作（1枚）': 'Banner (per piece)',
    'サムネイル制作（1枚）': 'Thumbnail (per piece)',
    'ファビコン作成': 'Favicon',
    'ロゴデータ設置': 'Logo placement',
    'PDF資料掲載': 'PDF documents',
    'ダウンロード資料追加': 'Downloadable materials',
    'ページ追加（コンテンツ系）': 'Content Pages',
    '採用ページ追加': 'Careers page',
    'スタッフ紹介ページ追加': 'Staff page',
    'FAQページ追加': 'FAQ page',
    'お客様の声ページ追加': 'Testimonials page',
    '実績ページ追加': 'Works page',
    'アクセスページ追加': 'Access page',
    '予約・カレンダー': 'Reservations & Calendar',
    '予約ボタン・予約サイト連携': 'Reservation button / booking-site link',
    'カレンダー埋め込み': 'Calendar embed',
    '営業時間・店舗情報更新': 'Hours & shop info updates',
    '画像・演出': 'Images & Effects',
    '画像差し替え（5枚まで）': 'Image replacement (up to 5)',
    '画像加工・切り抜き（1枚）': 'Image editing / cutout (per image)',
    '写真スライダー追加': 'Photo slider',
    'アニメーション追加': 'Animations',
    'スクロール演出追加': 'Scroll effects',
    'ボタンデザイン追加': 'Button design',
    'アイコン追加': 'Icons',
    'SNS・シェア導線': 'SNS & Sharing',
    'SNSシェアボタン設置': 'SNS share buttons',
    'WhatsApp・LINE・電話ボタン設置': 'WhatsApp / LINE / call buttons',
    'QRコード作成': 'QR code',
    '多言語対応': 'Multilingual',
    '多言語対応（1言語追加）': 'Additional language (per language)',
    '英語ページ追加': 'English pages',
    'SNS投稿画像制作（1枚）': 'SNS post image (per image)',
    'SNS運用（月4投稿）': 'SNS management (4 posts/mo)',
    'SNS運用（月8投稿）': 'SNS management (8 posts/mo)',
    'AI導入': 'AI',
    'AIチャットボット導入': 'AI chatbot',
    'AIお問い合わせ自動応答': 'AI inquiry auto-response',
    'AI予約受付サポート': 'AI reservation support',
    'AI業務効率化相談': 'AI efficiency consulting',
    '保守・運用': 'Maintenance',
    'バックアップ設定': 'Backup setup',
    '修正対応（納品後）': 'Revisions (after delivery)',
    '保守・運用（ライト）': 'Maintenance (Light)',
    '保守・運用（スタンダード）': 'Maintenance (Standard)',
    '保守・運用（プレミアム）': 'Maintenance (Premium)',
    '※掲載料金は目安です。制作内容や機能に応じてお見積りいたします。': "* Prices are estimates; final quotes depend on scope and features.",

    /* ================= Contact.html ================= */
    'ホームページ制作、LINE公式アカウント構築、AI導入、Webデザインなど、': 'Website creation, LINE official accounts, AI adoption, web design —',
    'どんな小さなことでもお気軽にお問い合わせください。': 'no question is too small. Feel free to reach out.',
    'ご質問やご相談はメール': 'We also welcome questions',
    'でも受け付けています。': 'and inquiries by email.',
    'お電話': 'Phone',
    'お急ぎの方はお電話でも承ります。': 'In a hurry? Give us a call.',
    '受付時間 9:00〜18:00（土日祝除く）': 'Hours: 9:00–18:00 (excl. weekends & holidays)',
    'LINEで相談': 'Chat on LINE',
    'LINE公式アカウントから': 'Reach us easily through',
    'お気軽にご相談いただけます。': 'our LINE official account.',
    '友だち追加する': 'Add as Friend',
    'ご相談内容をご入力いただくだけでOK。': "Just fill in your details — that's it.",
    'フォームを開く': 'Open the Form',
    'こちらからでも気軽に': "You're welcome to reach",
    'ご相談いただけます。': 'out to us here as well.',
    'プロフィールを見る': 'View Profile',
    'ページを見る': 'View Page',
    'よくあるご質問': 'Frequently Asked Questions',
    '相談だけでも大丈夫ですか？': 'Can I just ask for advice?',
    'はい。ご相談・お見積りは無料です。': 'Yes — consultations and quotes are free.',
    'オンラインで打ち合わせできますか？': 'Can we meet online?',
    'はい。ZoomやGoogle Meetで全国対応しています。': 'Yes. We work with clients everywhere via Zoom and Google Meet.',
    '制作期間はどのくらいですか？': 'How long does production take?',
    '内容によりますが、約2〜6週間が目安です。': 'It depends on scope, but roughly 2–6 weeks.',
    '支払い方法を教えてください。': 'What payment methods do you accept?',
    '銀行振込に対応しております。詳細はお見積り時にご案内いたします。': 'We accept bank transfer. Details are provided with your quote.',
    '公開後の修正やサポートもお願いできますか？': 'Do you handle revisions and support after launch?',
    'はい。公開後の修正や更新も承っております。保守・運用サポートのプランもご用意しております。': 'Yes. We handle post-launch revisions and updates, and offer maintenance plans as well.',
    'ホームページ制作から運用まで、Shiraume Digitalが伴走します。': 'From creation to operation, Shiraume Digital walks with you.',
    '上のフォームから送る': 'Send via the Options Above',

    /* ================= InquiryForm.html ================= */
    'ご希望の分野を選択いただくと、専用のお問い合わせフォームに移動します。': "Select your field and you'll be taken to its dedicated inquiry form.",
    '飲食店（レストラン・居酒屋・カフェ）': 'Restaurants (izakaya, café)',
    '美容（美容室・サロン・ネイル・エステ）': 'Beauty (salons, nails, esthetics)',
    '医療・クリニック': 'Medical & Clinics',
    '不動産': 'Real Estate',
    '建設・工務店': 'Construction',
    '小売・ECサイト': 'Retail & E-commerce',
    'ランディングページ（LP）': 'Landing Pages (LP)',
    'Webアプリ・システム開発': 'Web Apps & Systems',
    'その他': 'Other',
    '分野を選択すると、専用のお問い合わせフォームが新しいタブで開きます。': 'Selecting a field opens its dedicated inquiry form.',
    '選択いただいた分野の専用フォームは、現在準備中です。': 'The dedicated form for this field is being prepared.',
    'お手数ですが、': 'In the meantime, please contact us via ',
    'メール・お電話・LINE': 'email, phone, or LINE',
    'からお気軽にお問い合わせください。': " — we'd be glad to help.",

    /* ================= Inquiry-Restaurant.html ================= */
    '飲食店様向け': 'For Restaurant Owners',
    '飲食店ホームページ制作': 'Restaurant Website',
    'ヒアリングシート': 'Hearing Sheet',
    'この度は、Shiraume Digital Web Divisionをご検討いただきありがとうございます。': 'Thank you for considering Shiraume Digital Web Division.',
    '貴社にとって本当に成果の出るWebサイトを制作するためには、デザインや機能の好みだけでなく、事業の現状・目指すゴール・お客様像まで深く理解する必要があると考えております。': 'To build a website that truly delivers results, we believe we need to deeply understand not only your design and feature preferences, but your business today, your goals, and your customers.',
    '本シートは、そのための「設計図」を一緒に描いていくためのものです。': 'This sheet is how we draw that "blueprint" together.',
    'ご記入いただいた内容をもとに、貴社専用のサイト構成案・デザインの方向性・お見積りをご提案いたします。': "Based on your answers, we'll propose a site structure, design direction, and estimate tailored to you.",
    '全15〜20分程度でご回答いただけます。': 'Takes about 15–20 minutes.',
    'わからない項目は空欄でも構いません。打ち合わせ時に一緒に整理いたします。': "Feel free to leave anything blank — we'll sort it out together in our meeting.",
    'ご記入いただいた内容は、ご提案・お見積り以外の目的では使用いたしません。': 'Your answers are used only for proposals and estimates.',
    '感じたままの本音をご記入ください。': 'Please answer candidly.',
    '基本情報': 'Basic Info',
    'ご連絡先': 'Contact Details',
    '店舗名': 'Restaurant name',
    '必須': 'Required',
    '任意': 'Optional',
    'ご担当者名': 'Contact person',
    'メールアドレス': 'Email address',
    '店舗住所': 'Restaurant address',
    '事業理解': 'Understanding Your Business',
    '貴社の現状・課題・目標を理解し、成果につながるホームページを設計するためのヒアリングです。': 'We ask about your current situation, challenges, and goals to design a website that delivers results.',
    '1. ホームページを制作する目的は何ですか？': '1. What are your goals for the website?',
    '複数選択可': 'Multiple selections allowed',
    '新規のお客様を増やしたい': 'Attract new customers',
    'リピーターを増やしたい': 'Increase repeat visits',
    '予約数を増やしたい': 'Increase reservations',
    'Google検索で見つけてもらいたい': 'Be found on Google',
    'ブランドイメージを向上させたい': 'Improve brand image',
    'お店の雰囲気を伝えたい': "Convey the restaurant's atmosphere",
    'メニューを掲載したい': 'Publish the menu',
    '採用活動に活用したい': 'Use for recruiting',
    '外国人のお客様へ情報を届けたい': 'Reach international customers',
    '2. お店について教えてください。': '2. Tell us about your restaurant.',
    'どのようなお店ですか？': 'What kind of restaurant is it?',
    'コンセプトやこだわり': 'Concept and signature touches',
    '他店にはない強み': "Strengths other restaurants don't have",
    '3. 競合店・参考にしたい店舗を教えてください。': '3. Competitors or restaurants you admire.',
    '3店舗まで。店舗名またはホームページURLをご記入ください。': 'Up to three. Name or website URL.',
    '4. あなたのお店が「選ばれる理由」は何ですか？': '4. Why do customers choose your restaurant?',
    'お客様からよく言われることや、お店ならではの強みを教えてください。': 'What do customers often tell you? What strengths are uniquely yours?',
    '5. ホームページを見た人に、一番最初に伝えたいことは何ですか？': '5. What should visitors feel first on your website?',
    '6. 現在のお店の課題を教えてください。': '6. What challenges does the restaurant face now?',
    '7. ホームページで達成したい目標を教えてください。': '7. What do you want the website to achieve?',
    '8. 来店前のお客様が不安に思うことは何だと思いますか？': '8. What might worry customers before visiting?',
    'ターゲット・ブランドイメージ': 'Target Customers & Brand Image',
    'どのようなお客様に、どのような印象を持っていただきたいのかを理解し、ホームページ全体のデザインや文章の方向性を決定します。': "Understanding who your customers are and how you want to be seen shapes the site's design and writing.",
    '1. 主なお客様はどのような方ですか？': '1. Who are your main customers?',
    '家族連れ': 'Families',
    'カップル': 'Couples',
    '学生': 'Students',
    '会社員': 'Office workers',
    'シニア': 'Seniors',
    '観光客': 'Tourists',
    '外国人': 'International guests',
    '2. お客様にどのような印象を持ってもらいたいですか？': '2. What impression should customers have?',
    '親しみやすい': 'Friendly',
    '高級感': 'Upscale',
    '落ち着いた雰囲気': 'Calm',
    'おしゃれ': 'Stylish',
    '温かみがある': 'Warm',
    '清潔感がある': 'Clean',
    '活気がある': 'Lively',
    '本格的': 'Authentic',
    'カジュアル': 'Casual',
    '3. お店の強み・他店にはない魅力を教えてください。': '3. Your strengths and unique appeal.',
    '4. 希望するホームページのデザインを選んでください。': '4. Choose your preferred design direction.',
    'シンプル': 'Simple',
    '和風': 'Japanese style',
    'モダン': 'Modern',
    '温かみのある': 'Warm-toned',
    'スタイリッシュ': 'Sleek',
    '黒を基調': 'Black-based',
    '白を基調': 'White-based',
    'おまかせ': 'Leave it to us',
    '5. 参考にしたいホームページやInstagramがあれば教えてください。': "5. Websites or Instagram accounts you'd like to reference.",
    'URLまたは店舗名をご記入ください。': 'URL or name.',
    '6. 外国語対応は必要ですか？': '6. Do you need foreign-language support?',
    '日本語のみ': 'Japanese only',
    '英語': 'English',
    '中国語': 'Chinese',
    '韓国語': 'Korean',
    '掲載内容・機能': 'Content & Features',
    'ホームページに掲載する情報や必要な機能を確認し、お客様にとって使いやすいホームページを設計します。': 'We confirm the content and features you need, to design an easy-to-use website.',
    '1. 掲載したいページを選択してください。': '1. Which pages would you like?',
    'トップページ': 'Top page',
    'コンセプト': 'Concept',
    'メニュー': 'Menu',
    '店内写真': 'Interior photos',
    '料理写真': 'Food photos',
    'スタッフ紹介': 'Staff',
    'お支払い方法': 'Payment methods',
    '店舗紹介': 'About the restaurant',
    '営業時間・定休日': 'Hours & closed days',
    '店舗住所・アクセス': 'Address & access',
    '予約': 'Reservations',
    'ブログ・お知らせ': 'Blog & news',
    'SNS（Instagram・TikTok・LINEなど）': 'SNS (Instagram, TikTok, LINE, etc.)',
    '駐車場案内': 'Parking info',
    '採用情報': 'Careers',
    'よくある質問': 'FAQ',
    '2. どの方法で予約を受けたいですか？': '2. How would you like to receive reservations?',
    '電話': 'Phone',
    'ホームページ予約フォーム': 'Website reservation form',
    'Google予約': 'Reserve with Google',
    '食べログ': 'Tabelog',
    'ホットペッパーグルメ': 'Hot Pepper Gourmet',
    '3. 将来的に追加したい機能はありますか？': '3. Features you may want later.',
    'ネット予約': 'Online reservations',
    'EC（通販）': 'E-commerce',
    '会員機能': 'Membership',
    'クーポン配信': 'Coupons',
    '多言語ページ': 'Multilingual pages',
    '求人応募フォーム': 'Job application form',
    'ブログ': 'Blog',
    '制作・公開について': 'Production & Launch',
    'ホームページ制作をスムーズに進めるため、素材・公開時期・ご予算・制作後のサポートについてお伺いします。': 'To keep production smooth, we ask about materials, timing, budget, and post-launch support.',
    '1. ホームページ制作のご予算を教えてください。': '1. What is your budget?',
    '5万円以下': 'Under ¥50,000',
    '5〜10万円': '¥50,000–100,000',
    '10〜20万円': '¥100,000–200,000',
    '20〜30万円': '¥200,000–300,000',
    '30万円以上': 'Over ¥300,000',
    '2. 公開希望日はいつですか？': '2. When would you like to launch?',
    'できるだけ早く': 'As soon as possible',
    '1か月以内': 'Within 1 month',
    '2〜3か月以内': 'Within 2–3 months',
    '未定': 'Undecided',
    '3. 現在ご用意されている素材を教えてください。': '3. What materials do you already have?',
    '店舗ロゴ': 'Logo',
    'スタッフ写真': 'Staff photos',
    'メニュー写真': 'Menu photos',
    '動画': 'Video',
    'まだ用意していない': 'Nothing yet',
    '4. ファイルをアップロードしてください。': '4. Upload files.',
    '例）ロゴ／店内写真／料理写真／メニュー表／動画／その他ホームページに掲載したい素材': 'e.g., Logo / interior photos / food photos / menu / video / other materials',
    '大きい動画ファイルなどは、送信後にメールで直接お送りいただいても構いません。': 'Large files such as videos can also be emailed to us after submitting.',
    '5. 制作後のサポートについて': '5. Post-launch support.',
    '更新・保守サポートを希望する': "I'd like update & maintenance support",
    '必要な時のみ依頼したい': 'Only when needed',
    '自分で更新したい': "I'll update it myself",
    '相談して決めたい': "Let's discuss and decide",
    '6. その他ご要望': '6. Anything else?',
    '送信する': 'Submit',

    /* ================= Inquiry-Thanks.html ================= */
    'ご送信ありがとうございました。': 'Thank you for your submission.',
    'ヒアリングシートを受け付けました。': "We've received your hearing sheet.",
    '内容を確認の上、2営業日以内を目安に担当者よりご連絡いたします。': "We'll review it and get back to you within about two business days.",
    'トップページへ戻る': 'Back to Top'
  };

  /* Attribute-only translations (alt / aria-label / placeholder / title).
     Lookup falls back to TEXT, so shared strings need no duplicates. */
  var ATTR = {
    'メニュー': 'Menu', /* nav hamburger aria-label */
    'コーポレートサイト実績': 'Corporate website project',
    'ブランドサイト実績': 'Brand website project',
    'モバイル対応実績': 'Mobile optimization project',
    '飲食店・店舗サイト実績': 'Restaurant & store website project',
    'SNS運用マーケティング実績': 'SNS marketing project',
    '居酒屋M様 実績': 'Izakaya M project',
    '居酒屋M様 公式Webサイト制作': 'Izakaya M official website',
    '制作の様子': 'Our team at work',
    '地域から世界へ': 'From local to global',
    'Shiraume Digital メンバー': 'Shiraume Digital members',
    '「その他」を選んだ方はこちらにご記入ください': 'If you chose "Other," please specify here',
    '例）スープにこだわっている／接客が丁寧／コストパフォーマンスが高い／落ち着いた雰囲気': 'e.g., Signature soup / attentive service / great value / calm atmosphere',
    '例）清潔感／価格／本格的な味／アットホームな雰囲気': 'e.g., Cleanliness / pricing / authentic flavor / homey atmosphere',
    '例）平日の来店数が少ない／Google検索で表示されない／電話予約しかない／外国人への案内が難しい': 'e.g., Slow weekdays / not showing on Google / phone-only reservations / hard to serve international guests',
    '例）月30件予約を増やしたい／Google検索上位を目指したい／外国人のお客様を増やしたい': 'e.g., +30 reservations a month / rank higher on Google / more international guests',
    '例）入りづらそう／値段が分からない／駐車場があるか分からない／子ども連れでも大丈夫か分からない': 'e.g., Hard to walk in / unclear prices / parking unknown / unsure if kid-friendly',
    '例）自家製スープ／地元食材／接客／ボリューム／コストパフォーマンス': 'e.g., House-made soup / local ingredients / service / portions / value',
    '例）赤を基調にしたい／動画を掲載したい／スマートフォンで見やすくしたい／SEO対策もお願いしたい': 'e.g., Red-based design / include video / mobile-friendly / SEO support'
  };

  /* <title> translations, keyed by the exact Japanese title. Titles already
     in English are left as they are. */
  var TITLES = {
    'Shiraume Digital | ともに、未来を、作ろう。': "Shiraume Digital | Let's Create the Future, Together.",
    'オプション料金一覧 | Shiraume Digital': 'Options & Pricing | Shiraume Digital',
    'お問い合わせフォーム | Shiraume Digital': 'Inquiry Form | Shiraume Digital',
    '飲食店ホームページ制作 ヒアリングシート | Shiraume Digital': 'Restaurant Website Hearing Sheet | Shiraume Digital',
    '送信完了 | Shiraume Digital': 'Thank You | Shiraume Digital'
  };

  var STORAGE_KEY = 'shiraume-lang';

  var buttons = document.querySelectorAll('.nav__lang-btn');
  if (!buttons.length) return; // page without the toggle - do nothing

  var titleJa = document.title;
  var titleEn = TITLES[titleJa] || titleJa;
  var langJa = document.documentElement.getAttribute('lang') || 'ja';

  /* Mechanical translation for price strings (any node containing ¥). */
  function translatePrice(s) {
    return s
      .replace(/／月/g, ' / month')
      .replace(/／30分/g, ' / 30 min')
      .replace(/（税込・ドメイン費用別）/g, ' (tax incl.; domain fee separate)')
      .replace(/（税込）/g, ' (tax incl.)')
      .replace(/(\d)〜(¥?\d)/g, '$1–$2') /* range: ¥1,500〜3,500 → ¥1,500–3,500 */
      .replace(/〜/g, '+');              /* open-ended: ¥5,500〜 → ¥5,500+ */
  }

  var JP_CHARS = /[぀-ヿ㐀-䶿一-鿿！-｠〜・（）｜]/;

  /* Collect every translatable text node once, up front. */
  var entries = [];
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  var node;
  while ((node = walker.nextNode())) {
    var parent = node.parentNode && node.parentNode.nodeName;
    if (parent === 'SCRIPT' || parent === 'STYLE' || parent === 'NOSCRIPT') continue;
    var raw = node.nodeValue;
    var key = raw.trim();
    if (!key) continue;
    var en = null;
    if (Object.prototype.hasOwnProperty.call(TEXT, key)) {
      en = raw.replace(key, TEXT[key]);
    } else if (key.indexOf('¥') !== -1 && JP_CHARS.test(key)) {
      en = raw.replace(key, translatePrice(key));
    }
    if (en !== null) {
      // Japanese needs no space around <br>, but English does: when a
      // responsive <br class="br-mobile/br-desktop"> is hidden by CSS the
      // two fragments would otherwise concatenate ("Vision,Guiding").
      // A trailing space is harmless when the <br> is visible.
      var next = node.nextSibling;
      if (next && next.nodeType === 1 && next.nodeName === 'BR' && !/\s$/.test(en)) {
        en += ' ';
      }
      entries.push({ node: node, ja: raw, en: en });
    }
  }

  /* Collect translatable attributes (display-only; never name/value). */
  var attrEntries = [];
  ['alt', 'aria-label', 'title', 'placeholder'].forEach(function (name) {
    var els = document.querySelectorAll('[' + name + ']');
    Array.prototype.forEach.call(els, function (el) {
      var val = (el.getAttribute(name) || '').trim();
      if (!val) return;
      var en = Object.prototype.hasOwnProperty.call(ATTR, val) ? ATTR[val]
             : Object.prototype.hasOwnProperty.call(TEXT, val) ? TEXT[val]
             : null;
      if (en !== null) {
        attrEntries.push({ el: el, name: name, ja: el.getAttribute(name), en: en });
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

    document.documentElement.setAttribute('lang', en ? 'en' : langJa);
    document.title = en ? titleEn : titleJa;

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.classList.toggle('is-active', (btn.getAttribute('data-lang') === 'en') === en);
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
