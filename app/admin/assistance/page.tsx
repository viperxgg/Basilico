import { StaffDashboard } from "@/components/admin/staff-dashboard";
import { basilicoBranding } from "@/data/restaurants/basilico";
import { getAssignedStaffFromSession } from "@/lib/auth/auth-store";
import { requirePageSession } from "@/lib/auth/server";
import { assistanceStore } from "@/lib/store/assistance-store";

export const dynamic = "force-dynamic";

export default async function AdminAssistancePage() {
  const session = await requirePageSession(["ADMIN"], "/admin/assistance");
  const assistance = await assistanceStore.list();

  return (
    <StaffDashboard
      initialActivities={assistance}
      currentStaff={getAssignedStaffFromSession(session)}
      restaurantName={basilicoBranding.name}
      restaurantTagline="Serviceförfrågningar från gäster"
    />
  );
}
