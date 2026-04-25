import { categories } from "@/data/categories";
import { dishes } from "@/data/dishes";
import { basilicoBranding } from "@/data/restaurants/basilico";
import type { RestaurantTemplate } from "@/lib/types/restaurant";

export const restaurant: RestaurantTemplate = {
  slug: "basilico",
  branding: basilicoBranding,
  settings: {
    showAlcohol: true
  },
  categoryOrder: [
    "forratter",
    "a-la-carte",
    "pasta",
    "pizza",
    "gourmetpizzor",
    "sallad",
    "desserts",
    "avhamtning-pizza",
    "barnmeny",
    "allergi-information",
    "drycker"
  ],
  categories,
  dishes
};
