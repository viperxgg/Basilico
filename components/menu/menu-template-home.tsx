"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { CSSProperties } from "react";
import Image from "next/image";

import imgWineService from "@/9941173.webp";
import imgKitchenPasta from "@/kramig-carbonara-high-18qqdy.webp";
import imgKitchenMussels from "@/thumbnail_8358b768-1c24-4de7-bee6-d423fd1de1d0-high-l1cdcg.webp";
import imgKitchenBurger from "@/thumbnail_img_4994-high-jbctkn.webp";
import imgKitchenPlates from "@/thumbnail_img_5513-high-06ol4e.webp";
import imgKitchenRice from "@/thumbnail_img_6606-high-cgmqzk.webp";
import imgKitchenDessert from "@/thumbnail_img_6609-high.webp";
import imgKitchenPizza from "@/thumbnail_img_6761-high.webp";
import imgKitchenSeafoodPasta from "@/thumbnail_img_6762-high.webp";
import imgKitchenRustic from "@/thumbnail_img_6762-high-yd56kx.webp";
import imgKitchenGrill from "@/thumbnail_img_7355-high-nt6b3h.webp";
import imgKitchenService from "@/thumbnail_img_7370-high-u7eboo.webp";
import imgKitchenSteak from "@/thumbnail_img_7371-high.webp";
import imgKitchenPizzaGreen from "@/thumbnail_img_7756-high-6gicix.webp";
import imgKitchenFlatbread from "@/thumbnail_img_7771-high.webp";
import imgKitchenDessertHoney from "@/thumbnail_img_7994-high.webp";

import { normalizeTableId } from "@/lib/activity/normalize-table-id";
import { useCart } from "@/components/cart/cart-provider";
import { requestJson } from "@/lib/client/request-json";
import styles from "./menu-template-home.module.css";
import { DishCard } from "@/components/menu/dish-card";
import { getRestaurantSections } from "@/lib/menu/restaurant-helpers";
import type {
  DishRecord,
  MenuCategoryId,
  RestaurantTemplate
} from "@/lib/types/restaurant";

type MenuTemplateHomeProps = {
  restaurant: RestaurantTemplate;
  initialTableLabel?: string;
};

type CategoryNavigationKey = "all" | MenuCategoryId;
type Locale = "en" | "sv";
type ServiceDialog = "waiter" | "allergens" | null;

const uiDictionary: Record<
  Locale,
  {
    selection: string;
    order: string;
    details: string;
    needHelp: string;
    allergens: string;
    allergensCaption: string;
    cartTitle: string;
    emptyCart: string;
    close: string;
    continueBrowsing: string;
    requestWaiterTitle: string;
    requestWaiterBody: string;
    tableLabel: string;
    tablePlaceholder: string;
    requestWaiterSubmit: string;
    requestWaiterActive: string;
    allergenTitle: string;
    allergenBody: string;
    allergenNoteLabel: string;
    allergenNotePlaceholder: string;
    allergenSubmit: string;
    cancel: string;
    invalidTable: string;
    invalidAllergenNote: string;
    waiterToast: string;
    waiterDuplicateToast: string;
    waiterActiveMessage: string;
    waiterFailed: string;
    allergenToast: string;
    allergenFailed: string;
    addedToast: string;
    openNow: string;
    closedNow: string;
    openingStatusFallback: string;
    searchLabel: string;
    searchPlaceholder: string;
    callToOrder: string;
    orderSoonLabel: string;
    orderingDisabledNotice: string;
    noSearchResults: string;
    categories: Record<string, string>;
  }
> = {
  en: {
    selection: "Selection",
    order: "Order",
    details: "Details",
    needHelp: "Need help?",
    allergens: "Allergens",
    allergensCaption: "Tell us about your needs",
    cartTitle: "Your selection",
    emptyCart: "No dishes added yet",
    close: "Close",
    continueBrowsing: "Continue browsing",
    requestWaiterTitle: "Request a waiter",
    requestWaiterBody: "Send a quick request to the floor team from this table.",
    tableLabel: "Table reference",
    tablePlaceholder: "Table 12",
    requestWaiterSubmit: "Send request",
    requestWaiterActive: "Request active",
    allergenTitle: "Allergen assistance",
    allergenBody: "Tell the staff what you need help with before ordering.",
    allergenNoteLabel: "Dietary note",
    allergenNotePlaceholder: "No gluten, severe nut allergy...",
    allergenSubmit: "Send note",
    cancel: "Cancel",
    invalidTable: "Enter a valid table reference.",
    invalidAllergenNote: "Enter a dietary note.",
    waiterToast: "Waiter request sent",
    waiterDuplicateToast: "A waiter has already been notified",
    waiterActiveMessage: "Your assistance request is already active for this table.",
    waiterFailed: "Unable to request a waiter right now. Please try again.",
    allergenToast: "Allergen assistance requested",
    allergenFailed: "Unable to send the allergen request right now. Please try again.",
    addedToast: "Added to order",
    openNow: "Open now",
    closedNow: "Closed now",
    openingStatusFallback: "See opening hours",
    searchLabel: "Search menu",
    searchPlaceholder: "Search dishes, ingredients, allergens...",
    callToOrder: "Call staff",
    orderSoonLabel: "Order from the table",
    orderingDisabledNotice: "The order is sent to the restaurant.",
    noSearchResults: "No dishes matched your search.",
    categories: {
      all: "Selection",
      forratter: "Starters",
      "a-la-carte": "À la carte",
      pasta: "Pasta",
      pizza: "Pizza",
      gourmetpizzor: "Gourmet",
      sallad: "Salad",
      desserts: "Desserts",
      "avhamtning-pizza": "Pickup",
      barnmeny: "Kids",
      "allergi-information": "Allergies",
      drycker: "Drinks"
    }
  },
  sv: {
    selection: "Alla rätter",
    order: "Beställning",
    details: "Detaljer",
    needHelp: "Behöver du hjälp?",
    allergens: "Allergener",
    allergensCaption: "Berätta om dina behov",
    cartTitle: "Din beställning",
    emptyCart: "Inga rätter tillagda än",
    close: "Stäng",
    continueBrowsing: "Fortsätt välja",
    requestWaiterTitle: "Be om service",
    requestWaiterBody: "Skicka en snabb förfrågan till personalen från ditt bord.",
    tableLabel: "Bordsreferens",
    tablePlaceholder: "Bord 12",
    requestWaiterSubmit: "Skicka",
    requestWaiterActive: "Aktiv begäran",
    allergenTitle: "Hjälp med allergener",
    allergenBody: "Berätta för personalen vad du behöver hjälp med innan du beställer.",
    allergenNoteLabel: "Kostnotering",
    allergenNotePlaceholder: "Ingen gluten, svår nötallergi...",
    allergenSubmit: "Skicka notering",
    cancel: "Avbryt",
    invalidTable: "Ange en giltig bordsreferens.",
    invalidAllergenNote: "Ange en kostnotering.",
    waiterToast: "Personal tillkallad",
    waiterDuplicateToast: "Personalen är redan tillkallad",
    waiterActiveMessage: "Din servicebegäran är redan aktiv för detta bord.",
    waiterFailed: "Det gick inte att skicka servicebegäran just nu. Försök igen.",
    allergenToast: "Allergenhjälp begärd",
    allergenFailed: "Det gick inte att skicka allergenbegäran just nu. Försök igen.",
    addedToast: "Tillagd i beställningen",
    openNow: "Öppet nu",
    closedNow: "Stängt nu",
    openingStatusFallback: "Se öppettider",
    searchLabel: "Sök i menyn",
    searchPlaceholder: "Sök rätt, råvara eller allergen...",
    callToOrder: "Tillkalla personal",
    orderSoonLabel: "Beställ direkt från bordet",
    orderingDisabledNotice: "Beställningen skickas till restaurangen.",
    noSearchResults: "Inga rätter matchade din sökning.",
    categories: {
      all: "Alla rätter",
      forratter: "Förrätter",
      "a-la-carte": "À la carte",
      pasta: "Pasta",
      pizza: "Pizza",
      gourmetpizzor: "Gourmet",
      sallad: "Sallad",
      desserts: "Dessert",
      "avhamtning-pizza": "Avhämtning",
      barnmeny: "Barn",
      "allergi-information": "Allergi",
      drycker: "Dryck"
    }
  }
};

uiDictionary.sv = {
  selection: "Alla rätter",
  order: "Beställning",
  details: "Detaljer",
  needHelp: "Service vid bordet",
  allergens: "Allergener",
  allergensCaption: "Berätta om dina behov",
  cartTitle: "Din beställning",
  emptyCart: "Inga rätter tillagda än",
  close: "Stäng",
  continueBrowsing: "Fortsätt välja",
  requestWaiterTitle: "Tillkalla personal",
  requestWaiterBody: "Ange bordsnummer och skicka en förfrågan till personalen.",
  tableLabel: "Bordsnummer",
  tablePlaceholder: "Bord 12",
  requestWaiterSubmit: "Skicka förfrågan",
  requestWaiterActive: "Förfrågan skickad",
  allergenTitle: "Hjälp med allergener",
  allergenBody: "Berätta för personalen vad du behöver hjälp med innan du beställer.",
  allergenNoteLabel: "Allergier eller särskilda önskemål",
  allergenNotePlaceholder: "Till exempel glutenfritt, svår nötallergi eller fråga till personalen...",
  allergenSubmit: "Skicka notering",
  cancel: "Avbryt",
  invalidTable: "Ange ett giltigt bordsnummer.",
  invalidAllergenNote: "Ange en kostnotering.",
  waiterToast: "Personal tillkallad",
  waiterDuplicateToast: "Personalen är redan tillkallad",
  waiterActiveMessage: "Din förfrågan är redan aktiv för detta bord.",
  waiterFailed: "Det gick inte att skicka förfrågan just nu. Försök igen.",
  allergenToast: "Allergenhjälp begärd",
  allergenFailed: "Det gick inte att skicka allergenbegäran just nu. Försök igen.",
  addedToast: "Tillagd i beställningen",
  openNow: "Öppet nu",
  closedNow: "Stängt nu",
  openingStatusFallback: "Se öppettider",
  searchLabel: "Sök i menyn",
  searchPlaceholder: "Sök rätt, råvara eller allergen...",
  callToOrder: "Tillkalla personal",
  orderSoonLabel: "Beställ direkt från bordet",
  orderingDisabledNotice: "Beställningen skickas till restaurangen.",
  noSearchResults: "Inga rätter matchade din sökning.",
  categories: {
    all: "Alla rätter",
    forratter: "Förrätter",
    "a-la-carte": "À la carte",
    pasta: "Pasta",
    pizza: "Pizza",
    gourmetpizzor: "Gourmet",
    sallad: "Sallad",
    desserts: "Dessert",
    "avhamtning-pizza": "Avhämtning",
    barnmeny: "Barn",
    "allergi-information": "Allergi",
    drycker: "Dryck"
  }
};

function normalizeSwedishDay(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function dishMatchesSearch(dish: DishRecord, query: string) {
  if (!query) {
    return true;
  }

  const searchable = normalizeSearchValue(
    [
      dish.name,
      dish.description,
      ...dish.ingredients,
      ...dish.allergens,
      ...(dish.tags ?? [])
    ].join(" ")
  );

  return searchable.includes(query);
}

function getOpeningStatus(
  openingHours: RestaurantTemplate["branding"]["openingHours"],
  copy: {
    openNow: string;
    closedNow: string;
    openingStatusFallback: string;
  }
) {
  if (!openingHours || openingHours.length === 0) {
    return copy.openingStatusFallback;
  }

  const dayNames = [
    "sondag",
    "mandag",
    "tisdag",
    "onsdag",
    "torsdag",
    "fredag",
    "lordag"
  ];
  const now = new Date();
  const row = openingHours.find(
    (item) => normalizeSwedishDay(item.day) === dayNames[now.getDay()]
  );

  if (!row || normalizeSwedishDay(row.hours).includes("stangt")) {
    return copy.closedNow;
  }

  const match = row.hours.match(/(\d{1,2})\D+(\d{1,2})/);
  if (!match) {
    return copy.openingStatusFallback;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = Number(match[1]) * 60;
  const closeMinutes = Number(match[2]) * 60;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
    ? copy.openNow
    : copy.closedNow;
}

export function MenuTemplateHome({
  restaurant,
  initialTableLabel = ""
}: MenuTemplateHomeProps) {
  const routeTableLabel = initialTableLabel.trim();
  const locale: Locale = restaurant.branding.locale.startsWith("sv") ? "sv" : "en";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryNavigationKey>("all");
  const [activeAddDishId, setActiveAddDishId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [serviceDialog, setServiceDialog] = useState<ServiceDialog>(null);
  const [isSubmittingAssistance, setIsSubmittingAssistance] = useState(false);
  const [waiterTable, setWaiterTable] = useState(routeTableLabel);
  const [waiterMessage, setWaiterMessage] = useState("");
  const [allergenTable, setAllergenTable] = useState(routeTableLabel);
  const [allergenNote, setAllergenNote] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [activeWaiterTableIds, setActiveWaiterTableIds] = useState<string[]>([]);

  const sections = useMemo(() => getRestaurantSections(restaurant), [restaurant]);
  const normalizedSearchQuery = useMemo(
    () => normalizeSearchValue(searchQuery),
    [searchQuery]
  );
  const visibleSections = useMemo(
    () =>
      sections
        .map(({ category, dishes }) => ({
          category,
          dishes: dishes.filter((dish) =>
            dishMatchesSearch(dish, normalizedSearchQuery)
          )
        }))
        .filter(({ dishes }) => dishes.length > 0),
    [normalizedSearchQuery, sections]
  );
  const orderingEnabled = restaurant.branding.orderingMode !== "browsing-only";
  const sectionRefs = useRef<Partial<Record<MenuCategoryId, HTMLElement | null>>>(
    {}
  );
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const { addDish } = useCart();
  const copy = uiDictionary[locale];
  const themeStyle = useMemo(
    () =>
      ({
        "--brand-primary":
          restaurant.branding.theme?.primaryColor ?? "#344a3a",
        "--accent": restaurant.branding.theme?.accentColor ?? "#d4af37"
      }) as CSSProperties,
    [
      restaurant.branding.theme?.accentColor,
      restaurant.branding.theme?.primaryColor
    ]
  );
  const heroKicker = restaurant.branding.tagline
    ? `${restaurant.branding.location} · ${restaurant.branding.tagline}`
    : restaurant.branding.location;
  const openingStatus = useMemo(
    () => getOpeningStatus(restaurant.branding.openingHours, copy),
    [copy, restaurant.branding.openingHours]
  );
  const publicGalleryImages = [
    { src: imgKitchenPizza, alt: "Stämningsbild från Basilicos kök", kind: "atmosphere" },
    { src: imgKitchenPasta, alt: "Italienska smaker från Basilico", kind: "atmosphere" },
    { src: imgKitchenSteak, alt: "Varm restaurangkänsla hos Basilico", kind: "atmosphere" },
    { src: imgKitchenMussels, alt: "Serveringsbild från Basilico", kind: "atmosphere" },
    { src: imgKitchenBurger, alt: "Måltidskänsla från Basilicos kök", kind: "atmosphere" },
    { src: imgKitchenRice, alt: "Råvaror och smaker från Basilico", kind: "atmosphere" },
    { src: imgKitchenDessert, alt: "Söt avslutning som stämningsbild", kind: "atmosphere" },
    { src: imgKitchenDessertHoney, alt: "Dessertkänsla från Basilico", kind: "atmosphere" },
    { src: imgWineService, alt: "Dryckesservering som atmosfärsbild", kind: "atmosphere" },
    { src: imgKitchenService, alt: "Tallrikar från Basilicos kök", kind: "atmosphere" },
    { src: imgKitchenGrill, alt: "Grillad restaurangkänsla från Basilico", kind: "atmosphere" },
    { src: imgKitchenRustic, alt: "Rustik matupplevelse hos Basilico", kind: "atmosphere" },
    { src: imgKitchenPizzaGreen, alt: "Pizzakänsla från Basilico", kind: "atmosphere" },
    { src: imgKitchenSeafoodPasta, alt: "Medelhavskänsla från Basilico", kind: "atmosphere" },
    { src: imgKitchenPlates, alt: "Basilicos serveringsmiljö", kind: "atmosphere" },
    { src: imgKitchenFlatbread, alt: "Italiensk bakkänsla från Basilico", kind: "atmosphere" }
  ];
  const heroGalleryImages = publicGalleryImages.slice(0, 2);
  const detailTableLabel = routeTableLabel || undefined;
  const waiterTableId = useMemo(
    () => normalizeTableId(waiterTable),
    [waiterTable]
  );
  const routeTableId = useMemo(
    () => normalizeTableId(routeTableLabel),
    [routeTableLabel]
  );
  const hasActiveWaiterRequest =
    waiterTableId.length > 0 && activeWaiterTableIds.includes(waiterTableId);
  const hasActiveRouteWaiterRequest =
    routeTableId.length > 0 && activeWaiterTableIds.includes(routeTableId);

  const syncRouteWaiterRequestState = useCallback(async () => {
    if (!routeTableLabel || !routeTableId) {
      return;
    }

    try {
      const payload = await requestJson<{ active?: boolean }>(
        `/api/assistance?table=${encodeURIComponent(routeTableLabel)}`,
        {
          cache: "no-store",
          timeoutMs: 5000,
          retryCount: 1,
          retryDelayMs: 1000,
          fallbackMessage: copy.waiterFailed
        }
      );

      setActiveWaiterTableIds((current) => {
        const next = current.filter((tableId) => tableId !== routeTableId);

        return payload.active ? [routeTableId, ...next] : next;
      });
    } catch {
      return;
    }
  }, [copy.waiterFailed, routeTableId, routeTableLabel]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const closeServiceDialog = useCallback(() => {
    setServiceDialog(null);
    setDialogError(null);
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    if (!routeTableLabel || !routeTableId) {
      return;
    }

    let timeoutId: number | undefined;
    let cancelled = false;

    const scheduleNextPoll = () => {
      timeoutId = window.setTimeout(() => {
        void pollWaiterState();
      }, 5000);
    };

    const pollWaiterState = async () => {
      if (cancelled) {
        return;
      }

      if (document.visibilityState !== "visible") {
        scheduleNextPoll();
        return;
      }

      await syncRouteWaiterRequestState();
      scheduleNextPoll();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timeoutId);
        void pollWaiterState();
      }
    };

    void pollWaiterState();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [routeTableId, routeTableLabel, syncRouteWaiterRequestState]);

  const handleCategorySelect = useCallback((categoryKey: CategoryNavigationKey) => {
    setActiveCategory(categoryKey);

    if (categoryKey === "all") {
      document.getElementById("top")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } else {
      sectionRefs.current[categoryKey]?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, []);

  useEffect(() => {
    const observed: Array<{ element: Element; category: CategoryNavigationKey }> =
      [];

    if (topSentinelRef.current) {
      observed.push({ element: topSentinelRef.current, category: "all" });
    }

    visibleSections.forEach(({ category }) => {
      const element = sectionRefs.current[category.id];
      if (!element) {
        return;
      }

      observed.push({ element, category: category.id });
    });

    if (observed.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const next = visible[0]?.target;
        if (!next) {
          return;
        }

        const mapping = observed.find((entry) => entry.element === next);
        if (!mapping) {
          return;
        }

        setActiveCategory(mapping.category);
      },
      {
        threshold: 0.25,
        rootMargin: "-140px 0px -70% 0px"
      }
    );

    const timeoutId = window.setTimeout(() => {
      observed.forEach(({ element }) => observer.observe(element));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [visibleSections]);

  const handleAddDish = useCallback(
    (dish: DishRecord) => {
      if (!orderingEnabled) {
        return;
      }

      setActiveAddDishId(dish.id);
      addDish(dish, 1);
      window.setTimeout(() => {
        setActiveAddDishId((current) => (current === dish.id ? null : current));
      }, 260);
    },
    [addDish, orderingEnabled]
  );

  const handleCallWaiter = useCallback(() => {
    setDialogError(null);
    setServiceDialog("waiter");
  }, []);

  const handleAllergens = useCallback(() => {
    setDialogError(null);
    setServiceDialog("allergens");
  }, []);

  const submitWaiterRequest = useCallback(async () => {
    const trimmedTable = waiterTable.trim();
    const trimmedTableId = normalizeTableId(trimmedTable);
    const trimmedMessage = waiterMessage.trim();

    if (trimmedTable.length < 1 || isSubmittingAssistance) {
      setDialogError(copy.invalidTable);
      return;
    }

    if (activeWaiterTableIds.includes(trimmedTableId)) {
      setDialogError(copy.waiterActiveMessage);
      return;
    }

    setIsSubmittingAssistance(true);
    setDialogError(null);

    try {
      const payload = await requestJson<{
        assistance?: { tableLabel?: string };
        duplicate?: boolean;
        error?: string;
        message?: string;
      }>("/api/assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tableLabel: trimmedTable,
          requestType: "call_waiter",
          message: trimmedMessage || "Gästen vill tillkalla personal."
        }),
        timeoutMs: 8000,
        fallbackMessage: copy.waiterFailed
      });

      if (payload.duplicate) {
        setActiveWaiterTableIds((current) =>
          current.includes(trimmedTableId) ? current : [trimmedTableId, ...current]
        );
        setDialogError(payload.message ?? copy.waiterActiveMessage);
        showToast(payload.message ?? copy.waiterDuplicateToast);
        return;
      }

      setActiveWaiterTableIds((current) =>
        current.includes(trimmedTableId) ? current : [trimmedTableId, ...current]
      );
      showToast(`${copy.waiterToast}: ${trimmedTable}`);
      setWaiterTable(routeTableLabel || "");
      setWaiterMessage("");
      closeServiceDialog();
    } catch (error) {
      setDialogError(
        error instanceof Error
          ? error.message
          : copy.waiterFailed
      );
    } finally {
      setIsSubmittingAssistance(false);
    }
  }, [
    closeServiceDialog,
    copy.invalidTable,
    copy.waiterActiveMessage,
    copy.waiterFailed,
    copy.waiterDuplicateToast,
    copy.waiterToast,
    activeWaiterTableIds,
    isSubmittingAssistance,
    routeTableLabel,
    showToast,
    waiterMessage,
    waiterTable
  ]);

  const submitAllergenRequest = useCallback(async () => {
    const trimmedNote = allergenNote.trim();

    if (trimmedNote.length < 3 || isSubmittingAssistance) {
      setDialogError(copy.invalidAllergenNote);
      return;
    }

    const assistanceTableLabel = allergenTable.trim();

    if (assistanceTableLabel.length < 1) {
      setDialogError(copy.invalidTable);
      return;
    }

    setIsSubmittingAssistance(true);
    setDialogError(null);

    try {
      await requestJson("/api/assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tableLabel: assistanceTableLabel,
          requestType: "allergen_help",
          message: trimmedNote
        }),
        timeoutMs: 8000,
        fallbackMessage: copy.allergenFailed
      });

      showToast(copy.allergenToast);
      setAllergenTable("");
      setAllergenNote("");
      closeServiceDialog();
    } catch (error) {
      setDialogError(
        error instanceof Error
          ? error.message
          : copy.allergenFailed
      );
    } finally {
      setIsSubmittingAssistance(false);
    }
  }, [
    allergenNote,
    closeServiceDialog,
    copy.allergenFailed,
    copy.allergenToast,
    copy.invalidTable,
    copy.invalidAllergenNote,
    isSubmittingAssistance,
    showToast,
    allergenTable
  ]);

  return (
    <main className={styles.page} style={themeStyle}>
      <header
        className={styles.menuHeader}
      >
        <a className={styles.brandMark} href="#top" aria-label="Till menyns början">
          {restaurant.branding.entranceImageRef ? (
            <Image
              src={restaurant.branding.entranceImageRef}
              alt={restaurant.branding.entranceImageAlt ?? restaurant.branding.name}
              width={42}
              height={42}
              className={styles.brandLogo}
              sizes="42px"
            />
          ) : null}
          <span>
            <strong>{restaurant.branding.name}</strong>
            <small>{restaurant.branding.location}</small>
          </span>
        </a>

        <div className={styles.navControls}>
          <button
            type="button"
            className={styles.callWaiterButton}
            onClick={handleCallWaiter}
          >
            <span aria-hidden="true">Service</span>
            <span className={styles.callWaiterText}>
              {restaurant.branding.primaryActionLabel}
            </span>
          </button>
          <span className={styles.browsingPill}>
            {orderingEnabled ? "QR-beställning aktiv" : "Beställning pausad"}
          </span>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          {restaurant.branding.heroImageRef ? (
            <Image
              src={restaurant.branding.heroImageRef}
              alt={
                restaurant.branding.heroImageAlt ??
                `Matsalen hos ${restaurant.branding.name}`
              }
              fill
              className={styles.heroImage}
              sizes="100vw"
              priority
            />
          ) : null}
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroIdentity}>
            <p className={styles.heroKicker}>{heroKicker}</p>
            <h1 className={styles.heroTitle}>{restaurant.branding.name}</h1>
          </div>
          
          <div className={styles.heroStatusRow}>
            <span className={`${styles.statusPill} ${openingStatus === copy.openNow ? styles.statusOpen : ''}`}>
              <span className={styles.pulseDot} />
              {openingStatus}
            </span>
          </div>

          <p className={styles.heroDescription}>
            {restaurant.branding.description}
          </p>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.callOrderLink}
              onClick={handleCallWaiter}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {copy.callToOrder}
            </button>
            <div className={styles.infoBadge}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>{copy.orderingDisabledNotice}</span>
            </div>
          </div>

          <div className={styles.heroStatusGrid}>
            <div className={styles.heroStatusCard}>
              <span>Idag</span>
              <strong>{openingStatus}</strong>
            </div>
            <div className={styles.heroStatusCard}>
              <span>Digital meny</span>
              <strong>
                {orderingEnabled
                  ? "Skanna, välj och beställ direkt från bordet"
                  : "Beställning pausad"}
              </strong>
            </div>
            {restaurant.branding.addressLine ? (
              <div className={styles.heroStatusCard}>
                <span>Adress</span>
                <strong>{restaurant.branding.addressLine}</strong>
              </div>
            ) : null}
            {restaurant.branding.lastUpdatedLabel ? (
              <div className={styles.heroStatusCard}>
                <span>Senast uppdaterad</span>
                <strong>{restaurant.branding.lastUpdatedLabel}</strong>
              </div>
            ) : null}
          </div>

          {restaurant.branding.openingHours ? (
            <section className={styles.openingHours} aria-label="Öppettider">
              <h2 className={styles.openingHoursTitle}>Öppettider</h2>
              <div className={styles.openingHoursGrid}>
                {restaurant.branding.openingHours.map((item) => (
                  <div key={item.day} className={styles.openingHoursRow}>
                    <span>{item.day}</span>
                    <strong>{item.hours}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {heroGalleryImages.length > 0 ? (
            <div
              className={styles.heroGallery}
              aria-label="Bilder från restaurangen"
            >
              {heroGalleryImages.map((image) => (
                <div key={image.alt} className={styles.heroGalleryFrame}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={360}
                    height={260}
                    className={styles.heroGalleryImage}
                    sizes="(max-width: 640px) 42vw, 180px"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <nav id="top" className={styles.categoryBar} aria-label="Meny kategorier">
        <div className={styles.categoryBarInner}>
          <button
            type="button"
            className={`${styles.categoryTab} ${
              activeCategory === "all" ? styles.categoryTabActive : ""
            }`}
            aria-current={activeCategory === "all" ? "page" : undefined}
            onClick={() => handleCategorySelect("all")}
          >
            {copy.categories.all}
          </button>

          {sections.map(({ category }) => (
            <button
              type="button"
              key={category.id}
              className={`${styles.categoryTab} ${
                activeCategory === category.id ? styles.categoryTabActive : ""
              }`}
              aria-current={activeCategory === category.id ? "page" : undefined}
              onClick={() => handleCategorySelect(category.id)}
            >
              {copy.categories[category.id] ?? category.shortLabel}
            </button>
          ))}
        </div>
      </nav>

      <section className={`${styles.searchPanel} reveal`} aria-label={copy.searchLabel} style={{ animationDelay: '0.2s' }}>
        <label className={styles.searchField}>
          <span>{copy.searchLabel}</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            type="search"
          />
        </label>
      </section>

      <section className={styles.menuSections}>
        <div ref={topSentinelRef} className={styles.topSentinel} />
        {visibleSections.length === 0 ? (
          <div className={styles.emptySearchResult}>{copy.noSearchResults}</div>
        ) : null}
        {visibleSections.map(({ category, dishes }, index) => (
          <section
            key={category.id}
            id={`section-${category.id}`}
            className={`${styles.menuSection} reveal`}
            style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            ref={(element) => {
              sectionRefs.current[category.id] = element;
            }}
          >
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{category.label}</h2>
              {category.description ? (
                <p className={styles.sectionDescription}>
                  {category.description}
                </p>
              ) : null}
            </header>

            <div className={styles.menuGrid}>
              {dishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  restaurantSlug={restaurant.slug}
                  dish={dish}
                  tableLabel={detailTableLabel}
                  priority={dish.number <= 2}
                  detailLabel={copy.details}
                  isAdding={activeAddDishId === dish.id}
                  onAdd={orderingEnabled ? handleAddDish : undefined}
                />
              ))}
            </div>
          </section>
        ))}

        {publicGalleryImages.length > 0 ? (
          <section className={`${styles.gallerySection} reveal`} aria-labelledby="gallery-title" style={{ animationDelay: '0.5s' }}>
            <div className={styles.galleryHeader}>
              <p className={styles.galleryEyebrow}>Från Basilicos kök</p>
              <h2 id="gallery-title" className={styles.galleryTitle}>
                Smaker från Basilico
              </h2>
              <p className={styles.galleryDescription}>
                Bilderna visar restaurangens känsla och råvaror som allmän
                inspiration. De är inte kopplade till en enskild rätt.
              </p>
            </div>
            <div className={styles.galleryGrid}>
              {publicGalleryImages.map((image) => (
                <figure key={image.alt} className={styles.galleryCard}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={520}
                    height={360}
                    className={styles.galleryImage}
                    sizes="(max-width: 640px) 92vw, 30vw"
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className={`${styles.helpSection} reveal`} style={{ animationDelay: '0.6s' }}>
          <h2 className={styles.helpTitle}>{copy.needHelp}</h2>

          <div className={styles.helpGrid}>
            <button
              type="button"
              className={styles.helpCard}
              onClick={handleCallWaiter}
              aria-pressed={hasActiveRouteWaiterRequest}
            >
              <span className={styles.helpIcon} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </span>
              <div className={styles.helpText}>
                <h4>
                  {hasActiveRouteWaiterRequest
                    ? copy.requestWaiterActive
                    : "Tillkalla personal"}
                </h4>
                <p>Skicka en serviceförfrågan från bordet.</p>
              </div>
            </button>
            <button
              type="button"
              className={styles.helpCard}
              onClick={handleAllergens}
            >
              <span className={styles.helpIcon} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </span>
              <div className={styles.helpText}>
                <h4>{copy.allergens}</h4>
                <p>{copy.allergensCaption}</p>
              </div>
            </button>
          </div>

          <footer className={styles.footerNote}>
            <p>{restaurant.branding.footerNote}</p>
          </footer>
        </section>
      </section>
      {serviceDialog ? (
        <div
          className={styles.dialogOverlay}
          role="presentation"
          onClick={closeServiceDialog}
        >
          <section
            className={styles.dialogSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            {serviceDialog === "waiter" ? (
              <>
                <header className={styles.dialogHeader}>
                  <div>
                    <h2 id="service-dialog-title" className={styles.dialogTitle}>
                      {copy.requestWaiterTitle}
                    </h2>
                    <p className={styles.dialogDescription}>
                      {copy.requestWaiterBody}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.dialogCloseButton}
                    aria-label={copy.close}
                    onClick={closeServiceDialog}
                  >
                    X
                  </button>
                </header>

                <label className={styles.dialogField}>
                  <span>{copy.tableLabel}</span>
                  <input
                    value={waiterTable}
                    onChange={(event) => {
                      setWaiterTable(event.target.value);
                      setDialogError(null);
                    }}
                    placeholder={copy.tablePlaceholder}
                    className={styles.dialogInput}
                  />
                </label>

                <label className={styles.dialogField}>
                  <span>Meddelande till personalen</span>
                  <textarea
                    value={waiterMessage}
                    onChange={(event) => {
                      setWaiterMessage(event.target.value);
                      setDialogError(null);
                    }}
                    placeholder="Valfritt, till exempel: Vi behöver hjälp med menyn."
                    className={styles.dialogTextarea}
                    maxLength={280}
                  />
                </label>

                {dialogError ? (
                  <p className={styles.dialogError}>{dialogError}</p>
                ) : hasActiveWaiterRequest ? (
                  <p className={styles.dialogError}>{copy.waiterActiveMessage}</p>
                ) : null}

                <div className={styles.dialogActions}>
                  <button
                    type="button"
                    className={styles.dialogSecondaryButton}
                    onClick={closeServiceDialog}
                    disabled={isSubmittingAssistance}
                  >
                    {copy.cancel}
                  </button>
                  <button
                    type="button"
                    className={styles.dialogPrimaryButton}
                    onClick={submitWaiterRequest}
                    disabled={isSubmittingAssistance || hasActiveWaiterRequest}
                  >
                    {isSubmittingAssistance
                      ? "Skickar..."
                      : hasActiveWaiterRequest
                        ? copy.requestWaiterActive
                        : copy.requestWaiterSubmit}
                  </button>
                </div>
              </>
            ) : null}

            {serviceDialog === "allergens" ? (
              <>
                <header className={styles.dialogHeader}>
                  <div>
                    <h2 id="service-dialog-title" className={styles.dialogTitle}>
                      {copy.allergenTitle}
                    </h2>
                    <p className={styles.dialogDescription}>
                      {copy.allergenBody}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.dialogCloseButton}
                    aria-label={copy.close}
                    onClick={closeServiceDialog}
                  >
                    X
                  </button>
                </header>

                <label className={styles.dialogField}>
                  <span>{copy.tableLabel}</span>
                  <input
                    value={allergenTable}
                    onChange={(event) => {
                      setAllergenTable(event.target.value);
                      setDialogError(null);
                    }}
                    placeholder={copy.tablePlaceholder}
                    className={styles.dialogInput}
                  />
                </label>

                <label className={styles.dialogField}>
                  <span>{copy.allergenNoteLabel}</span>
                  <textarea
                    value={allergenNote}
                    onChange={(event) => {
                      setAllergenNote(event.target.value);
                      setDialogError(null);
                    }}
                    placeholder={copy.allergenNotePlaceholder}
                    className={styles.dialogTextarea}
                  />
                </label>

                {dialogError ? (
                  <p className={styles.dialogError}>{dialogError}</p>
                ) : null}

                <div className={styles.dialogActions}>
                  <button
                    type="button"
                    className={styles.dialogSecondaryButton}
                    onClick={closeServiceDialog}
                    disabled={isSubmittingAssistance}
                  >
                    {copy.cancel}
                  </button>
                  <button
                    type="button"
                    className={styles.dialogPrimaryButton}
                    onClick={submitAllergenRequest}
                    disabled={isSubmittingAssistance}
                  >
                    {isSubmittingAssistance ? "Skickar..." : copy.allergenSubmit}
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      {toastMessage ? (
        <div className={styles.toast} role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </main>
  );
}
