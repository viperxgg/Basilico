function resolveSiteUrl() {
  const explicitDomain = process.env.RESTAURANT_DOMAIN?.trim();
  const fallbackDomain = process.env.FALLBACK_DOMAIN?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const domain = explicitDomain || fallbackDomain || vercelUrl;

  if (!domain) {
    return "https://basilico.nordapp.se";
  }

  return domain.startsWith("http://") || domain.startsWith("https://")
    ? domain
    : `https://${domain}`;
}

export const siteConfig = {
  name: "Basilico",
  description: "Smart QR-meny för Basilico i Tomelilla.",
  url: resolveSiteUrl(),
  defaultRestaurantSlug: "basilico",
  orderingMode: "enabled" as "enabled" | "browsing-only",
  orderMessages: {
    success: "Beställningen har skickats",
    successDescription: "Tack! Restaurangen har tagit emot din beställning.",
    genericError: "Något gick fel. Försök igen.",
    genericHelp: "Kontakta personalen om problemet kvarstår.",
    closed: "Restaurangen är stängd just nu",
    orderingDisabled: "Beställning är tillfälligt pausad. Tillkalla personal vid bordet.",
    emptyCart: "Din beställning är tom.",
    tableRequired: "Ange bordsnummer innan du skickar beställningen.",
    invalidTable: "Ange ett giltigt bordsnummer innan du skickar beställningen.",
    invalidQuantity: "Kontrollera antal och försök igen.",
    submitting: "Skickar beställning...",
    addToCart: "Uppdaterar beställning..."
  }
} as const;
