"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import styles from "@/components/auth/login-form.module.css";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!username || !password) {
      setError("Ange användarnamn och lösenord.");
      return;
    }

    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password,
        next: nextPath
      })
    });

    const payload = (await response.json()) as {
      error?: string;
      redirectTo?: string;
    };

    if (!response.ok) {
      setError(payload.error ?? "Kunde inte logga in.");
      return;
    }

    startTransition(() => {
      router.replace(payload.redirectTo ?? "/admin");
      router.refresh();
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Basilico Personal</p>
        <h1 className={styles.title}>Logga in</h1>
        <p className={styles.subtitle}>
          Använd restaurangens användarnamn och lösenord för att komma åt interna verktyg.
        </p>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
        >
          <label className={styles.field}>
            <span className={styles.label}>Användarnamn</span>
            <input
              className={styles.input}
              name="username"
              autoComplete="username"
              disabled={isPending}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Lösenord</span>
            <input
              className={styles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              disabled={isPending}
            />
          </label>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button className={styles.button} type="submit" disabled={isPending}>
            {isPending ? "Loggar in..." : "Logga in"}
          </button>

          <p className={styles.hint}>
            Intern åtkomst gäller endast denna restaurang.
          </p>
        </form>
      </section>
    </main>
  );
}
