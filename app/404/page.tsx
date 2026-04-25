import Link from "next/link";

export default function NotFoundRoutePage() {
  return (
    <main className="page">
      <section className="surface-card">
        <p className="eyebrow">404</p>
        <h1 className="title">Sidan finns inte</h1>
        <p className="description">
          Gå tillbaka till Basilicos meny eller kontakta personalen om du följde en QR-kod som inte fungerar.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/">
            Till menyn
          </Link>
        </div>
      </section>
    </main>
  );
}
