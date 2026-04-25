import { Suspense } from "react";

import { MenuLoadingShell } from "@/components/menu/menu-loading-shell";
import { MenuTemplateHome } from "@/components/menu/menu-template-home";
import { PublicMenuUnavailable } from "@/components/menu/public-menu-unavailable";
import { getPublishedRestaurantOrNull } from "@/lib/menu/restaurants";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    table?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
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
