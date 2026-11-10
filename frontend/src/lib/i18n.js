export const ROUTES = {
  home: { cs: "/", en: "/en/" },
  menu: { cs: "/menu/", en: "/en/menu/" },
  daily: { cs: "/denni-menu/", en: "/en/daily-menu/" },
  about: { cs: "/o-nas/", en: "/en/about-us/" },
  contact: { cs: "/kontakt/", en: "/en/contact/" },
};

export const pageKeyFromPath = (pathname) => {
  const p = pathname.endsWith("/") ? pathname : `${pathname}/`;
  for (const [key, v] of Object.entries(ROUTES)) if (v.cs === p || v.en === p) return key;
  return "home";
};

export const ALLERGENS = {
  cs: ["Obiloviny obsahující lepek", "Korýši", "Vejce", "Ryby", "Arašídy (podzemnice olejná)", "Sójové boby", "Mléko a laktóza", "Skořápkové plody (ořechy)", "Celer", "Hořčice", "Sezamová semena", "Oxid siřičitý a siřičitany", "Vlčí bob (lupina)", "Měkkýši"],
  en: ["Cereals containing gluten", "Crustaceans", "Eggs", "Fish", "Peanuts", "Soybeans", "Milk and lactose", "Tree nuts", "Celery", "Mustard", "Sesame seeds", "Sulphur dioxide and sulphites", "Lupin", "Molluscs"],
};

export const T = {
  cs: {
    nav: { menu: "Menu", daily: "Denní menu", about: "O nás", contact: "Kontakt" },
    order: "Objednat",
    orderVia: "Objednat přes",
    call: "Zavolat",
    heroEyebrow: "Vietnamská kuchyně · Vodičkova 28 · Praha 1",
    heroTitle: ["Pho, bún", "a vůně woku", "na Vodičkově."],
    heroSub: "Denně 10:30 – 22:30. Polední menu podáváme do 14:00.",
    heroOrder: "Objednat (Wolt / Foodora)",
    storyEyebrow: "Z naší kuchyně",
    storyTitle: "Miska, která voní bylinkami",
    story: [
      "Vietnamská kuchyně stojí na rovnováze. Pho je polévka postavená na vývaru, do kterého přichází hedvábné rýžové nudle, tenké plátky masa a hrst čerstvých bylinek — koriandr, jarní cibulka, chilli.",
      "Bún je jeho svěží protějšek: rýžové nudle, grilované maso, salát a perilla, zalité omáčkou. K tomu křupavé závitky, kari s kokosovým mlékem a jídla z rozpáleného woku.",
    ],
    featuredEyebrow: "Oblíbené",
    featuredTitle: "Jídla, pro která se vracíte",
    fullMenu: "Celé menu",
    dailyEyebrow: "Polední menu",
    dailyTitle: "Denní menu",
    servedUntil: "podáváme do 14:00",
    servedUntilLong: "Denní menu podáváme do 14:00",
    dailyEmptyTitle: "Dnešní menu připravujeme",
    dailyEmptyText: "Na dnešek zatím nemáme zveřejněné polední menu. Mezitím si vyberte z našeho stálého menu.",
    seeDaily: "Zobrazit denní menu",
    seeMenu: "Stálé menu",
    galleryEyebrow: "Atmosféra",
    galleryTitle: "U nás na Vodičkově",
    visitEyebrow: "Návštěva",
    visitTitle: "Najdete nás v centru Prahy",
    hours: "Otevírací doba",
    address: "Adresa",
    contactHead: "Kontakt",
    delivery: "Rozvoz domů",
    deliveryText: "Naše jídla vám dovezou partneři Wolt a Foodora.",
    directions: "Navigovat",
    menuTitle: "Menu",
    menuIntro: "Stálá nabídka Sapa Food. Čísla u jídel odpovídají číslům v restauraci.",
    allergens: "Alergeny",
    allergenLegend: "Seznam 14 alergenů",
    allergenNote: "Čísla u jídel označují alergeny dle nařízení EU č. 1169/2011. Máte-li dotaz, zeptejte se obsluhy.",
    vegetarian: "Vegetariánské",
    vegan: "Veganské",
    variantsLabel: "Varianty",
    aboutTitle: "O nás",
    contactTitle: "Kontakt",
    company: "Provozovatel",
    menuLoading: "Načítám menu…",
    notFound: "Stránka nenalezena",
    backHome: "Zpět na úvod",
    footerTag: "Vietnamská a asijská kuchyně v Praze 1.",
    today: "Dnes",
    open: "Otevřeno",
    closed: "Zavřeno",
    seo: {
      home: ["Sapa Food – vietnamská restaurace, Vodičkova, Praha 1", "Vietnamská restaurace Sapa Food na Vodičkově ulici v Praze 1. Pho, bún, závitky, kari a jídla z woku. Denně 10:30–22:30, polední menu do 14:00."],
      menu: ["Menu | Sapa Food Praha 1", "Kompletní menu Sapa Food: závitky, polévky pho, bún, nudle, kari, wok a mořské plody. Ceny a alergeny."],
      daily: ["Denní menu | Sapa Food Praha 1", "Polední denní menu Sapa Food na Vodičkově ulici. Podáváme do 14:00."],
      about: ["O nás | Sapa Food Praha 1", "Sapa Food – vietnamská kuchyně v centru Prahy. Fotografie restaurace a jídel."],
      contact: ["Kontakt | Sapa Food Praha 1", "Sapa Food, Vodičkova 699/28, Praha 1. Tel. +420 774 994 679, info@sapa-food.cz. Otevřeno denně 10:30–22:30."],
    },
  },
  en: {
    nav: { menu: "Menu", daily: "Daily menu", about: "About us", contact: "Contact" },
    order: "Order",
    orderVia: "Order via",
    call: "Call",
    heroEyebrow: "Vietnamese kitchen · Vodičkova 28 · Prague 1",
    heroTitle: ["Pho, bún", "and the scent of the wok", "on Vodičkova."],
    heroSub: "Open daily 10:30 – 22:30. Lunch menu served until 14:00.",
    heroOrder: "Order (Wolt / Foodora)",
    storyEyebrow: "From our kitchen",
    storyTitle: "A bowl that smells of fresh herbs",
    story: [
      "Vietnamese cooking is about balance. Pho is a soup built on broth, poured over silky rice noodles, thin slices of meat and a handful of fresh herbs — coriander, spring onion, chilli.",
      "Bún is its fresh counterpart: rice noodles, grilled meat, lettuce and perilla, dressed with sauce. Add crispy spring rolls, coconut-milk curries and dishes from a blazing wok.",
    ],
    featuredEyebrow: "Favourites",
    featuredTitle: "Dishes people come back for",
    fullMenu: "Full menu",
    dailyEyebrow: "Lunch menu",
    dailyTitle: "Daily menu",
    servedUntil: "served until 14:00",
    servedUntilLong: "The daily menu is served until 14:00",
    dailyEmptyTitle: "Today's menu is being prepared",
    dailyEmptyText: "Today's lunch menu hasn't been published yet. In the meantime, choose from our regular menu.",
    seeDaily: "See the daily menu",
    seeMenu: "Regular menu",
    galleryEyebrow: "Atmosphere",
    galleryTitle: "At our place on Vodičkova",
    visitEyebrow: "Visit",
    visitTitle: "Find us in the centre of Prague",
    hours: "Opening hours",
    address: "Address",
    contactHead: "Contact",
    delivery: "Delivery",
    deliveryText: "Our dishes are delivered by our partners Wolt and Foodora.",
    directions: "Directions",
    menuTitle: "Menu",
    menuIntro: "The Sapa Food regular menu. Dish numbers match the numbers used in the restaurant.",
    allergens: "Allergens",
    allergenLegend: "List of 14 allergens",
    allergenNote: "Numbers next to dishes mark allergens according to EU Regulation No. 1169/2011. If in doubt, please ask our staff.",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    variantsLabel: "Options",
    aboutTitle: "About us",
    contactTitle: "Contact",
    company: "Operator",
    menuLoading: "Loading menu…",
    notFound: "Page not found",
    backHome: "Back to home",
    footerTag: "Vietnamese & Asian cuisine in Prague 1.",
    today: "Today",
    open: "Open now",
    closed: "Closed",
    seo: {
      home: ["Sapa Food – Vietnamese restaurant, Vodičkova, Prague 1", "Sapa Food Vietnamese restaurant on Vodičkova street, Prague 1. Pho, bún, spring rolls, curries and wok dishes. Open daily 10:30–22:30, lunch menu until 14:00."],
      menu: ["Menu | Sapa Food Prague 1", "The full Sapa Food menu: spring rolls, pho soups, bún, noodles, curries, wok and seafood. Prices and allergens."],
      daily: ["Daily menu | Sapa Food Prague 1", "Sapa Food daily lunch menu on Vodičkova street. Served until 14:00."],
      about: ["About us | Sapa Food Prague 1", "Sapa Food – Vietnamese cuisine in the centre of Prague. Photos of the restaurant and dishes."],
      contact: ["Contact | Sapa Food Prague 1", "Sapa Food, Vodičkova 699/28, Prague 1. Tel. +420 774 994 679, info@sapa-food.cz. Open daily 10:30–22:30."],
    },
  },
};

export const pick = (lang, cz, en) => (lang === "en" && en && en.trim() ? en : cz);

export const formatPrice = (n) => `${n} Kč`;

export const formatDate = (iso, lang) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const wd = dt.toLocaleDateString(lang === "en" ? "en-GB" : "cs-CZ", { weekday: "long", timeZone: "UTC" });
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${d}. ${m}. ${y}`;
};
