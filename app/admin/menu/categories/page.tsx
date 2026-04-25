import { requirePageSession } from "@/lib/auth/server";
import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { MenuCategoryManager } from "@/components/admin/menu-category-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenuCategoriesPage() {
  await requirePageSession(["ADMIN"], "/admin/menu/categories");
  const currentDraft = await menuReleaseStore.getCurrentDraftEditor();

  return <MenuCategoryManager currentDraft={currentDraft} />;
}
