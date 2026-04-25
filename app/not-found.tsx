import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="page">
      <section className="surface-card">
        <p className="eyebrow">404</p>
        <h1 className="title">Page not found</h1>
        <p className="description">
          The requested page does not exist in this template yet.
        </p>
        <Link href="/" className="button button-primary">
          Return home
        </Link>
      </section>
    </main>
  );
}
