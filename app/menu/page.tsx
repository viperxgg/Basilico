import { Suspense } from "react";

import { MenuLoadingShell } from "@/components/menu/menu-loading-shell";
import { MenuTemplateHome } from "@/components/menu/menu-template-home";
import { PublicMenuUnavailable } from "@/components/menu/public-menu-unavailable";
import { getPublishedRestaurantOrNull } from "@/lib/menu/restaurants";

type MenuIndexPageProps = {
  searchParams: Promise<{
    table?: string;
  }>;
};

export default async function MenuIndexPage({
  searchParams
}: MenuIndexPageProps) {
  const { table } = await searchParams;
  const restaurant = await getPublishedRestaurantOrNull();

  if (!restaurant) {
    return <PublicMenuUnavailable />;
  }

  return (
    <Suspense fallback={<MenuLoadingShell />}>
      <MenuTemplateHome
        restaurant={restaurant}
        initialTableLabel={typeof table === "string" ? table : ""}
      />
    </Suspense>
  );
}
