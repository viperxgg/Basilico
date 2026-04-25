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
  description: "Digital meny för Basilico i Tomelilla.",
  url: resolveSiteUrl(),
  defaultRestaurantSlug: "basilico",
  orderingMode: "browsing-only" as "enabled" | "browsing-only",
  orderMessages: {
    success: "Din beställning har skickats!",
    successDescription: "Tack! Köket har mottagit din beställning.",
    genericError: "Något gick fel. Försök igen.",
    genericHelp: "Kontakta personalen om problemet kvarstår.",
    closed: "Restaurangen är stängd just nu",
    orderingDisabled:
      "Onlinebeställning kommer snart. Ring oss gärna på 0417-13 13 3.",
    emptyCart: "Din beställning är tom.",
    tableRequired: "Ange bordsnummer innan du skickar beställningen.",
    invalidTable: "Ange ett giltigt bordsnummer innan du skickar beställningen.",
    invalidQuantity: "Kontrollera antal och försök igen.",
    submitting: "Skickar beställning...",
    addToCart: "Lägger till..."
  }
} as const;
