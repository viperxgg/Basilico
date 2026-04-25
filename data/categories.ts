import type { MenuCategory } from "@/lib/types/restaurant";

export const categories: MenuCategory[] = [
  {
    id: "forratter",
    label: "Förrätter",
    shortLabel: "Förrätter",
    description: "Små rätter att börja med, med italienska smaker och fräscha råvaror."
  },
  {
    id: "a-la-carte",
    label: "À la carte",
    shortLabel: "À la carte",
    description: "Kött, fisk och varma rätter för dig som vill äta lite längre."
  },
  {
    id: "pasta",
    label: "Pasta",
    shortLabel: "Pasta",
    description: "Klassiska pastarätter med parmesan, basilika, skaldjur och tryffel."
  },
  {
    id: "pizza",
    label: "Pizza",
    shortLabel: "Pizza",
    description: "Tomatsås och ost ingår i alla goda pizzor."
  },
  {
    id: "gourmetpizzor",
    label: "Gourmetpizzor",
    shortLabel: "Gourmet",
    description: "Pizzor med extra utvalda råvaror, ruccola, tryffel och italienska charkuterier."
  },
  {
    id: "sallad",
    label: "Sallad",
    shortLabel: "Sallad",
    description: "Fräscha sallader med nybakat bröd."
  },
  {
    id: "desserts",
    label: "Desserts",
    shortLabel: "Dessert",
    description: "Söta avslut i italiensk anda."
  },
  {
    id: "avhamtning-pizza",
    label: "Avhämtning Pizza",
    shortLabel: "Avhämtning",
    description: "Ring oss för avhämtning. Familjepizzor bekräftas vid beställning."
  },
  {
    id: "barnmeny",
    label: "Barnmeny",
    shortLabel: "Barn",
    description: "Enkla och familjevänliga alternativ för yngre gäster."
  },
  {
    id: "allergi-information",
    label: "Allergi information",
    shortLabel: "Allergi",
    description: "Har du allergier eller särskilda behov? Fråga oss gärna innan du beställer."
  },
  {
    id: "drycker",
    label: "Alkoholdrycker / Drycker",
    shortLabel: "Dryck",
    description: "Dryckesutbudet är informationsvisning. Alkohol är inte aktiverat för onlinebeställning.",
    isAlcohol: true
  }
];
