import { OperationsPlaceholder } from "@/components/admin/operations-placeholder";
import { requirePageSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminAssistancePage() {
  await requirePageSession(["ADMIN"], "/admin/assistance");

  return (
    <OperationsPlaceholder
      title="Serviceförfrågningar"
      description="Här samlas tillkalla-personal och allergenfrågor när driftflödet är verifierat."
      status="Status: skyddad yta finns, livehantering verifieras före skarp drift."
    />
  );
}
