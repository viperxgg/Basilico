import { redirect } from "next/navigation";

import { PortalChooser } from "@/components/auth/portal-chooser";
import { getInternalHomePath, getServerSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?next=/portal");
  }

  const { roles } = session.user;
  const hasAdmin = roles.includes("ADMIN");
  const hasKitchen = roles.includes("KITCHEN");

  if (!hasAdmin && !hasKitchen) {
    redirect("/");
  }

  if (!(hasAdmin && hasKitchen)) {
    redirect(getInternalHomePath(session));
  }

  return <PortalChooser session={session} />;
}
