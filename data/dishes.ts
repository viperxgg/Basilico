import type { DishRecord, Money } from "@/lib/types/restaurant";

const sek = "SEK";

function price(amount: number): Money {
  return { amount, currency: sek };
}

type DishInput = {
  number: number;
  slug: string;
  name: string;
  categoryId: string;
  description: string;
  ingredients: string[];
  price: number;
  allergens?: string[];
  tags?: string[];
  priceLabel?: string;
  badges?: DishRecord["badges"];
  variants?: DishRecord["variants"];
};

function dish(input: DishInput): DishRecord {
  return {
    id: `basilico-${input.slug}`,
    number: input.number,
    slug: input.slug,
    name: input.name,
    categoryId: input.categoryId,
    description: input.description,
    ingredients: input.ingredients,
    price: price(input.price),
    priceLabel: input.priceLabel,
    calories: 0,
    allergens: input.allergens ?? [],
    badges: input.badges,
    tags: input.tags,
    variants: input.variants,
    status: "available",
    imageAlt: `Menyinformation för ${input.name}`
  };
}

function pizza(
  number: number,
  slug: string,
  name: string,
  ingredients: string[],
  amount: number,
  tags?: string[]
) {
  return dish({
    number,
    slug,
    name,
    categoryId: "pizza",
    description: ingredients.join(", "),
    ingredients,
    price: amount,
    allergens: ["gluten", "mjölk"],
    tags
  });
}

function gourmet(
  number: number,
  slug: string,
  name: string,
  ingredients: string[],
  amount: number,
  tags?: string[]
) {
  return dish({
    number,
    slug,
    name,
    categoryId: "gourmetpizzor",
    description: ingredients.join(", "),
    ingredients,
    price: amount,
    allergens: ["gluten", "mjölk"],
    tags,
    badges: tags?.includes("Vegetarisk") ? ["vegetarian"] : undefined
  });
}

export const dishes: DishRecord[] = [
  dish({
    number: 1,
    slug: "vitloksbrod",
    name: "Vitlöksbröd",
    categoryId: "forratter",
    description: "Vitlöksbröd med pesto och vitlökscrème.",
    ingredients: ["Vitlöksbröd", "Pesto", "Vitlökscrème"],
    price: 49,
    allergens: ["gluten", "mjölk"]
  }),
  dish({
    number: 2,
    slug: "affettati-misti",
    name: "Affettati misti",
    categoryId: "forratter",
    description: "Italienska charkuterier med parmesan och gorgonzola.",
    ingredients: ["Italienska charkuterier", "Parmesan", "Gorgonzola"],
    price: 99,
    allergens: ["mjölk"]
  }),
  dish({
    number: 3,
    slug: "sotad-sparris",
    name: "Sotad sparris",
    categoryId: "forratter",
    description:
      "Grillad sparris med tryffelolja, riven parmesan, rostade pinjenötter och färsk ruccola.",
    ingredients: ["Sparris", "Tryffelolja", "Parmesan", "Pinjenötter", "Ruccola"],
    price: 59,
    allergens: ["mjölk", "nötter"],
    badges: ["vegetarian"]
  }),
  dish({
    number: 4,
    slug: "cozze-al-vino-bianco",
    name: "Cozze al vino bianco",
    categoryId: "forratter",
    description: "Blåmusslor kokta i vitt vin, chili, vitlök, grädde och citron.",
    ingredients: ["Blåmusslor", "Vitt vin", "Chili", "Vitlök", "Grädde", "Citron"],
    price: 99,
    allergens: ["blötdjur", "mjölk"]
  }),
  dish({
    number: 5,
    slug: "gamberi-al-pomodoro",
    name: "Gamberi al pomodoro",
    categoryId: "forratter",
    description: "Tigerräkor i vitlök och chili, kokta i vitt vin och tomatsås.",
    ingredients: ["Tigerräkor", "Vitlök", "Chili", "Vitt vin", "Tomatsås"],
    price: 99,
    allergens: ["skaldjur"]
  }),
  dish({
    number: 6,
    slug: "ostgratinerade-nachos",
    name: "Ostgratinerade nachos",
    categoryId: "forratter",
    description: "Ostgratinerade nachos med salsa.",
    ingredients: ["Nachos", "Ost", "Salsa"],
    price: 69,
    allergens: ["mjölk"],
    badges: ["vegetarian"]
  }),
  dish({
    number: 7,
    slug: "chevreost-gratinerad-toast",
    name: "Chèvreost gratinerad på toast",
    categoryId: "forratter",
    description: "Ugnsbakad chèvreost på toast med honung och valnötter.",
    ingredients: ["Chèvreost", "Toast", "Honung", "Valnötter"],
    price: 69,
    allergens: ["gluten", "mjölk", "nötter"],
    badges: ["vegetarian"]
  }),

  dish({
    number: 8,
    slug: "schnitzel-dorato",
    name: "Schnitzel Dorato",
    categoryId: "a-la-carte",
    description: "Fläskytterfilé med rödvinssås, gröna ärtor, citron och friterad potatis.",
    ingredients: ["Fläskytterfilé", "Rödvinssås", "Gröna ärtor", "Citron", "Friterad potatis"],
    price: 149,
    allergens: ["gluten"]
  }),
  dish({
    number: 9,
    slug: "langtidsbakat-revbensspjall",
    name: "Långtidsbakat revbensspjäll",
    categoryId: "a-la-carte",
    description: "Revbensspjäll med coleslawsallad, BBQ-sås och pommes frites.",
    ingredients: ["Revbensspjäll", "Coleslaw", "BBQ-sås", "Pommes frites"],
    price: 199
  }),
  dish({
    number: 10,
    slug: "black-and-white",
    name: "Black & White",
    categoryId: "a-la-carte",
    description: "Oxfilé och fläskfilé med bearnaisesås, rödvinssås och potatisgratäng eller pommes frites.",
    ingredients: ["Oxfilé", "Fläskfilé", "Bearnaisesås", "Rödvinssås", "Potatisgratäng", "Pommes frites"],
    price: 239,
    allergens: ["mjölk", "ägg"]
  }),
  dish({
    number: 11,
    slug: "stekt-entrecote-200g",
    name: "Stekt Entrecôte 200g",
    categoryId: "a-la-carte",
    description: "Entrecôte med grönsaker, bearnaisesås och pommes frites.",
    ingredients: ["Entrecôte", "Grönsaker", "Bearnaisesås", "Pommes frites"],
    price: 219,
    allergens: ["ägg", "mjölk"]
  }),
  dish({
    number: 12,
    slug: "pepparstek-oxfile-200g",
    name: "Pepparstek Oxfilé 200g",
    categoryId: "a-la-carte",
    description: "Två bitar oxfilé med grönsaker, rödvinssås och pommes frites.",
    ingredients: ["Oxfilé", "Grönsaker", "Rödvinssås", "Pommes frites"],
    price: 299
  }),
  dish({
    number: 13,
    slug: "pepparstek-flaskfile-200g",
    name: "Pepparstek Fläskfilé 200g",
    categoryId: "a-la-carte",
    description: "Två bitar fläskfilé med grönsaker, bearnaisesås och pommes frites.",
    ingredients: ["Fläskfilé", "Grönsaker", "Bearnaisesås", "Pommes frites"],
    price: 169,
    allergens: ["ägg", "mjölk"]
  }),
  dish({
    number: 14,
    slug: "petto-di-pollo-alla-griglia",
    name: "Petto di pollo alla griglia",
    categoryId: "a-la-carte",
    description: "Kycklingfilé med bearnaisesås, grönsaker och pommes frites.",
    ingredients: ["Kycklingfilé", "Bearnaisesås", "Grönsaker", "Pommes frites"],
    price: 149,
    allergens: ["ägg", "mjölk"]
  }),
  dish({
    number: 15,
    slug: "special-burgare",
    name: "Special Burgare",
    categoryId: "a-la-carte",
    description: "Högrev med smältost, aioli, lökringar, grönsaker, bacon och pommes frites.",
    ingredients: ["Högrev", "Smältost", "Aioli", "Lökringar", "Grönsaker", "Bacon", "Pommes frites"],
    price: 159,
    allergens: ["gluten", "mjölk", "ägg"]
  }),
  dish({
    number: 16,
    slug: "bbq-burgare",
    name: "BBQ Burgare",
    categoryId: "a-la-carte",
    description: "Högrev med smältost, BBQ-sås, lökringar, grönsaker och pommes frites.",
    ingredients: ["Högrev", "Smältost", "BBQ-sås", "Lökringar", "Grönsaker", "Pommes frites"],
    price: 159,
    allergens: ["gluten", "mjölk"]
  }),
  dish({
    number: 17,
    slug: "klassisk-fish-and-chips",
    name: "Klassisk fish and chips",
    categoryId: "a-la-carte",
    description: "Rödspätta med remouladsås, gröna ärtor och pommes frites.",
    ingredients: ["Rödspätta", "Remouladsås", "Gröna ärtor", "Pommes frites"],
    price: 149,
    allergens: ["fisk", "gluten", "ägg"]
  }),
  dish({
    number: 18,
    slug: "di-salmone-affumicato-caldo",
    name: "Di salmone affumicato caldo",
    categoryId: "a-la-carte",
    description: "Varmrökt lax med örtkräm och kokt potatis.",
    ingredients: ["Varmrökt lax", "Örtkräm", "Kokt potatis"],
    price: 199,
    allergens: ["fisk", "mjölk"]
  }),
  dish({
    number: 19,
    slug: "franska-moules-i-vitvinssas",
    name: "Franska moules i vitvinssås med frites",
    categoryId: "a-la-carte",
    description: "Blåmusslor kokta i vitt vin med chili, citron och grädde. Serveras med aioli, pommes frites och vitlöksbröd.",
    ingredients: ["Blåmusslor", "Vitt vin", "Chili", "Citron", "Grädde", "Aioli", "Pommes frites", "Vitlöksbröd"],
    price: 189,
    allergens: ["blötdjur", "mjölk", "ägg", "gluten"]
  }),

  dish({
    number: 20,
    slug: "bolognese",
    name: "Bolognese",
    categoryId: "pasta",
    description: "Spaghetti med köttfärssås och parmesan.",
    ingredients: ["Spaghetti", "Köttfärssås", "Parmesan"],
    price: 119,
    allergens: ["gluten", "mjölk"]
  }),
  dish({
    number: 21,
    slug: "al-pesto-verde",
    name: "Al pesto verde",
    categoryId: "pasta",
    description: "Spaghetti med basilika, pinjenötter, olivolja och parmesan.",
    ingredients: ["Spaghetti", "Basilika", "Pinjenötter", "Olivolja", "Parmesan"],
    price: 119,
    allergens: ["gluten", "mjölk", "nötter"],
    badges: ["vegetarian"]
  }),
  dish({
    number: 22,
    slug: "rigate-vegetari",
    name: "Rigate vegetari",
    categoryId: "pasta",
    description: "Rigatoni med lök, paprika, svamp, oliver, tomatsås och parmesan.",
    ingredients: ["Rigatoni", "Lök", "Paprika", "Svamp", "Oliver", "Tomatsås", "Parmesan"],
    price: 129,
    allergens: ["gluten", "mjölk"],
    badges: ["vegetarian"]
  }),
  dish({
    number: 23,
    slug: "carbonara-classica",
    name: "Carbonara Classica",
    categoryId: "pasta",
    description: "Spaghetti med bacon, grädde, ägg och parmesan.",
    ingredients: ["Spaghetti", "Bacon", "Grädde", "Ägg", "Parmesan"],
    price: 149,
    allergens: ["gluten", "mjölk", "ägg"]
  }),
  dish({
    number: 24,
    slug: "frutti-di-mare",
    name: "Frutti Di Mare",
    categoryId: "pasta",
    description: "Spaghetti med tigerräkor, blåmusslor, chili, vitt vin, tomatsås och parmesan.",
    ingredients: ["Spaghetti", "Tigerräkor", "Blåmusslor", "Chili", "Vitt vin", "Tomatsås", "Parmesan"],
    price: 159,
    allergens: ["gluten", "mjölk", "skaldjur", "blötdjur"]
  }),
  dish({
    number: 25,
    slug: "pappardelle-al-tartufo",
    name: "Pappardelle al tartufo",
    categoryId: "pasta",
    description: "Rigatoni med oxkött, champinjoner, chili, grädde, tryffelolja och parmesan.",
    ingredients: ["Rigatoni", "Oxkött", "Champinjoner", "Chili", "Grädde", "Tryffelolja", "Parmesan"],
    price: 159,
    allergens: ["gluten", "mjölk"]
  }),

  pizza(26, "margherita", "Margherita", ["Tomat", "Ost"], 89, ["Vegetarisk"]),
  pizza(27, "vesuvio", "Vesuvio", ["Skinka"], 89),
  pizza(28, "capricciosa", "Capricciosa", ["Skinka", "Champinjoner"], 94),
  pizza(29, "mamma-rosa", "Mamma Rosa", ["Skinka", "Champinjoner", "Räkor"], 99),
  pizza(30, "maffia", "Maffia", ["Skinka", "Räkor"], 94),
  pizza(31, "gorgonzola", "Gorgonzola", ["Skinka", "Gorgonzolaost"], 94),
  pizza(32, "quattro-stagione", "Quattro Stagione", ["Skinka", "Champinjoner", "Räkor", "Musslor"], 109),
  pizza(33, "hawaii", "Hawaii", ["Skinka", "Ananas"], 94),
  pizza(34, "tutti-frutti", "Tutti Frutti", ["Skinka", "Banan", "Ananas", "Curry"], 99),
  pizza(35, "tropicana", "Tropicana", ["Skinka", "Räkor", "Champinjoner", "Ananas", "Banan"], 109),
  pizza(36, "flygande-jakob", "Flygande Jakob", ["Kyckling", "Banan", "Ananas", "Jordnötter", "Curry"], 109),
  pizza(37, "husets-special", "Husets Special", ["Skinka", "Champinjoner", "Lök", "Bacon", "Ägg"], 109),
  pizza(38, "marinara", "Marinara", ["Räkor", "Musslor"], 99),
  pizza(39, "torino", "Torino", ["Tonfisk", "Lök"], 89),
  pizza(40, "napolitana", "Napolitana", ["Sardeller", "Lök", "Oliver", "Capris", "Vitlök"], 109),
  pizza(41, "bolero", "Bolero", ["Skinka", "Champinjoner", "Oxfilé", "Bearnaisesås"], 109),
  pizza(42, "provencale", "Provencale", ["Champinjoner", "Oxfilé", "Ananas", "Bearnaisesås", "Gorgonzolaost"], 119),
  pizza(43, "ceasar", "Ceasar", ["Oxfilé", "Champinjoner"], 109),
  pizza(44, "kycklingpizza", "Kycklingpizza", ["Kyckling", "Valfri sås"], 94),
  pizza(45, "gyros-pizza", "Gyros Pizza", ["Grillad fläskkarré", "Lök", "Isbergssallad", "Feferoni", "Färsk tomat", "Valfri sås"], 109),
  pizza(46, "kebab-pizza", "Kebab Pizza", ["Kebabkött", "Lök", "Isbergssallad", "Feferoni", "Färsk tomat", "Valfri sås"], 109),
  pizza(47, "salamina", "Salamina", ["Salami", "Lök", "Oliver"], 99),
  pizza(48, "pizza-bolognese", "Bolognese", ["Köttfärs", "Paprika"], 94),
  pizza(49, "azteca", "Azteca", ["Skinka", "Jalapeño", "Stark sås", "Vitlökssås", "Tacokrydda"], 99, ["Stark"]),
  pizza(50, "gud-fadern", "Gud Fadern", ["Skinka", "Paprika", "Oliver", "Tabasco"], 99, ["Stark"]),
  pizza(51, "bomba", "Bomba", ["Skinka", "Bacon", "Räkor", "Svamp", "Stark sås"], 109, ["Stark"]),
  pizza(52, "mexicana", "Mexicana", ["Köttfärs", "Lök", "Tacokrydda", "Vitlök", "Stark sås"], 109, ["Stark"]),
  pizza(53, "mexikansk-kebab", "Mexikansk Kebab", ["Kebabkött", "Lök", "Jalapeño", "Stark sås", "Tacokrydda"], 109, ["Stark"]),
  pizza(54, "acapulco", "Acapulco", ["Oxfilé", "Lök", "Champinjoner", "Tacosås", "Jalapeño", "Stark sås"], 119, ["Stark"]),
  pizza(55, "skana-pizza", "Skåna pizza", ["Grillad fläskkarré", "Skinka", "Bacon", "Lök"], 99),
  pizza(56, "gondola", "Gondola", ["Kebabkött", "Lök", "Champinjoner", "Bearnaisesås"], 109),
  pizza(57, "calzone", "Calzone", ["Skinka", "Champinjoner"], 89),
  pizza(58, "vegetale", "Vegetale", ["Paprika", "Oliver", "Svamp", "Kronärtskocka", "Lök"], 99, ["Vegetarisk"]),

  gourmet(59, "parma-ruccola", "Parma Ruccola", ["Prosciutto", "Ruccola", "Pesto"], 124),
  gourmet(60, "al-tartufo", "Al Tartufo", ["Oxkött", "Champinjoner", "Ruccola", "Rödlök", "Tryffelolja"], 129),
  gourmet(61, "cacciatore", "Cacciatore", ["Salami", "Grillad paprika", "Champinjoner", "Vitlök"], 129),
  gourmet(62, "verdure", "Verdure", ["Färska champinjoner", "Grillad paprika", "Grillad kronärtskocka", "Körsbärstomater", "Ruccola", "Gourmetsalt"], 124, ["Vegetarisk"]),
  gourmet(63, "fratelli", "Fratelli", ["Prosciutto", "Kalamataoliver", "Körsbärstomater", "Ruccola", "Pesto", "Hyvlad parmesan", "Rödlök"], 129),
  gourmet(64, "gourme", "Gourmé", ["Gorgonzolaost", "Champinjoner", "Rostade pinjenötter", "Prosciutto", "Ruccola", "Creme fraiche"], 129),
  gourmet(65, "toscana", "Toscana", ["Mozzarella", "Salsiccia", "Basilika", "Hyvlad parmesan"], 129),
  gourmet(66, "gamberi-e-zucchine", "Gamberi e zucchine", ["Räkor", "Grillad zucchini", "Ruccola"], 129),
  gourmet(67, "con-verdure-grigliate", "Con verdure grigliate", ["Champinjoner", "Kronärtskocka", "Grillad zucchini", "Aubergine", "Paprika", "Oliver", "Ruccola", "Soltorkade tomater"], 129, ["Vegetarisk"]),
  gourmet(68, "bella-vita", "Bella Vita", ["Fänkålssalami", "Chèvre", "Grillad kronärtskocka", "Basilika", "Parmesan"], 124),
  gourmet(69, "catania", "Catania", ["Fikonmarmelad", "Valnötter", "Parmaskinka", "Gorgonzola"], 119),
  gourmet(70, "alla-norma", "Alla norma", ["Grillad zucchini", "Aubergine", "Soltorkade tomater"], 124, ["Vegetarisk"]),

  dish({
    number: 71,
    slug: "parma-sallad",
    name: "Parma Sallad",
    categoryId: "sallad",
    description: "Lufttorkad skinka, sallad, ruccola, rödlök, pesto, tomat och färskt hembakat bröd.",
    ingredients: ["Lufttorkad skinka", "Sallad", "Ruccola", "Rödlök", "Pesto", "Tomat", "Hembakat bröd"],
    price: 139,
    allergens: ["gluten", "mjölk"]
  }),
  dish({
    number: 72,
    slug: "grekisk-sallad",
    name: "Grekisk Sallad",
    categoryId: "sallad",
    description: "Fårost, oliver, pepperoni, sallad, rödlök, tomat och färskt hembakat bröd.",
    ingredients: ["Fårost", "Oliver", "Pepperoni", "Sallad", "Rödlök", "Tomat", "Hembakat bröd"],
    price: 109,
    allergens: ["gluten", "mjölk"],
    badges: ["vegetarian"]
  }),
  dish({
    number: 73,
    slug: "raksallad",
    name: "Räksallad",
    categoryId: "sallad",
    description: "Räkor, citron, oliver, sallad, rödlök, tomat och färskt hembakat bröd.",
    ingredients: ["Räkor", "Citron", "Oliver", "Sallad", "Rödlök", "Tomat", "Hembakat bröd"],
    price: 109,
    allergens: ["skaldjur", "gluten"]
  }),
  dish({
    number: 74,
    slug: "multi-sallad",
    name: "Multi Sallad",
    categoryId: "sallad",
    description: "Valfri kebab, kyckling eller gyros med sallad, rödlök, tomat, valfri sås och färskt hembakat bröd.",
    ingredients: ["Kebab eller kyckling eller gyros", "Sallad", "Rödlök", "Tomat", "Valfri sås", "Hembakat bröd"],
    price: 119,
    allergens: ["gluten"]
  }),

  dish({
    number: 75,
    slug: "tiramisu",
    name: "Tiramisu",
    categoryId: "desserts",
    description: "Italiensk dessert. Exakt utbud bekräftas av personalen.",
    ingredients: ["Mascarpone", "Kaffe", "Kakao"],
    price: 0,
    priceLabel: "Fråga oss",
    allergens: ["mjölk", "ägg", "gluten"],
    tags: ["Utbud kan variera"]
  }),
  dish({
    number: 76,
    slug: "pannacotta",
    name: "Pannacotta",
    categoryId: "desserts",
    description: "Len italiensk dessert. Exakt smak och pris bekräftas på plats.",
    ingredients: ["Grädde", "Vanilj"],
    price: 0,
    priceLabel: "Fråga oss",
    allergens: ["mjölk"],
    tags: ["Utbud kan variera"]
  }),

  dish({
    number: 77,
    slug: "avhamtning-pizza-info",
    name: "Ring för avhämtning",
    categoryId: "avhamtning-pizza",
    description: "Pizza kan beställas för avhämtning via telefon. Onlinebeställning är inte aktiverad.",
    ingredients: ["Telefonbeställning", "Avhämtning"],
    price: 0,
    priceLabel: "Ring 0417-13 13 3",
    tags: ["Onlinebeställning kommer snart"]
  }),
  dish({
    number: 78,
    slug: "familjepizza-info",
    name: "Familjepizza",
    categoryId: "avhamtning-pizza",
    description: "Familjepizzor finns för flera pizzor. Pris och tillgänglighet bekräftas när du ringer.",
    ingredients: ["Familjestorlek", "Telefonbeställning"],
    price: 0,
    priceLabel: "Fråga oss",
    tags: ["Pris bekräftas vid beställning"]
  }),

  dish({
    number: 79,
    slug: "barnpizza",
    name: "Barnpizza",
    categoryId: "barnmeny",
    description: "Barnvänlig pizza. Fråga personalen om dagens alternativ.",
    ingredients: ["Tomatsås", "Ost"],
    price: 0,
    priceLabel: "Fråga oss",
    allergens: ["gluten", "mjölk"]
  }),
  dish({
    number: 80,
    slug: "barnpasta",
    name: "Barnpasta",
    categoryId: "barnmeny",
    description: "Enkel pasta för barn. Fråga personalen om sås och allergener.",
    ingredients: ["Pasta"],
    price: 0,
    priceLabel: "Fråga oss",
    allergens: ["gluten"]
  }),
  dish({
    number: 81,
    slug: "barn-fish-and-chips",
    name: "Barn fish and chips",
    categoryId: "barnmeny",
    description: "Mindre portion för barn när tillgänglig.",
    ingredients: ["Fisk", "Pommes frites"],
    price: 0,
    priceLabel: "Fråga oss",
    allergens: ["fisk", "gluten"]
  }),

  dish({
    number: 82,
    slug: "allergi-info",
    name: "Har du allergier?",
    categoryId: "allergi-information",
    description:
      "Vi hjälper gärna till. Det finns alternativ som glutenfri pizza, pasta och hamburgerbröd samt laktosfri pasta.",
    ingredients: ["Glutenintolerans", "Laktosintolerans", "Äggallergi", "Nötallergi", "Skaldjursallergi"],
    price: 0,
    priceLabel: "Fråga oss",
    tags: ["Informera personalen innan beställning"]
  }),

  dish({
    number: 83,
    slug: "alkoholdrycker-info",
    name: "Alkoholdrycker",
    categoryId: "drycker",
    description:
      "Italienska viner, cocktails och öl visas endast som information. Alkohol är inte aktiverat för onlinebeställning.",
    ingredients: ["Vin", "Cocktails", "Öl"],
    price: 0,
    priceLabel: "På plats",
    tags: ["Informationsvisning", "Ej onlinebeställning"]
  }),
  dish({
    number: 84,
    slug: "alkoholfritt-info",
    name: "Alkoholfritt",
    categoryId: "drycker",
    description: "Fråga personalen om dagens alkoholfria alternativ.",
    ingredients: ["Alkoholfri dryck"],
    price: 0,
    priceLabel: "Fråga oss",
    tags: ["Utbud kan variera"]
  })
];
