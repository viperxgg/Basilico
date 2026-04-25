import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="page">
      <section className="surface-card">
        <p className="eyebrow">403</p>
        <h1 className="title">Åtkomst nekad</h1>
        <p className="description">
          Du saknar behörighet till den här interna ytan.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/login">
            Logga in
          </Link>
          <Link className="button button-secondary" href="/">
            Till menyn
          </Link>
        </div>
      </section>
    </main>
  );
}
