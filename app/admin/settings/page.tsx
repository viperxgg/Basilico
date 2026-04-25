import { OperationsPlaceholder } from "@/components/admin/operations-placeholder";
import { requirePageSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePageSession(["ADMIN"], "/admin/settings");

  return (
    <OperationsPlaceholder
      title="Restauranginställningar"
      description="Profil, öppettider, kontaktuppgifter och bildgalleri är modellerade för Basilico och ska ändras kontrollerat inför lansering."
      status="Status: onlinebeställning är låst till browsing-only tills aktiveringschecklistan är klar."
    />
  );
}
