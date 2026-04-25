import { redirect } from "next/navigation";

type DishDetailsPageProps = {
  params: Promise<{
    slug: string;
    dishSlug: string;
  }>;
  searchParams?: Promise<{
    table?: string;
  }>;
};

export default async function DishDetailsPage({
  params,
  searchParams
}: DishDetailsPageProps) {
  // Legacy compatibility route only. Ignore the menu slug and redirect to
  // the canonical public dish route `/dish/[dishSlug]`.
  const { dishSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tableLabel = resolvedSearchParams?.table;
  // Phase 1 route freeze: slugged dish paths are compatibility-only redirects.
  // Canonical public detail pages live at `/dish/[dishSlug]`.
  redirect(
    typeof tableLabel === "string" && tableLabel.length > 0
      ? `/dish/${dishSlug}?table=${encodeURIComponent(tableLabel)}`
      : `/dish/${dishSlug}`
  );
}
