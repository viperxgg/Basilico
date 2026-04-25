import { StaffDashboard } from "@/components/admin/staff-dashboard";
import { basilicoBranding } from "@/data/restaurants/basilico";
import { getAssignedStaffFromSession } from "@/lib/auth/auth-store";
import { requirePageSession } from "@/lib/auth/server";
import { orderStore } from "@/lib/store/order-store";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await requirePageSession(["ADMIN"], "/admin/orders");
  const orders = await orderStore.listOrders();

  return (
    <StaffDashboard
      initialActivities={orders}
      currentStaff={getAssignedStaffFromSession(session)}
      restaurantName={basilicoBranding.name}
      restaurantTagline="Beställningar från QR-menyn"
    />
  );
}
