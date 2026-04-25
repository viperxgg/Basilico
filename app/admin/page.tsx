import { StaffDashboard } from "@/components/admin/staff-dashboard";
import { basilicoBranding } from "@/data/restaurants/basilico";
import { getAssignedStaffFromSession } from "@/lib/auth/auth-store";
import { requirePageSession } from "@/lib/auth/server";
import { listInternalActivities } from "@/lib/store/internal-operations";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requirePageSession(["ADMIN"], "/admin");
  const activities = await listInternalActivities();

  return (
    <StaffDashboard
      initialActivities={activities}
      currentStaff={getAssignedStaffFromSession(session)}
      restaurantName={basilicoBranding.name}
      restaurantTagline={basilicoBranding.tagline ?? "Italienska smaker"}
    />
  );
}
