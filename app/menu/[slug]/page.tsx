import { redirect } from "next/navigation";

type MenuPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    table?: string;
  }>;
};

export default async function MenuPage({
  searchParams
}: MenuPageProps) {
  // Legacy compatibility route only. Ignore the slug and redirect to `/`.
  const { table } = await searchParams;

  // Phase 1 route freeze: customer menu routes no longer depend on
  // `restaurant.slug` in a one-restaurant deployment. Keep this path only as
  // compatibility for older links and QR material.
  redirect(
    typeof table === "string" && table.length > 0
      ? `/?table=${encodeURIComponent(table)}`
      : "/"
  );
}
