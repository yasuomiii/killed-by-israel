/* Gaza – Jeder Mensch zählt
 * Lädt die aktuellen Opferzahlen live und visualisiert sie als Piktogramm-Raster (Canvas, virtualisiert).
 * Datenfluss:  1) Live-API  →  2) data/summary.json (per GitHub Action aktuell gehalten)  →  3) eingebetteter Schnappschuss
 */
(() => {
  'use strict';

  /* ───────────── Konfiguration ───────────── */
  const LIVE_URL  = 'https://data.techforpalestine.org/api/v3/summary.json';
  const LOCAL_URL = 'data/summary.json';
  const FETCH_TIMEOUT_MS = 8000;
  const COUNT_UP_MS = 3000;
  const ZOOM_MS = 1100;

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ───────────── Sprachen & Übersetzungen ───────────── */
  const LANGS = [
    { code: 'de', short: 'DE',   name: 'Deutsch',  locale: 'de-DE' },
    { code: 'en', short: 'EN',   name: 'English',  locale: 'en-GB' },
    { code: 'ar', short: 'AR',   name: 'العربية',  locale: 'ar-u-ca-gregory-nu-latn', rtl: true },
    { code: 'es', short: 'ES',   name: 'Español',  locale: 'es-ES' },
    { code: 'fr', short: 'FR',   name: 'Français', locale: 'fr-FR' },
    { code: 'tr', short: 'TR',   name: 'Türkçe',   locale: 'tr-TR' },
    { code: 'ru', short: 'RU',   name: 'Русский',  locale: 'ru-RU' },
    { code: 'zh', short: '中文', name: '中文',      locale: 'zh-CN' },
  ];

  const T = {
    de: {
      docTitle: 'Gaza – Jeder Mensch zählt',
      metaDesc: 'Dokumentation der gemeldeten Opferzahlen im Gazastreifen seit dem 7. Oktober 2023 – mit live geladenen Daten und einer Visualisierung: eine Figur für jeden getöteten Menschen.',
      langLabel: 'Sprache',
      headline: 'Hinter jeder Zahl steht ein Mensch.',
      eyebrowTpl: '{region} · seit dem {date}',
      regionsLabel: 'Region',
      regionGaza: 'Gaza',
      regionGazaLong: 'Gazastreifen',
      regionWestBank: 'Westjordanland',
      regionLebanon: 'Libanon',
      labelKilled: 'Getötete Menschen',
      labelInjured: 'Verletzte',
      btnKilled: 'Getötete Menschen visualisiert',
      btnInjured: 'Verletzte visualisiert',
      vizTitleInjured: '{n} Verletzte',
      vizSubInjured: 'Eine Figur für jeden Verletzten.',
      rangeInjured: 'Verletzte {a}–{b} von {n}',
      rangeAllInjured: 'Alle {n} Verletzten',
      gridAriaInjured: 'Raster mit {n} Figuren – eine für jeden Verletzten.',
      labelChildren: 'Getötete Kinder',
      labelTotal: 'Getötete Menschen insgesamt',
      byIsrael: 'von [[Israel]]',
      btnChildren: 'Getötete Kinder visualisiert',
      btnTotal: 'Alle Opfer visualisiert',
      btnClose: 'Visualisierung schließen',
      loading: 'Daten werden geladen …',
      error: 'Die Daten konnten gerade nicht geladen werden.',
      retry: 'Erneut versuchen',
      stand: 'Stand',
      vizTitleTotal: '{n} getötete Menschen',
      vizTitleChildren: '{n} getötete Kinder',
      close: 'Schließen',
      vizSubTotal: 'Eine Figur für jeden Menschen.',
      vizSubChildren: 'Eine Figur für jedes Kind.',
      rangeTotal: 'Getötete Menschen {a}–{b} von {n}',
      rangeChildren: 'Getötete Kinder {a}–{b} von {n}',
      rangeAllTotal: 'Alle {n} getöteten Menschen',
      rangeAllChildren: 'Alle {n} getöteten Kinder',
      gridAriaTotal: 'Raster mit {n} Figuren – eine für jeden getöteten Menschen.',
      gridAriaChildren: 'Raster mit {n} Figuren – eine für jedes getötete Kind.',
      zoom: 'Zoom',
      zoomIn: 'Hineinzoomen',
      zoomOut: 'Herauszoomen',
      sourceLabel: 'Quelle:',
      sourceRest: '· vom Gesundheitsministerium in Gaza gemeldete Zahlen.',
      footSmall: 'Gemeldete Zahlen; Vermisste und noch nicht identifizierte Tote sind darin nicht enthalten. Die Werte werden bei jedem Seitenaufruf neu geladen.',
    },
    en: {
      docTitle: 'Gaza – Every Life Counts',
      metaDesc: 'Documentation of the reported casualty figures in the Gaza Strip since 7 October 2023 – with live-loaded data and a visualisation: one figure for every person killed.',
      langLabel: 'Language',
      headline: 'Behind every number is a human being.',
      eyebrowTpl: '{region} · since {date}',
      regionsLabel: 'Region',
      regionGaza: 'Gaza',
      regionGazaLong: 'Gaza Strip',
      regionWestBank: 'West Bank',
      regionLebanon: 'Lebanon',
      labelKilled: 'People killed',
      labelInjured: 'People injured',
      btnKilled: 'People killed, visualised',
      btnInjured: 'People injured, visualised',
      vizTitleInjured: '{n} people injured',
      vizSubInjured: 'One figure for every injured person.',
      rangeInjured: 'People injured {a}–{b} of {n}',
      rangeAllInjured: 'All {n} people injured',
      gridAriaInjured: 'Grid of {n} figures, one for each person injured.',
      labelChildren: 'Children killed',
      labelTotal: 'Total people killed',
      byIsrael: 'by [[Israel]]',
      btnChildren: 'Children killed, visualised',
      btnTotal: 'All victims, visualised',
      btnClose: 'Close visualisation',
      loading: 'Loading data …',
      error: 'The data could not be loaded right now.',
      retry: 'Try again',
      stand: 'As of',
      vizTitleTotal: '{n} people killed',
      vizTitleChildren: '{n} children killed',
      close: 'Close',
      vizSubTotal: 'One figure for every person.',
      vizSubChildren: 'One figure for every child.',
      rangeTotal: 'People killed {a}–{b} of {n}',
      rangeChildren: 'Children killed {a}–{b} of {n}',
      rangeAllTotal: 'All {n} people killed',
      rangeAllChildren: 'All {n} children killed',
      gridAriaTotal: 'Grid of {n} figures, one for each person killed.',
      gridAriaChildren: 'Grid of {n} figures, one for each child killed.',
      zoom: 'Zoom',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      sourceLabel: 'Source:',
      sourceRest: '· figures reported by the Gaza Ministry of Health.',
      footSmall: 'Reported figures; missing persons and unidentified dead are not included. Values are reloaded on every visit.',
    },
    ar: {
      docTitle: 'غزة – كل إنسان يُحتسب',
      metaDesc: 'توثيق لأعداد الضحايا المُعلَن عنها في قطاع غزة منذ 7 أكتوبر 2023 – ببيانات تُحمَّل مباشرة وتصوّر بصري: شكل واحد لكل إنسان قُتل.',
      langLabel: 'اللغة',
      headline: 'خلف كل رقم إنسان.',
      eyebrowTpl: '{region} · منذ {date}',
      regionsLabel: 'المنطقة',
      regionGaza: 'غزة',
      regionGazaLong: 'قطاع غزة',
      regionWestBank: 'الضفة الغربية',
      regionLebanon: 'لبنان',
      labelKilled: 'القتلى',
      labelInjured: 'الجرحى',
      btnKilled: 'القتلى مُجسَّدون بصريًا',
      btnInjured: 'الجرحى مُجسَّدون بصريًا',
      vizTitleInjured: '{n} من الجرحى',
      vizSubInjured: 'شكل واحد لكل جريح.',
      rangeInjured: 'الجرحى {a}–{b} من {n}',
      rangeAllInjured: 'جميع الجرحى ({n})',
      gridAriaInjured: 'شبكة من {n} شكلًا، واحد لكل جريح.',
      labelChildren: 'الأطفال القتلى',
      labelTotal: 'إجمالي القتلى',
      byIsrael: 'على يد [[إسرائيل]]',
      btnChildren: 'الأطفال القتلى مُجسَّدون بصريًا',
      btnTotal: 'جميع الضحايا مُجسَّدون بصريًا',
      btnClose: 'إغلاق التصوّر البصري',
      loading: 'جارٍ تحميل البيانات …',
      error: 'تعذّر تحميل البيانات حاليًا.',
      retry: 'أعد المحاولة',
      stand: 'آخر تحديث',
      vizTitleTotal: '{n} من القتلى',
      vizTitleChildren: '{n} من الأطفال القتلى',
      close: 'إغلاق',
      vizSubTotal: 'شكل واحد لكل إنسان.',
      vizSubChildren: 'شكل واحد لكل طفل.',
      rangeTotal: 'القتلى {a}–{b} من {n}',
      rangeChildren: 'الأطفال القتلى {a}–{b} من {n}',
      rangeAllTotal: 'جميع القتلى ({n})',
      rangeAllChildren: 'جميع الأطفال القتلى ({n})',
      gridAriaTotal: 'شبكة من {n} شكلًا، واحد لكل شخص قُتل.',
      gridAriaChildren: 'شبكة من {n} شكلًا، واحد لكل طفل قُتل.',
      zoom: 'التكبير',
      zoomIn: 'تكبير',
      zoomOut: 'تصغير',
      sourceLabel: 'المصدر:',
      sourceRest: '· أرقام صادرة عن وزارة الصحة في غزة.',
      footSmall: 'أرقام مُعلَن عنها؛ لا تشمل المفقودين ولا القتلى الذين لم تُحدَّد هوياتهم. تُحمَّل القيم من جديد عند كل زيارة.',
    },
    es: {
      docTitle: 'Gaza – Cada vida cuenta',
      metaDesc: 'Documentación de las cifras de víctimas comunicadas en la Franja de Gaza desde el 7 de octubre de 2023, con datos cargados en directo y una visualización: una figura por cada persona fallecida.',
      langLabel: 'Idioma',
      headline: 'Detrás de cada cifra hay una persona.',
      eyebrowTpl: '{region} · desde el {date}',
      regionsLabel: 'Región',
      regionGaza: 'Gaza',
      regionGazaLong: 'Franja de Gaza',
      regionWestBank: 'Cisjordania',
      regionLebanon: 'Líbano',
      labelKilled: 'Personas muertas',
      labelInjured: 'Personas heridas',
      btnKilled: 'Personas muertas, visualizadas',
      btnInjured: 'Personas heridas, visualizadas',
      vizTitleInjured: '{n} personas heridas',
      vizSubInjured: 'Una figura por cada persona herida.',
      rangeInjured: 'Personas heridas {a}–{b} de {n}',
      rangeAllInjured: 'Las {n} personas heridas',
      gridAriaInjured: 'Cuadrícula de {n} figuras, una por cada persona herida.',
      labelChildren: 'Niños muertos',
      labelTotal: 'Total de personas muertas',
      byIsrael: 'por [[Israel]]',
      btnChildren: 'Niños muertos, visualizados',
      btnTotal: 'Todas las víctimas, visualizadas',
      btnClose: 'Cerrar visualización',
      loading: 'Cargando datos …',
      error: 'No se pudieron cargar los datos.',
      retry: 'Reintentar',
      stand: 'Actualizado a',
      vizTitleTotal: '{n} personas muertas',
      vizTitleChildren: '{n} niños muertos',
      close: 'Cerrar',
      vizSubTotal: 'Una figura por cada persona.',
      vizSubChildren: 'Una figura por cada niño.',
      rangeTotal: 'Personas muertas {a}–{b} de {n}',
      rangeChildren: 'Niños muertos {a}–{b} de {n}',
      rangeAllTotal: 'Las {n} personas muertas',
      rangeAllChildren: 'Los {n} niños muertos',
      gridAriaTotal: 'Cuadrícula de {n} figuras, una por cada persona muerta.',
      gridAriaChildren: 'Cuadrícula de {n} figuras, una por cada niño muerto.',
      zoom: 'Zoom',
      zoomIn: 'Acercar',
      zoomOut: 'Alejar',
      sourceLabel: 'Fuente:',
      sourceRest: '· cifras comunicadas por el Ministerio de Salud de Gaza.',
      footSmall: 'Cifras comunicadas; no incluyen a las personas desaparecidas ni a los fallecidos sin identificar. Los valores se cargan de nuevo en cada visita.',
    },
    fr: {
      docTitle: 'Gaza – Chaque vie compte',
      metaDesc: 'Documentation des chiffres de victimes déclarés dans la bande de Gaza depuis le 7 octobre 2023, avec des données chargées en direct et une visualisation : une figure pour chaque personne tuée.',
      langLabel: 'Langue',
      headline: 'Derrière chaque chiffre se trouve un être humain.',
      eyebrowTpl: '{region} · depuis le {date}',
      regionsLabel: 'Région',
      regionGaza: 'Gaza',
      regionGazaLong: 'Bande de Gaza',
      regionWestBank: 'Cisjordanie',
      regionLebanon: 'Liban',
      labelKilled: 'Personnes tuées',
      labelInjured: 'Personnes blessées',
      btnKilled: 'Personnes tuées, visualisées',
      btnInjured: 'Personnes blessées, visualisées',
      vizTitleInjured: '{n} personnes blessées',
      vizSubInjured: 'Une figure pour chaque personne blessée.',
      rangeInjured: 'Personnes blessées {a}–{b} sur {n}',
      rangeAllInjured: 'Les {n} personnes blessées',
      gridAriaInjured: 'Grille de {n} figures, une pour chaque personne blessée.',
      labelChildren: 'Enfants tués',
      labelTotal: 'Total des personnes tuées',
      byIsrael: 'par [[Israël]]',
      btnChildren: 'Enfants tués, visualisés',
      btnTotal: 'Toutes les victimes, visualisées',
      btnClose: 'Fermer la visualisation',
      loading: 'Chargement des données …',
      error: 'Les données n’ont pas pu être chargées.',
      retry: 'Réessayer',
      stand: 'Mis à jour le',
      vizTitleTotal: '{n} personnes tuées',
      vizTitleChildren: '{n} enfants tués',
      close: 'Fermer',
      vizSubTotal: 'Une figure pour chaque personne.',
      vizSubChildren: 'Une figure pour chaque enfant.',
      rangeTotal: 'Personnes tuées {a}–{b} sur {n}',
      rangeChildren: 'Enfants tués {a}–{b} sur {n}',
      rangeAllTotal: 'Les {n} personnes tuées',
      rangeAllChildren: 'Les {n} enfants tués',
      gridAriaTotal: 'Grille de {n} figures, une pour chaque personne tuée.',
      gridAriaChildren: 'Grille de {n} figures, une pour chaque enfant tué.',
      zoom: 'Zoom',
      zoomIn: 'Zoom avant',
      zoomOut: 'Zoom arrière',
      sourceLabel: 'Source :',
      sourceRest: '· chiffres communiqués par le ministère de la Santé de Gaza.',
      footSmall: 'Chiffres déclarés ; les disparus et les morts non identifiés n’y figurent pas. Les valeurs sont rechargées à chaque visite.',
    },
    tr: {
      docTitle: 'Gazze – Her can önemlidir',
      metaDesc: '7 Ekim 2023’ten bu yana Gazze Şeridi’nde bildirilen can kaybı rakamlarının belgelenmesi – canlı yüklenen veriler ve bir görselleştirme: öldürülen her insan için bir figür.',
      langLabel: 'Dil',
      headline: 'Her rakamın ardında bir insan var.',
      eyebrowTpl: '{region} · {date}’ten beri',
      regionsLabel: 'Bölge',
      regionGaza: 'Gazze',
      regionGazaLong: 'Gazze Şeridi',
      regionWestBank: 'Batı Şeria',
      regionLebanon: 'Lübnan',
      labelKilled: 'Öldürülen kişiler',
      labelInjured: 'Yaralanan kişiler',
      btnKilled: 'Öldürülen kişiler görselleştirildi',
      btnInjured: 'Yaralananlar görselleştirildi',
      vizTitleInjured: '{n} kişi yaralandı',
      vizSubInjured: 'Her yaralı için bir figür.',
      rangeInjured: 'Yaralananlar {a}–{b} / {n}',
      rangeAllInjured: 'Yaralanan {n} kişinin tamamı',
      gridAriaInjured: '{n} figürlük ızgara; yaralanan her kişi için bir figür.',
      labelChildren: 'Öldürülen çocuklar',
      labelTotal: 'Öldürülen toplam kişi',
      byIsrael: '[[İsrail]] tarafından',
      btnChildren: 'Öldürülen çocuklar görselleştirildi',
      btnTotal: 'Tüm kurbanlar görselleştirildi',
      btnClose: 'Görselleştirmeyi kapat',
      loading: 'Veriler yükleniyor …',
      error: 'Veriler şu anda yüklenemedi.',
      retry: 'Tekrar dene',
      stand: 'Güncelleme',
      vizTitleTotal: '{n} kişi öldürüldü',
      vizTitleChildren: '{n} çocuk öldürüldü',
      close: 'Kapat',
      vizSubTotal: 'Her insan için bir figür.',
      vizSubChildren: 'Her çocuk için bir figür.',
      rangeTotal: 'Öldürülen kişiler {a}–{b} / {n}',
      rangeChildren: 'Öldürülen çocuklar {a}–{b} / {n}',
      rangeAllTotal: 'Öldürülen {n} kişinin tamamı',
      rangeAllChildren: 'Öldürülen {n} çocuğun tamamı',
      gridAriaTotal: '{n} figürlük ızgara; öldürülen her insan için bir figür.',
      gridAriaChildren: '{n} figürlük ızgara; öldürülen her çocuk için bir figür.',
      zoom: 'Yakınlaştırma',
      zoomIn: 'Yakınlaştır',
      zoomOut: 'Uzaklaştır',
      sourceLabel: 'Kaynak:',
      sourceRest: '· Gazze Sağlık Bakanlığı’nın bildirdiği rakamlar.',
      footSmall: 'Bildirilen rakamlar; kayıplar ve kimliği belirlenemeyen ölüler dahil değildir. Değerler her ziyarette yeniden yüklenir.',
    },
    ru: {
      docTitle: 'Газа – Каждая жизнь важна',
      metaDesc: 'Документация по сообщённым данным о жертвах в секторе Газа с 7 октября 2023 года – с актуальными данными и визуализацией: одна фигурка на каждого погибшего.',
      langLabel: 'Язык',
      headline: 'За каждой цифрой стоит человек.',
      eyebrowTpl: '{region} · с {date}',
      regionsLabel: 'Регион',
      regionGaza: 'Газа',
      regionGazaLong: 'Сектор Газа',
      regionWestBank: 'Западный берег',
      regionLebanon: 'Ливан',
      labelKilled: 'Убитые',
      labelInjured: 'Раненые',
      btnKilled: 'Убитые — визуализированы',
      btnInjured: 'Раненые — визуализированы',
      vizTitleInjured: '{n} раненых',
      vizSubInjured: 'Одна фигурка — на каждого раненого.',
      rangeInjured: 'Раненые {a}–{b} из {n}',
      rangeAllInjured: 'Все {n} раненых',
      gridAriaInjured: 'Сетка из {n} фигурок — по одной на каждого раненого.',
      labelChildren: 'Убитые дети',
      labelTotal: 'Всего убитых',
      byIsrael: '[[Израилем]]',
      btnChildren: 'Убитые дети — визуализированы',
      btnTotal: 'Все жертвы — визуализированы',
      btnClose: 'Закрыть визуализацию',
      loading: 'Загрузка данных …',
      error: 'Не удалось загрузить данные.',
      retry: 'Повторить',
      stand: 'Данные на',
      vizTitleTotal: '{n} убитых',
      vizTitleChildren: '{n} убитых детей',
      close: 'Закрыть',
      vizSubTotal: 'Одна фигурка — на каждого человека.',
      vizSubChildren: 'Одна фигурка — на каждого ребёнка.',
      rangeTotal: 'Убитые {a}–{b} из {n}',
      rangeChildren: 'Убитые дети {a}–{b} из {n}',
      rangeAllTotal: 'Все {n} убитых',
      rangeAllChildren: 'Все {n} убитых детей',
      gridAriaTotal: 'Сетка из {n} фигурок — по одной на каждого убитого человека.',
      gridAriaChildren: 'Сетка из {n} фигурок — по одной на каждого убитого ребёнка.',
      zoom: 'Масштаб',
      zoomIn: 'Приблизить',
      zoomOut: 'Отдалить',
      sourceLabel: 'Источник:',
      sourceRest: '· данные, опубликованные Министерством здравоохранения Газы.',
      footSmall: 'Сообщённые данные; пропавшие без вести и неопознанные погибшие не учтены. Значения загружаются заново при каждом посещении.',
    },
    zh: {
      docTitle: '加沙——每一个生命都重要',
      metaDesc: '记录自2023年10月7日以来加沙地带已公布的遇难人数——实时加载数据，并以图示呈现：每一位遇难者对应一个人形。',
      langLabel: '语言',
      headline: '每一个数字背后，都是一个人。',
      eyebrowTpl: '{region} · 自{date}起',
      regionsLabel: '地区',
      regionGaza: '加沙',
      regionGazaLong: '加沙地带',
      regionWestBank: '约旦河西岸',
      regionLebanon: '黎巴嫩',
      labelKilled: '遇难者',
      labelInjured: '受伤者',
      btnKilled: '遇难者已可视化',
      btnInjured: '受伤者已可视化',
      vizTitleInjured: '{n} 人受伤',
      vizSubInjured: '每名伤者对应一个人形。',
      rangeInjured: '伤者 {a}–{b}，共 {n}',
      rangeAllInjured: '全部 {n} 名伤者',
      gridAriaInjured: '共 {n} 个人形的网格，每名伤者一个。',
      labelChildren: '遇难儿童',
      labelTotal: '遇难者总数',
      byIsrael: '[[以色列]]造成的',
      btnChildren: '遇难儿童已可视化',
      btnTotal: '全部遇难者已可视化',
      btnClose: '关闭可视化',
      loading: '正在加载数据…',
      error: '暂时无法加载数据。',
      retry: '重试',
      stand: '截至',
      vizTitleTotal: '{n} 人遇难',
      vizTitleChildren: '{n} 名儿童遇难',
      close: '关闭',
      vizSubTotal: '每个人对应一个人形。',
      vizSubChildren: '每名儿童对应一个人形。',
      rangeTotal: '遇难者 {a}–{b}，共 {n}',
      rangeChildren: '遇难儿童 {a}–{b}，共 {n}',
      rangeAllTotal: '全部 {n} 名遇难者',
      rangeAllChildren: '全部 {n} 名遇难儿童',
      gridAriaTotal: '共 {n} 个人形的网格，每位遇难者一个。',
      gridAriaChildren: '共 {n} 个人形的网格，每名遇难儿童一个。',
      zoom: '缩放',
      zoomIn: '放大',
      zoomOut: '缩小',
      sourceLabel: '来源：',
      sourceRest: '· 加沙卫生部公布的数字。',
      footSmall: '已公布的数字；不含失踪者和尚未确认身份的遇难者。每次访问时都会重新加载数值。',
    },
  };

  let L = LANGS[0];
  let nf = new Intl.NumberFormat(L.locale);
  let dateFmt = new Intl.DateTimeFormat(L.locale, { day: 'numeric', month: 'long', year: 'numeric' });

  function t(key, vars) {
    let s = (T[L.code] && T[L.code][key]) || T.de[key] || key;
    if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
    return s;
  }

  /* ───────────── Kennzahlen & Regionen ───────────── */
  const STATS = {
    children: { label: 'labelChildren', btn: 'btnChildren', title: 'vizTitleChildren', sub: 'vizSubChildren', range: 'rangeChildren', all: 'rangeAllChildren', aria: 'gridAriaChildren', kinds: ['boy', 'girl'],   adult: false },
    total:    { label: 'labelTotal',    btn: 'btnTotal',    title: 'vizTitleTotal',    sub: 'vizSubTotal',    range: 'rangeTotal',    all: 'rangeAllTotal',    aria: 'gridAriaTotal',    kinds: ['man', 'woman'],   adult: true },
    killed:   { label: 'labelKilled',   btn: 'btnKilled',   title: 'vizTitleTotal',    sub: 'vizSubTotal',    range: 'rangeTotal',    all: 'rangeAllTotal',    aria: 'gridAriaTotal',    kinds: ['man', 'woman'],   adult: true },
    injured:  { label: 'labelInjured',  btn: 'btnInjured',  title: 'vizTitleInjured',  sub: 'vizSubInjured',  range: 'rangeInjured',  all: 'rangeAllInjured',  aria: 'gridAriaInjured',  kinds: ['man', 'woman'],   adult: true },
  };
  // start = Beginn der Zählung (laut Dokumentation der Quelle); stats = linke und rechte Kennzahl
  const REGIONS = {
    gaza:     { name: 'regionGazaLong', start: '2023-10-07', stats: ['children', 'total'] },
    westbank: { name: 'regionWestBank', start: '2023-10-07', stats: ['killed', 'injured'] },
    lebanon:  { name: 'regionLebanon',  start: '2023-10-08', stats: ['killed', 'injured'] },
  };

  /* ───────────── Daten laden ───────────── */
  const num = x => { const n = Number(x); return Number.isFinite(n) && n >= 0 ? Math.round(n) : null; };

  function parseSummary(json) {
    const g = json && json.gaza;
    const total = num(g && g.killed && g.killed.total);
    const children = num(g && g.killed && g.killed.children);
    if (total === null || children === null || total <= 0 || children > total) throw new Error('Unerwartetes Datenformat');
    const data = { gaza: { total, children, date: g.last_update || null } };
    [['westbank', 'west_bank'], ['lebanon', 'lebanon']].forEach(([key, src]) => {
      const r = json[src];
      const killed = num(r && r.killed && r.killed.total);
      const injured = num(r && r.injured && r.injured.total);
      if (killed !== null && injured !== null) data[key] = { killed, injured, date: r.last_update || null };
    });
    return data;
  }

  async function fetchJson(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadData() {
    try { return parseSummary(await fetchJson(LIVE_URL)); }
    catch (e) { console.warn('Live-Abruf fehlgeschlagen:', e.message); }

    try { return parseSummary(await fetchJson(LOCAL_URL)); }
    catch (e) { console.warn('Lokale Kopie nicht verfügbar:', e.message); }

    if (window.__FALLBACK_DATA__) return parseSummary(window.__FALLBACK_DATA__);
    throw new Error('Keine Datenquelle erreichbar');
  }

  /* ───────────── Zahlen, Status & Region ───────────── */
  const slots = $$('.stat').map(el => ({
    el, key: el.dataset.slot, statKey: null,
    num: $('.stat__num', el), btn: $('.btn', el), kind: $('.stat__kind', el),
  }));
  const statusEl = $('#status');
  const eyebrowEl = $('#eyebrow');
  const regionsNav = $('#regions');
  const regionItems = $$('.regions__item', regionsNav);
  const counting = { left: false, right: false };
  let DATA = null;
  let R = 'gaza';                      // aktuelle Region
  let statusMode = 'loading';          // 'loading' | 'ready' | 'error'

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    return isNaN(d) ? iso : dateFmt.format(d);
  }

  const easeOutExpo = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

  function countUp(slot, to, delay = 0) {
    const el = slot.num;
    el.setAttribute('aria-label', nf.format(to));
    if (REDUCED) { el.textContent = nf.format(to); return; }
    const run = ++slot.run || (slot.run = 1);
    counting[slot.key] = true;
    el.textContent = nf.format(0);
    const start = performance.now() + delay;
    function frame(now) {
      if (slot.run !== run) return;                       // von einer neueren Animation abgelöst
      const x = Math.min(1, Math.max(0, (now - start) / COUNT_UP_MS));
      el.textContent = nf.format(Math.round(to * easeOutExpo(x)));
      if (x < 1) requestAnimationFrame(frame); else counting[slot.key] = false;
    }
    requestAnimationFrame(frame);
  }

  function renderStatus() {
    statusEl.removeAttribute('data-i18n');
    statusEl.textContent = '';
    if (statusMode === 'loading') {
      statusEl.setAttribute('data-i18n', 'loading');
      statusEl.textContent = t('loading');
    } else if (statusMode === 'error') {
      statusEl.append(t('error') + ' ');
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = t('retry');
      retry.addEventListener('click', init);
      statusEl.appendChild(retry);
    } else {
      const d = formatDate(DATA[R].date);
      statusEl.textContent = d ? t('stand') + ': ' + d : '\u00a0';
    }
  }

  /* Überschrift („Region · seit …“), Beschriftungen, Buttons, Zahlen und Stand passend zur Region */
  function renderRegion(count, delay = 500) {
    const reg = REGIONS[R];
    eyebrowEl.textContent = t('eyebrowTpl', { region: t(reg.name), date: formatDate(reg.start) });
    slots.forEach((s, i) => {
      s.statKey = reg.stats[i];
      s.btn.dataset.mode = s.statKey;
      s.kind.dataset.i18n = STATS[s.statKey].label;
      s.kind.textContent = t(STATS[s.statKey].label);
    });
    regionItems.forEach(it => {
      const on = it.dataset.region === R;
      it.classList.toggle('is-active', on);
      if (on) it.setAttribute('aria-current', 'true'); else it.removeAttribute('aria-current');
    });
    updateButtons();
    renderStatus();
    if (!DATA) return;
    slots.forEach((s, i) => {
      const v = DATA[R][s.statKey];
      if (count) countUp(s, v, delay + i * 250);
      else if (!counting[s.key]) { s.num.textContent = nf.format(v); s.num.setAttribute('aria-label', nf.format(v)); }
    });
  }

  let swapping = false;
  async function switchRegion(next) {
    if (swapping || !DATA || !DATA[next] || next === R) return;
    swapping = true;
    try {
      if (viz.classList.contains('is-open')) await close();   // geöffnete Visualisierung zuerst schließen
      document.body.classList.add('region-swap');
      await wait(REDUCED ? 0 : 420);
      R = next;
      try { history.replaceState(null, '', '#' + R); } catch (e) { /* ignorieren */ }
      renderRegion(true, 150);
      document.body.classList.remove('region-swap');
    } finally { swapping = false; }
  }

  regionItems.forEach(it => it.addEventListener('click', () => switchRegion(it.dataset.region)));
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (REGIONS[h]) switchRegion(h); });

  async function init() {
    statusMode = 'loading';
    renderStatus();
    try {
      DATA = await loadData();
    } catch (e) {
      console.error(e);
      statusMode = 'error';
      renderStatus();
      return;
    }
    const h = location.hash.slice(1);
    if (REGIONS[h] && DATA[h]) R = h;
    regionItems.forEach(it => { it.disabled = !DATA[it.dataset.region]; it.hidden = !DATA[it.dataset.region]; });
    statusMode = 'ready';
    renderRegion(true);
    slots.forEach(s => { s.btn.disabled = false; });
  }

  /* ───────────── Piktogramme (Vektor, im Code gezeichnet) ───────────── */
  const COLOR_COOL = '#a4a7ad';   // Mann / Junge – kühles Grau
  const COLOR_WARM = '#b3aaa0';   // Frau / Mädchen – warmes Grau
  const BOX_W = 44;
  const ADULT_H = 100;
  const CHILD_H = 84;

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
    c.fill();
  }
  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  function limb(c, x1, y1, x2, y2, w) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w; c.lineCap = 'round'; c.stroke();
  }
  function dress(c, pts) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath(); c.lineWidth = 3; c.lineJoin = 'round'; c.fill(); c.stroke();
  }

  const DRAW = {
    man(c) {
      circle(c, 22, 10.5, 10);
      rr(c, 9, 23, 26, 42, 7);
      rr(c, 0, 25, 7.5, 38, 3.75);
      rr(c, 36.5, 25, 7.5, 38, 3.75);
      rr(c, 10, 58, 10.5, 42, 4);
      rr(c, 23.5, 58, 10.5, 42, 4);
    },
    woman(c) {
      circle(c, 22, 10.5, 10);
      dress(c, [[14, 24], [30, 24], [40, 66], [4, 66]]);
      limb(c, 9, 27, 3, 54, 5.5);
      limb(c, 35, 27, 41, 54, 5.5);
      rr(c, 12.5, 64, 8, 36, 3.5);
      rr(c, 23.5, 64, 8, 36, 3.5);
    },
    boy(c) {
      circle(c, 22, 11.5, 10.5);
      rr(c, 9, 25, 26, 32, 6);
      rr(c, 0, 27, 7.5, 28, 3.75);
      rr(c, 36.5, 27, 7.5, 28, 3.75);
      rr(c, 10, 52, 10.5, 32, 4);
      rr(c, 23.5, 52, 10.5, 32, 4);
    },
    girl(c) {
      circle(c, 22, 11.5, 10.5);
      c.beginPath(); c.ellipse(8.5, 9, 5.5, 3.6, -0.55, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(35.5, 9, 5.5, 3.6, 0.55, 0, Math.PI * 2); c.fill();
      dress(c, [[14, 26], [30, 26], [39, 57], [5, 57]]);
      limb(c, 9, 29, 3, 50, 5.5);
      limb(c, 35, 29, 41, 50, 5.5);
      rr(c, 12.5, 54, 8, 30, 3.5);
      rr(c, 23.5, 54, 8, 30, 3.5);
    },
  };
  const SPRITE_SPEC = {
    man:   { color: COLOR_COOL, h: ADULT_H },
    woman: { color: COLOR_WARM, h: ADULT_H },
    boy:   { color: COLOR_COOL, h: CHILD_H },
    girl:  { color: COLOR_WARM, h: CHILD_H },
  };

  function makeSprite(kind, pxW, pxH) {
    const spec = SPRITE_SPEC[kind];
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(pxW));
    cv.height = Math.max(1, Math.round(pxH));
    const c = cv.getContext('2d');
    c.scale(cv.width / BOX_W, cv.height / spec.h);
    c.fillStyle = c.strokeStyle = spec.color;
    DRAW[kind](c);
    return cv;
  }

  /* ───────────── Visualisierung (Canvas, virtualisiert, stufenlos zoombar) ───────────── */
  const viz = $('#viz');
  const scroller = $('#viz-scroll');
  const track = $('#viz-track');
  const canvas = $('#viz-canvas');
  const ctx = canvas.getContext('2d');
  const stage = $('#viz-stage');
  const rangeEl = $('#viz-range');
  const zoomGroup = $('#viz-zoom');
  const zoomRange = $('#zoom-range');
  const zoomInBtn = $('#zoom-in');
  const zoomOutBtn = $('#zoom-out');

  const MODES = STATS;

  const V = {
    mode: null, total: 0,
    w: 0, h: 0, dpr: 1, pad: 16, innerW: 0, innerH: 0, k: 1, hRatio: 1, boxH: ADULT_H,
    colsBase: 1, colsFit: 2, maxCols: 1,
    z: 0, zT: 0, zraf: 0, zLast: 0,           // Zoom: 0 = Detail … 1 = alle auf einen Blick
    anchorIdx: 0, anchorY: 0,                 // Punkt, der beim Zoomen unter dem Finger/Zeiger bleibt
    L: null, reqCols: 0, contentTop: 0, trackH: 0,
    seen: null, replay: false, raf: 0, lastRange: '', sliderActive: false, img: null, u32: null,
    sprites: new Map(),
  };

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const clamp01 = x => clamp(x, 0, 1);
  const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
  const DONE = -1e9;                          // Markierung „Reihe ist bereits eingeblendet“

  /* Layout für eine bestimmte Spaltenzahl. Sehr kleine Zellen werden auf ganze Gerätepixel gerastert,
   * das verhindert Flimmern/Moiré bei winzigen Figuren. */
  function computeLayout(cols) {
    const { dpr, innerW, pad, k, hRatio, boxH, total } = V;
    const cw = innerW / cols;
    if (cw * dpr < 8) {
      const cwd = Math.max(1, Math.floor(innerW * dpr / cols));
      cols = Math.max(cols, Math.floor(innerW * dpr / cwd));        // Breite voll ausnutzen
      const rows = Math.ceil(total / cols);
      const chd = Math.max(2, Math.round(cwd * k));
      const gx = Math.max(1, Math.round(cwd * 0.22));
      const gy = Math.max(1, Math.round(chd * 0.14));
      return {
        cols, rows, rect: true, cwd, chd,
        iwd: Math.max(1, cwd - gx), ihd: Math.max(2, chd - gy),
        oxd: Math.floor((Math.round(V.w * dpr) - cols * cwd) / 2),
        cw: cwd / dpr, ch: chd / dpr,
      };
    }
    const rows = Math.ceil(total / cols);
    const ih = cw * hRatio;
    return { cols, rows, rect: false, cw, ch: cw * k, ih, iw: ih * BOX_W / boxH, ox: pad };
  }

  function computeBase() {
    const target = V.w < 520 ? 17 : V.w < 900 ? 20 : 23;           // gewünschte Zellbreite in der Detailansicht
    V.colsBase = Math.max(4, Math.floor(V.innerW / target));
    V.maxCols = Math.max(V.colsBase + 1, Math.floor(V.innerW * V.dpr));
    let fit = V.maxCols;
    for (let c = V.colsBase; c <= V.maxCols; c++) {                // kleinste Spaltenzahl, bei der alles auf einmal passt
      const l = computeLayout(c);
      if (l.rows * l.ch <= V.innerH) { fit = c; break; }
    }
    V.colsFit = Math.min(V.maxCols, Math.max(fit, Math.round(V.colsBase * 1.3)));
  }

  const colsAt = z => clamp(Math.round(V.colsBase * Math.pow(V.colsFit / V.colsBase, z)), V.colsBase, V.maxCols);

  function setAnchor(fy) {
    if (!V.L) return;
    V.anchorY = fy;
    const rowF = (scroller.scrollTop + fy - V.contentTop) / V.L.ch;
    V.anchorIdx = Math.max(0, rowF * V.L.cols);
  }

  function updateSlider() {
    if (!V.sliderActive) zoomRange.value = String(Math.round((1 - V.z) * 1000));
    zoomRange.style.setProperty('--fill', ((1 - V.z) * 100).toFixed(1) + '%');
  }

  /* Wendet den aktuellen Zoomwert an: Layout, Scrollhöhe, Ankerpunkt */
  function applyZoom() {
    if (!V.mode) return;
    const cols = colsAt(V.z);
    const changed = !V.L || V.reqCols !== cols;
    if (changed) {
      V.reqCols = cols;
      V.L = computeLayout(cols);
      V.seen = new Float32Array(V.L.rows).fill(V.replay ? Infinity : DONE);
      V.replay = false;
    }
    const L = V.L;
    const contentH = L.rows * L.ch;
    const trackH = Math.max(V.h, Math.ceil(contentH + 2 * V.pad));
    V.contentTop = trackH === V.h ? (V.h - contentH) / 2 : V.pad;   // passt alles → mittig, sonst mit Rand
    if (trackH !== V.trackH) { V.trackH = trackH; track.style.height = trackH + 'px'; }
    if (changed) {
      const y = V.contentTop + (V.anchorIdx / L.cols) * L.ch;
      scroller.scrollTop = clamp(y - V.anchorY, 0, Math.max(0, trackH - V.h));
    }
    updateSlider();
    schedule();
  }

  function layout(keepScroll, replay) {
    const m = MODES[V.mode];
    if (!m) return;
    if (keepScroll && V.L) setAnchor(0); else { V.anchorIdx = 0; V.anchorY = 0; }

    V.dpr = Math.min(window.devicePixelRatio || 1, 3);
    V.w = scroller.clientWidth;
    V.h = scroller.clientHeight;
    V.pad = V.w < 520 ? 12 : 20;
    V.innerW = V.w - 2 * V.pad;
    V.innerH = V.h - 2 * V.pad - 8;
    V.boxH = m.adult ? ADULT_H : CHILD_H;
    V.hRatio = m.adult ? 1.8 : 1.5;               // Figurenhöhe je Zellbreite
    V.k = V.hRatio * 1.14;                        // Zellhöhe je Zellbreite

    canvas.width = Math.round(V.w * V.dpr);
    canvas.height = Math.round(V.h * V.dpr);
    V.img = null;
    canvas.style.width = V.w + 'px';
    canvas.style.height = V.h + 'px';

    computeBase();
    if (!keepScroll) { V.z = V.zT = 0; }
    V.L = null;
    V.trackH = 0;
    V.replay = !!replay;
    applyZoom();
  }

  function getSprite(kind, wPx, hPx) {
    const key = kind + wPx + 'x' + hPx;
    let sp = V.sprites.get(key);
    if (!sp) {
      if (V.sprites.size > 120) V.sprites.clear();
      sp = makeSprite(kind, Math.max(1, wPx), Math.max(1, hPx));
      V.sprites.set(key, sp);
    }
    return sp;
  }

  /* Große Zellen: echte Piktogramme, sanft eingeblendet */
  function drawSprites(top, r0, r1, now) {
    const L = V.L, m = MODES[V.mode], dpr = V.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let firstUnseen = -1;
    for (let r = r0; r <= r1; r++) {
      if (V.seen[r] === Infinity) {
        if (firstUnseen < 0) firstUnseen = r;
        V.seen[r] = REDUCED ? DONE : now + (r - firstUnseen) * 75;
      }
    }

    const wPx = Math.round(L.iw * dpr), hPx = Math.round(L.ih * dpr);
    const sprites = [getSprite(m.kinds[0], wPx, hPx), getSprite(m.kinds[1], wPx, hPx)];
    const dw = sprites[0].width / dpr, dh = sprites[0].height / dpr;
    const yOff = (L.ch - dh) / 2, xOff = (L.cw - dw) / 2;

    let animating = false;
    for (let r = r0; r <= r1; r++) {
      const base = V.seen[r];
      const y0 = V.contentTop + r * L.ch - top + yOff;
      for (let c = 0; c < L.cols; c++) {
        const i = r * L.cols + c;
        if (i >= V.total) break;
        const p = (now - base - c * 12) / 900;
        if (p <= 0) { animating = true; continue; }
        let a = 1, rise = 0;
        if (p < 1) { const e = easeOutCubic(p); a = e; rise = (1 - e) * 8; animating = true; }
        ctx.globalAlpha = a * 0.92;
        ctx.drawImage(sprites[i & 1],
          Math.round((L.ox + c * L.cw + xOff) * dpr) / dpr,
          Math.round((y0 + rise) * dpr) / dpr, dw, dh);
      }
    }
    ctx.globalAlpha = 1;
    return animating;
  }

  /* Sehr kleine Zellen: ganzzahlige Pixel-Figuren (Kopf + Körper), direkt in einen Pixelpuffer geschrieben.
   * Das ist um ein Vielfaches schneller als zehntausende fillRect-Aufrufe und bleibt beim Zoomen flüssig. */
  const abgr = (hex, a) => (a << 24) | (parseInt(hex.slice(5, 7), 16) << 16) | (parseInt(hex.slice(3, 5), 16) << 8) | parseInt(hex.slice(1, 3), 16);
  const PX_COOL = abgr(COLOR_COOL, 235), PX_WARM = abgr(COLOR_WARM, 235);
  const PX_MID = abgr('#a9a8a8', 235), PX_DIM = abgr('#707174', 235);

  function drawPixels(top, r0, r1) {
    const L = V.L;
    const W = canvas.width, H = canvas.height;
    if (!V.img || V.img.width !== W || V.img.height !== H) {
      V.img = ctx.createImageData(W, H);
      V.u32 = new Uint32Array(V.img.data.buffer);
    }
    const u = V.u32;
    u.fill(0);

    const y0d = Math.round((V.contentTop - top) * V.dpr);
    const { cols, cwd, chd, iwd, ihd, oxd } = L;
    const head = iwd >= 5 ? 2 : iwd >= 3 ? 1 : 0;
    const hx = (iwd - head) >> 1;
    const two = iwd >= 4;                         // zwei Grautöne wie bei den Piktogrammen
    const single = cwd <= 1 ? PX_DIM : PX_MID;
    const bodyH = ihd - head - 1;

    for (let r = r0; r <= r1; r++) {
      const yBase = y0d + r * chd;
      const rowStart = r * cols;
      for (let c = 0; c < cols; c++) {
        const i = rowStart + c;
        if (i >= V.total) break;
        const col = two ? ((i & 1) ? PX_WARM : PX_COOL) : single;
        const x = oxd + c * cwd;
        if (head) {
          fillU(u, W, H, x + hx, yBase, head, head, col);
          fillU(u, W, H, x, yBase + head + 1, iwd, bodyH, col);
        } else {
          fillU(u, W, H, x, yBase, iwd, ihd, col);
        }
      }
    }
    ctx.putImageData(V.img, 0, 0);
  }

  function fillU(u, W, H, x, y, w, h, col) {
    const x0 = x < 0 ? 0 : x, y0 = y < 0 ? 0 : y;
    const x1 = x + w > W ? W : x + w, y1 = y + h > H ? H : y + h;
    for (let yy = y0; yy < y1; yy++) {
      const o = yy * W;
      for (let xx = x0; xx < x1; xx++) u[o + xx] = col;
    }
  }

  function draw(now) {
    V.raf = 0;
    if (!V.mode || !V.L) return;
    if (V.hold) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    const L = V.L;
    const top = scroller.scrollTop;
    const r0 = Math.max(0, Math.floor((top - V.contentTop) / L.ch));
    const r1 = Math.min(L.rows - 1, Math.floor((top + V.h - V.contentTop) / L.ch));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let animating = false;
    if (L.rect) {
      for (let r = r0; r <= r1; r++) V.seen[r] = DONE;
      drawPixels(top, r0, r1);
    } else {
      animating = drawSprites(top, r0, r1, now);
    }

    // Positionsanzeige – benennt die Menschen, nicht „Symbole“
    const m = MODES[V.mode];
    const from = r0 * L.cols + 1;
    const to = Math.min(V.total, (r1 + 1) * L.cols);
    const n = nf.format(V.total);
    const txt = (from === 1 && to >= V.total)
      ? t(m.all, { n })
      : t(m.range, { a: nf.format(from), b: nf.format(to), n });
    if (txt !== V.lastRange) { rangeEl.textContent = txt; V.lastRange = txt; }

    if (animating) schedule();
  }

  function schedule() {
    if (!V.raf) V.raf = requestAnimationFrame(draw);
  }

  scroller.addEventListener('scroll', schedule, { passive: true });

  let resizeTimer = 0;
  new ResizeObserver(() => {
    if (!V.mode || !viz.classList.contains('is-open')) return;
    if (Math.abs(scroller.clientWidth - V.w) < 1 && Math.abs(scroller.clientHeight - V.h) < 1) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => layout(true, false), 80);
  }).observe(scroller);

  /* ───────────── Zoom-Steuerung: Strg/⌘ + Scrollen, Trackpad-Pinch, Regler, +/−, Fingerzoom ───────────── */
  function zoomTick(now) {
    const dt = Math.min(64, now - V.zLast);
    V.zLast = now;
    V.z += (V.zT - V.z) * (1 - Math.exp(-dt / 85));        // weiches Nachziehen
    if (Math.abs(V.zT - V.z) < 0.0008) V.z = V.zT;
    applyZoom();
    V.zraf = V.z !== V.zT ? requestAnimationFrame(zoomTick) : 0;
  }

  function zoomTo(target, focusY) {
    if (!V.mode || !V.L) return;
    V.zT = clamp01(target);
    if (focusY != null) setAnchor(focusY);
    if (REDUCED) { V.z = V.zT; applyZoom(); return; }
    if (!V.zraf) { V.zLast = performance.now(); V.zraf = requestAnimationFrame(zoomTick); }
  }

  function zoomDirect(z) {                                  // ohne Nachziehen (Finger folgt 1:1)
    cancelAnimationFrame(V.zraf); V.zraf = 0;
    V.z = V.zT = clamp01(z);
    applyZoom();
  }

  const stageY = clientY => clientY - scroller.getBoundingClientRect().top;
  const zoomSpan = () => Math.log(V.colsFit / V.colsBase) || 1;

  // Mausrad über dem Raster scrollt ganz normal. Zoomen per Rad: über dem Zoom-Regler (unten rechts)
  // oder im Raster mit Strg/⌘ + Rad bzw. Trackpad-Pinch.
  function wheelZoom(e, focusY) {
    const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    const pinch = e.ctrlKey && Math.abs(d) < 50;                        // Trackpad-Pinch
    const step = Math.abs(d) >= 50 ? clamp(d, -120, 120) * 0.002 : d * (pinch ? 0.012 : 0.004);
    zoomTo(V.zT + step, focusY);
  }
  scroller.addEventListener('wheel', e => {
    if (!(e.ctrlKey || e.metaKey) || !V.L) return;                       // ohne Strg: normales Scrollen
    e.preventDefault();
    wheelZoom(e, stageY(e.clientY));
  }, { passive: false });
  zoomGroup.addEventListener('wheel', e => {
    if (!V.L) return;
    const down = e.deltaY > 0;
    if ((down && V.zT >= 1) || (!down && V.zT <= 0)) return;            // an der Grenze: Seite scrollt normal weiter
    e.preventDefault();
    wheelZoom(e, V.h / 2);
  }, { passive: false });

  // Mit gedrückter Maustaste ziehen = im Raster verschieben
  let drag = null;
  scroller.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (e.clientX - scroller.getBoundingClientRect().left > scroller.clientWidth) return;   // Scrollbalken nicht stören
    drag = { y: e.clientY, top: scroller.scrollTop };
    scroller.setPointerCapture(e.pointerId);
    scroller.classList.add('is-panning');
  });
  scroller.addEventListener('pointermove', e => {
    if (drag) scroller.scrollTop = drag.top - (e.clientY - drag.y);
  });
  const endDrag = () => { drag = null; scroller.classList.remove('is-panning'); };
  scroller.addEventListener('pointerup', endDrag);
  scroller.addEventListener('pointercancel', endDrag);

  // Regler und Tasten
  zoomRange.addEventListener('input', () => { V.sliderActive = true; zoomTo(1 - Number(zoomRange.value) / 1000, V.h / 2); });
  zoomRange.addEventListener('change', () => { V.sliderActive = false; updateSlider(); });
  zoomOutBtn.addEventListener('click', () => zoomTo(V.zT + 0.16, V.h / 2));
  zoomInBtn.addEventListener('click', () => zoomTo(V.zT - 0.16, V.h / 2));
  scroller.addEventListener('keydown', e => {
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomTo(V.zT - 0.16, V.h / 2); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomTo(V.zT + 0.16, V.h / 2); }
  });

  // Fingerzoom (Touch)
  let pinch = null;
  const tDist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
  const tMidY = (a, b) => stageY((a.clientY + b.clientY) / 2);
  scroller.addEventListener('touchstart', e => {
    if (e.touches.length !== 2 || !V.L) return;
    e.preventDefault();
    cancelAnimationFrame(V.zraf); V.zraf = 0; V.zT = V.z;
    const [a, b] = e.touches;
    setAnchor(tMidY(a, b));
    pinch = { d: tDist(a, b), z: V.z };
  }, { passive: false });
  scroller.addEventListener('touchmove', e => {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    const [a, b] = e.touches;
    V.anchorY = tMidY(a, b);                                // zwei Finger dürfen den Ausschnitt mitziehen
    zoomDirect(pinch.z - Math.log(tDist(a, b) / pinch.d) / zoomSpan());
  }, { passive: false });
  const endPinch = e => { if (e.touches.length < 2) pinch = null; };
  scroller.addEventListener('touchend', endPinch);
  scroller.addEventListener('touchcancel', endPinch);

  // Safari am Desktop (Trackpad-Pinch arrives as gesture events)
  if (!('ontouchstart' in window)) {
    let gz = null;
    scroller.addEventListener('gesturestart', e => { e.preventDefault(); gz = V.z; setAnchor(V.h / 2); });
    scroller.addEventListener('gesturechange', e => { e.preventDefault(); if (gz != null) zoomDirect(gz - Math.log(e.scale) / zoomSpan()); });
    scroller.addEventListener('gestureend', e => { e.preventDefault(); gz = null; });
  }

  function updateZoomAria() {
    zoomGroup.setAttribute('aria-label', t('zoom'));
    zoomRange.setAttribute('aria-label', t('zoom'));
    zoomOutBtn.setAttribute('aria-label', t('zoomOut'));
    zoomInBtn.setAttribute('aria-label', t('zoomIn'));
    zoomRange.title = zoomOutBtn.title = zoomInBtn.title = '';
    zoomOutBtn.title = t('zoomOut');
    zoomInBtn.title = t('zoomIn');
  }

  /* ───────────── Öffnen / Schließen / Wechseln ───────────── */
  const buttons = $$('.btn[data-mode]');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let busy = false;
  let activeMode = null;

  function updateButtons() {
    buttons.forEach(b => {
      const on = b.dataset.mode === activeMode;
      b.setAttribute('aria-expanded', String(on));
      $('.btn__label', b).textContent = on ? t('btnClose') : t(STATS[b.dataset.mode].btn);
      b.closest('.stat').classList.toggle('is-active', on);
    });
  }

  function updateVizTexts() {
    updateZoomAria();
    if (!V.mode) return;
    const m = MODES[V.mode];
    $('#viz-title').textContent = t(m.title, { n: nf.format(V.total) });
    $('#viz-sub').textContent = t(m.sub);
    scroller.setAttribute('aria-label', t(m.aria, { n: nf.format(V.total) }));
    V.lastRange = '';
    schedule();
  }

  function applyMode(mode) {
    cancelAnimationFrame(V.zraf); V.zraf = 0;
    V.mode = mode;
    V.total = DATA[R][mode];
    V.lastRange = '';
    V.sprites.clear();
    scroller.scrollTop = 0;
    updateVizTexts();
    layout(false, true);
  }

  async function open(mode) {
    if (busy || !DATA) return;
    busy = true;
    try {
      if (viz.classList.contains('is-open')) {
        stage.classList.add('is-switching');
        activeMode = mode; updateButtons();
        await wait(REDUCED ? 0 : 450);
        applyMode(mode);
        await wait(40);
        stage.classList.remove('is-switching');
      } else {
        viz.hidden = false;
        activeMode = mode; updateButtons();
        V.hold = true;                            // noch nichts zeichnen, bis das Panel fertig offen ist
        applyMode(mode);
        void viz.offsetHeight;                    // Reflow, damit die Transition startet
        viz.classList.add('is-open');
        await wait(REDUCED ? 0 : 350);
        viz.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
        await wait(REDUCED ? 0 : 750);
        V.hold = false;
        layout(false, true);                      // einmalige Einblendung bei finaler Größe
      }
    } finally { V.hold = false; busy = false; }
  }

  async function close() {
    if (busy || !viz.classList.contains('is-open')) return;
    busy = true;
    try {
      activeMode = null; updateButtons();
      viz.classList.remove('is-open');
      await wait(REDUCED ? 0 : 1100);
      viz.hidden = true;
      V.mode = null;
      cancelAnimationFrame(V.zraf); V.zraf = 0;
      if (V.raf) { cancelAnimationFrame(V.raf); V.raf = 0; }
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    } finally { busy = false; }
  }

  buttons.forEach(b => b.addEventListener('click', () => {
    const mode = b.dataset.mode;
    if (viz.classList.contains('is-open') && V.mode === mode) close(); else open(mode);
  }));
  $('#viz-close').addEventListener('click', close);

  /* ───────────── Sprachumschalter ───────────── */
  const langRoot = $('#lang');
  const langBtn = $('#lang-btn');
  const langMenu = $('#lang-menu');
  const langCode = $('#lang-code');

  LANGS.forEach(l => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lang__item';
    b.setAttribute('role', 'option');
    b.dataset.code = l.code;
    b.lang = l.code;
    b.textContent = l.name;
    b.addEventListener('click', () => { setLang(l.code); closeLangMenu(true); });
    li.appendChild(b);
    langMenu.appendChild(li);
  });
  const langItems = $$('.lang__item', langMenu);

  function openLangMenu() {
    langRoot.classList.add('is-open');
    langBtn.setAttribute('aria-expanded', 'true');
    const sel = langItems.find(i => i.dataset.code === L.code) || langItems[0];
    setTimeout(() => sel.focus({ preventScroll: true }), 60);
  }
  function closeLangMenu(refocus) {
    langRoot.classList.remove('is-open');
    langBtn.setAttribute('aria-expanded', 'false');
    if (refocus) langBtn.focus({ preventScroll: true });
  }
  const langOpen = () => langRoot.classList.contains('is-open');

  langBtn.addEventListener('click', () => (langOpen() ? closeLangMenu(false) : openLangMenu()));
  langMenu.addEventListener('keydown', e => {
    const i = langItems.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); langItems[(i + 1) % langItems.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); langItems[(i - 1 + langItems.length) % langItems.length].focus(); }
    else if (e.key === 'Tab') closeLangMenu(false);
  });
  document.addEventListener('pointerdown', e => { if (langOpen() && !langRoot.contains(e.target)) closeLangMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (langOpen()) closeLangMenu(true); else close();
  });

  function setLang(code, persist = true) {
    L = LANGS.find(l => l.code === code) || LANGS[0];
    if (persist) { try { localStorage.setItem('lang', L.code); } catch (e) { /* ignorieren */ } }

    nf = new Intl.NumberFormat(L.locale);
    dateFmt = new Intl.DateTimeFormat(L.locale, { day: 'numeric', month: 'long', year: 'numeric' });

    const root = document.documentElement;
    root.lang = L.code;
    root.dir = L.rtl ? 'rtl' : 'ltr';
    document.title = t('docTitle');
    const meta = $('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('metaDesc'));

    $$('[data-i18n]').forEach(el => {
      if (el.dataset.i18n === 'byIsrael') {            // nur der Name „Israel“ wird rot hervorgehoben
        el.textContent = '';
        t('byIsrael').split(/\[\[|\]\]/).forEach((part, i) => {
          if (!part) return;
          if (i % 2) { const r = document.createElement('span'); r.className = 'stat__red'; r.textContent = part; el.appendChild(r); }
          else el.appendChild(document.createTextNode(part));
        });
      } else el.textContent = t(el.dataset.i18n);
    });
    langCode.textContent = L.short;
    langBtn.setAttribute('aria-label', t('langLabel'));
    langMenu.setAttribute('aria-label', t('langLabel'));
    langItems.forEach(i => i.setAttribute('aria-selected', String(i.dataset.code === L.code)));

    regionsNav.setAttribute('aria-label', t('regionsLabel'));
    renderRegion(false);
    updateVizTexts();
  }

  function detectLang() {
    try {
      const stored = localStorage.getItem('lang');
      if (stored && LANGS.some(l => l.code === stored)) return stored;
    } catch (e) { /* ignorieren */ }
    const prefs = navigator.languages || [navigator.language || 'de'];
    for (const p of prefs) {
      const c = String(p).toLowerCase().slice(0, 2);
      if (LANGS.some(l => l.code === c)) return c;
    }
    return 'de';
  }

  /* ───────────── Start ───────────── */
  setLang(detectLang(), false);
  init();
})();
