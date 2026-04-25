import { requirePageSession } from "@/lib/auth/server";
import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { MenuReleaseManager } from "@/components/admin/menu-release-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  await requirePageSession(["ADMIN"], "/admin/menu");
  const [releases, currentDraft] = await Promise.all([
    menuReleaseStore.listReleases(),
    menuReleaseStore.getCurrentDraftEditor()
  ]);

  return (
    <MenuReleaseManager
      releases={releases}
      currentDraft={currentDraft}
    />
  );
}
