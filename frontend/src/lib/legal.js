// Business terms and privacy policy for online pickup orders. Operator data from the Czech business register (ARES).
const EFFECTIVE = { cs: "10. 11. 2026", en: "10 November 2026" };

const OPERATOR = {
  cs: "HOANGANHCZ s.r.o., IČO 05540488, DIČ CZ05540488, se sídlem Na Suchých 212, 252 50 Vestec, zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C, vložka 265441",
  en: "HOANGANHCZ s.r.o., company ID 05540488, VAT ID CZ05540488, registered office Na Suchých 212, 252 50 Vestec, Czech Republic, registered in the Commercial Register kept by the Municipal Court in Prague, section C, file 265441",
};
const CONTACT = {
  cs: "Restaurace Sapa Food, Vodičkova 699/28, 110 00 Praha 1, tel. +420 774 994 679, e-mail info@sapa-food.cz",
  en: "Sapa Food restaurant, Vodičkova 699/28, 110 00 Prague 1, phone +420 774 994 679, e-mail info@sapa-food.cz",
};

export const LEGAL = {
  terms: {
    cs: {
      title: "Obchodní podmínky online objednávek",
      effective: EFFECTIVE.cs,
      sections: [
        { h: "1. Prodávající", p: [`Prodávajícím je ${OPERATOR.cs}, provozovatel restaurace Sapa Food (dále „my“).`, `Kontakt: ${CONTACT.cs}.`] },
        {
          h: "2. Objednávka a uzavření smlouvy",
          p: [
            "Na webu sapa-food.cz si objednáváte jídla z našeho menu k osobnímu vyzvednutí v restauraci na Vodičkově 699/28. Rozvoz nezajišťujeme.",
            "V objednávce vyplníte jméno, telefon, e-mail, čas vyzvednutí (vždy v daný den) a případně poznámku pro kuchyni. Před odesláním můžete objednávku zkontrolovat a změnit.",
            "Kupní smlouva je uzavřena okamžikem, kdy je platba za objednávku úspěšně dokončena. Poté se vám zobrazí potvrzení s číslem objednávky.",
          ],
        },
        {
          h: "3. Ceny a platba",
          p: [
            "Ceny na webu jsou konečné, včetně DPH. Platí cena uvedená v objednávce v okamžiku jejího odeslání.",
            "Objednávka se hradí předem platební kartou přes platební bránu Teya. Údaje o platební kartě nezpracováváme, zpracovává je poskytovatel platební brány.",
          ],
        },
        {
          h: "4. Vyzvednutí",
          p: [
            "Objednávku si vyzvedněte ve zvoleném čase v restauraci. Při vyzvednutí uveďte číslo objednávky nebo jméno.",
            "Pokud objednávku nemůžeme připravit (např. dojde surovina nebo nastane provozní problém), ozveme se vám na uvedený telefon a domluvíme náhradu, nebo vám celou částku vrátíme na platební kartu.",
            "Nevyzvednuté jídlo uchováváme do konce otevírací doby daného dne. Protože jde o čerstvě připravené jídlo, zaplacená cena se za nevyzvednutou objednávku nevrací.",
          ],
        },
        {
          h: "5. Odstoupení od smlouvy",
          p: [
            "Jídla připravujeme na objednávku a podléhají rychlé zkáze. Podle § 1837 písm. d) občanského zákoníku proto nelze od uzavřené smlouvy odstoupit bez udání důvodu.",
            "Pokud chcete objednávku zrušit, zavolejte nám co nejdříve. Dokud jsme s přípravou nezačali, vyhovíme vám a peníze vrátíme.",
          ],
        },
        {
          h: "6. Reklamace",
          p: [
            "Jídlo prosím zkontrolujte při převzetí. Chybějící nebo nesprávnou položku či jinou vadu reklamujte hned v restauraci, případně telefonicky nebo e-mailem bez zbytečného odkladu.",
            "Oprávněnou reklamaci vyřídíme přípravou nového jídla nebo vrácením peněz, nejpozději do 30 dnů.",
          ],
        },
        { h: "7. Alergeny", p: ["Alergeny jsou uvedeny u jednotlivých jídel v menu (čísla 1–14). Máte-li alergii, napište ji do poznámky nebo se zeptejte personálu."] },
        {
          h: "8. Mimosoudní řešení sporů",
          p: ["K mimosoudnímu řešení spotřebitelských sporů je příslušná Česká obchodní inspekce, Ústřední inspektorát – oddělení ADR, Štěpánská 796/44, 110 00 Praha 1, www.adr.coi.cz."],
        },
        {
          h: "9. Závěrečná ustanovení",
          p: [
            "Vztahy neupravené těmito podmínkami se řídí českým právem, zejména občanským zákoníkem a zákonem o ochraně spotřebitele.",
            "Zpracování osobních údajů popisují Zásady ochrany osobních údajů.",
          ],
        },
      ],
    },
    en: {
      title: "Terms for online orders",
      effective: EFFECTIVE.en,
      sections: [
        { h: "1. Seller", p: [`The seller is ${OPERATOR.en}, operator of the Sapa Food restaurant ("we").`, `Contact: ${CONTACT.en}.`] },
        {
          h: "2. Ordering and the contract",
          p: [
            "On sapa-food.cz you order dishes from our menu for pickup at the restaurant at Vodičkova 699/28. We do not deliver.",
            "You enter your name, phone, e-mail, a pickup time (always on the same day) and an optional note for the kitchen. You can review and change the order before sending it.",
            "The contract is concluded when the payment for the order is completed. You then see a confirmation with your order number.",
          ],
        },
        {
          h: "3. Prices and payment",
          p: [
            "Prices on the website are final and include VAT. The price shown when you send the order applies.",
            "Orders are paid in advance by card through the Teya payment gateway. We do not process your card details; the payment provider does.",
          ],
        },
        {
          h: "4. Pickup",
          p: [
            "Pick up your order at the restaurant at the chosen time and give your order number or name.",
            "If we cannot prepare the order (e.g. an ingredient runs out or an operational problem occurs), we will call you to agree on a replacement or refund the full amount to your card.",
            "Uncollected food is kept until closing time that day. As it is freshly prepared, the price of an uncollected order is not refunded.",
          ],
        },
        {
          h: "5. Withdrawal",
          p: [
            "Dishes are prepared to order and are perishable. Under Section 1837(d) of the Czech Civil Code, you therefore cannot withdraw from the contract without giving a reason.",
            "If you want to cancel, call us as soon as possible. As long as we have not started preparing it, we will cancel the order and refund you.",
          ],
        },
        {
          h: "6. Complaints",
          p: [
            "Please check the food when you collect it. Report a missing or wrong item or another defect at the restaurant, or by phone or e-mail without undue delay.",
            "We settle a justified complaint by preparing the dish again or refunding you, within 30 days at the latest.",
          ],
        },
        { h: "7. Allergens", p: ["Allergens are listed with each dish on the menu (numbers 1–14). If you have an allergy, add it to the note or ask our staff."] },
        {
          h: "8. Out-of-court dispute resolution",
          p: ["Consumer disputes can be resolved out of court by the Czech Trade Inspection Authority, ADR department, Štěpánská 796/44, 110 00 Prague 1, www.adr.coi.cz."],
        },
        {
          h: "9. Final provisions",
          p: ["Matters not covered by these terms are governed by Czech law, in particular the Civil Code and the Consumer Protection Act.", "How we process personal data is described in the Privacy Policy."],
        },
      ],
    },
  },
  privacy: {
    cs: {
      title: "Zásady ochrany osobních údajů",
      effective: EFFECTIVE.cs,
      sections: [
        { h: "1. Správce", p: [`Správcem osobních údajů je ${OPERATOR.cs}.`, `Kontakt pro ochranu osobních údajů: ${CONTACT.cs}.`] },
        {
          h: "2. Jaké údaje a proč",
          p: [
            "Online objednávky: jméno, telefon, e-mail, poznámka, objednaná jídla, čas vyzvednutí a stav platby. Potřebujeme je, abychom objednávku připravili, předali vám ji a v případě potřeby vás kontaktovali (plnění smlouvy, čl. 6 odst. 1 písm. b) GDPR).",
            "Účetnictví a daně: údaje o objednávce a platbě uchováváme po dobu, kterou ukládají daňové a účetní předpisy, nejdéle 10 let (právní povinnost, čl. 6 odst. 1 písm. c) GDPR).",
            "Ostatní údaje z objednávek mažeme nejpozději 3 roky po objednávce, kvůli případným reklamacím a nárokům (oprávněný zájem, čl. 6 odst. 1 písm. f) GDPR).",
          ],
        },
        {
          h: "3. Komu údaje předáváme",
          p: [
            "Poskytovatel platební brány Teya: platbu kartou, včetně údajů o kartě, zpracovává on. My údaje o kartě nevidíme.",
            "GoSMS: pošle restauraci SMS s vaší objednávkou, jménem a telefonem, aby ji kuchyně mohla hned připravit.",
            "Emergent: provozovatel serverů, na kterých běží web a databáze objednávek.",
            "Údaje neprodáváme a nepoužíváme je k reklamě.",
          ],
        },
        {
          h: "4. Úložiště v prohlížeči a mapa",
          p: [
            "Web si ve vašem prohlížeči ukládá obsah košíku a rozepsané údaje objednávky, aby se neztratily při obnovení stránky. Neslouží ke sledování.",
            "Na hlavní stránce je mapa Google Maps. Při jejím načtení Google získá vaši IP adresu a může používat vlastní cookies podle svých zásad.",
          ],
        },
        {
          h: "5. Vaše práva",
          p: [
            "Máte právo na přístup ke svým údajům, jejich opravu nebo výmaz, omezení zpracování, přenositelnost a právo vznést námitku proti zpracování na základě oprávněného zájmu.",
            "Svá práva uplatněte na info@sapa-food.cz. Máte také právo podat stížnost u Úřadu pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, www.uoou.gov.cz.",
          ],
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      effective: EFFECTIVE.en,
      sections: [
        { h: "1. Controller", p: [`The controller of personal data is ${OPERATOR.en}.`, `Privacy contact: ${CONTACT.en}.`] },
        {
          h: "2. What data and why",
          p: [
            "Online orders: name, phone, e-mail, note, ordered dishes, pickup time and payment status. We need them to prepare and hand over your order and to contact you if needed (performance of a contract, Art. 6(1)(b) GDPR).",
            "Accounting and tax: order and payment records are kept for the period required by tax and accounting law, at most 10 years (legal obligation, Art. 6(1)(c) GDPR).",
            "Other order data is deleted at the latest 3 years after the order, for possible complaints and claims (legitimate interest, Art. 6(1)(f) GDPR).",
          ],
        },
        {
          h: "3. Who receives the data",
          p: [
            "The Teya payment gateway processes the card payment, including card details. We never see your card details.",
            "GoSMS sends the restaurant a text message with your order, name and phone, so the kitchen can start right away.",
            "Emergent operates the servers that run the website and the order database.",
            "We do not sell your data or use it for advertising.",
          ],
        },
        {
          h: "4. Browser storage and the map",
          p: [
            "The website stores your cart and unfinished order details in your browser so they survive a page reload. This is not used for tracking.",
            "The home page shows a Google Maps map. When it loads, Google receives your IP address and may use its own cookies under its own policy.",
          ],
        },
        {
          h: "5. Your rights",
          p: [
            "You have the right to access, rectify or erase your data, to restrict processing, to data portability, and to object to processing based on legitimate interest.",
            "Exercise your rights at info@sapa-food.cz. You may also lodge a complaint with the Czech Office for Personal Data Protection, Pplk. Sochora 27, 170 00 Prague 7, www.uoou.gov.cz.",
          ],
        },
      ],
    },
  },
};
