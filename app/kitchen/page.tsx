import { KitchenBoard } from "@/components/kitchen/kitchen-board";
import { basilicoBranding } from "@/data/restaurants/basilico";
import { getAssignedStaffFromSession } from "@/lib/auth/auth-store";
import { requirePageSession } from "@/lib/auth/server";
import { orderStore } from "@/lib/store/order-store";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const session = await requirePageSession(["KITCHEN"], "/kitchen");
  const orders = await orderStore.listOrders();

  return (
    <KitchenBoard
      initialOrders={orders}
      currentStaff={getAssignedStaffFromSession(session)}
      restaurantName={basilicoBranding.name}
      restaurantTagline={basilicoBranding.tagline ?? "Italienska smaker"}
    />
  );
}
