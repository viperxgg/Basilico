import { requirePageSession } from "@/lib/auth/server";
import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { MenuDishManager } from "@/components/admin/menu-dish-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenuDishesPage() {
  await requirePageSession(["ADMIN"], "/admin/menu/dishes");
  const currentDraft = await menuReleaseStore.getCurrentDraftEditor();

  return <MenuDishManager currentDraft={currentDraft} />;
}
