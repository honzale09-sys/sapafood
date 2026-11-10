export const SITE = {
  name: "Sapa Food",
  phone: "+420 774 994 679",
  phoneHref: "tel:+420774994679",
  email: "info@sapa-food.cz",
  street: "Vodičkova 699/28",
  city: "110 00 Praha 1",
  country: { cs: "Česká republika", en: "Czech Republic" },
  hours: { cs: "Pondělí – Neděle", en: "Monday – Sunday", time: "10:30 – 22:30", open: "10:30", close: "22:30" },
  dailyUntil: "14:00",
  wolt: "https://wolt.com/en/cze/prague/restaurant/sapa-food",
  foodora: "https://www.foodora.cz/en/restaurant/gzej/sapa-food-gzej",
  facebook: "https://www.facebook.com/SapaFoodsCz",
  company: "IČO: 05540488, DIČ: CZ05540488",
  registry: {
    cs: "Společnost zapsána v obchodním rejstříku, vedeném Městským soudem v Praze, oddíl C, vložka 265441.",
    en: "Registered in the Commercial Register kept by the Municipal Court in Prague, section C, file 265441.",
  },
  mapEmbed: "https://www.google.com/maps?q=Sapa%20Food%2C%20Vodi%C4%8Dkova%20699%2F28%2C%20110%2000%20Praha%201&output=embed",
  mapLink: "https://www.google.com/maps/search/?api=1&query=Sapa+Food+Vodi%C4%8Dkova+699%2F28+Praha",
};

const g = (n) => `/api/static/scraped/gallery/${n}-big.webp`;
export const GALLERY = [
  { src: g(15), alt: { cs: "Stůl plný jídel Sapa Food", en: "A table full of Sapa Food dishes" } },
  { src: g(11), alt: { cs: "Interiér restaurace", en: "Restaurant interior" } },
  { src: g(18), alt: { cs: "Pho, závitky a nudle", en: "Pho, rolls and noodles" } },
  { src: g(16), alt: { cs: "Míchané nápoje na baru", en: "Mixed drinks at the bar" } },
  { src: g(19), alt: { cs: "Bún, pad thai a kari", en: "Bún, pad thai and curry" } },
  { src: g(22), alt: { cs: "Restovaná zelenina s rýží", en: "Stir-fried vegetables with rice" } },
  { src: g(21), alt: { cs: "Večeře pro více lidí", en: "Dinner for a group" } },
  { src: g(17), alt: { cs: "Jídelna s logem Sapa Food", en: "Dining room with the Sapa Food sign" } },
];
