import { OperationsPlaceholder } from "@/components/admin/operations-placeholder";
import { requirePageSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requirePageSession(["ADMIN"], "/admin/orders");

  return (
    <OperationsPlaceholder
      title="Orderhistorik"
      description="Ordervyn är skyddad och förberedd för Basilico. Onlinebeställning är avstängd tills PostgreSQL, behörigheter och köksflöde är verifierade."
      status="Status: väntar på produktionsverifiering innan orderhistorik aktiveras."
    />
  );
}
