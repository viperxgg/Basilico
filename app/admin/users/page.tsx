import { OperationsPlaceholder } from "@/components/admin/operations-placeholder";
import { requirePageSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requirePageSession(["ADMIN"], "/admin/users");

  return (
    <OperationsPlaceholder
      title="Personal och roller"
      description="Admin- och köksanvändare skapas via säkra miljövariabler och databasen, inte via hårdkodade lösenord."
      status="Status: bootstrap-användare kräver starka lösenord i Vercel innan överlämning."
    />
  );
}
