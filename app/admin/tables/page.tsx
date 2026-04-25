import { OperationsPlaceholder } from "@/components/admin/operations-placeholder";
import { requirePageSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
  await requirePageSession(["ADMIN"], "/admin/tables");

  return (
    <OperationsPlaceholder
      title="Bord och QR"
      description="Bords- och QR-hantering är reserverad för Basilicos skarpa bordsplan."
      status="Status: bord ska läggas in efter att restaurangen godkänt nummersättning och QR-url."
    />
  );
}
