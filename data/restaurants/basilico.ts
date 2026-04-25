import type { RestaurantBranding } from "@/lib/types/restaurant";

export const basilicoBranding: RestaurantBranding = {
  name: "Basilico",
  shortName: "Basilico",
  tagline: "Italienska smaker med en lokal känsla",
  location: "Banmästaregatan 2, Tomelilla",
  addressLine: "Banmästaregatan 2, Tomelilla 273 34, Sweden",
  phone: "0417-13 13 3",
  phoneHref: "tel:+4641713133",
  concept: "Authentic Italian food with a Swedish/local ingredient twist",
  description:
    "Välkommen till Basilico i Tomelilla. Här möter klassiska italienska smaker lokala råvaror i en varm, familjevänlig restaurangmiljö.",
  footerNote:
    "Basilico · Banmästaregatan 2, Tomelilla · Har du allergier? Fråga oss gärna.",
  locale: "sv-SE",
  currency: "SEK",
  cuisine: ["italian", "pizza", "pasta", "swedish-local", "family"],
  theme: {
    primaryColor: "#2f6b3f",
    accentColor: "#c73f2f"
  },
  primaryActionLabel: "Ring och beställ",
  galleryImages: [],
  orderingMode: "browsing-only",
  lastUpdatedLabel: "25 april 2026",
  openingHours: [
    { day: "Måndag", hours: "Stängt" },
    { day: "Tisdag", hours: "16:00-21:00" },
    { day: "Onsdag", hours: "16:00-21:00" },
    { day: "Torsdag", hours: "16:00-21:00" },
    { day: "Fredag", hours: "15:00-21:00" },
    { day: "Lördag", hours: "12:00-21:00" },
    { day: "Söndag", hours: "14:00-20:00" }
  ]
};
