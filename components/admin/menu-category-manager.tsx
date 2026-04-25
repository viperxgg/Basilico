"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import styles from "@/components/admin/menu-draft-crud.module.css";
import type { MenuDraftEditor } from "@/lib/menu/menu-release-store";

type MenuCategoryManagerProps = {
  currentDraft: MenuDraftEditor | null;
};

export function MenuCategoryManager({ currentDraft }: MenuCategoryManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh(nextMessage: string) {
    setMessage(nextMessage);
    startTransition(() => router.refresh());
  }

  async function createCategory(formData: FormData) {
    const response = await fetch("/api/admin/menu/draft/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: formData.get("label"),
        shortLabel: formData.get("shortLabel"),
        description: formData.get("description")
      })
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create category.");
      return;
    }
    refresh("Draft category created.");
  }

  async function updateCategory(formData: FormData) {
    const categoryId = String(formData.get("categoryId") ?? "");
    const response = await fetch(
      `/api/admin/menu/draft/categories/${encodeURIComponent(categoryId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formData.get("label"),
          shortLabel: formData.get("shortLabel"),
          description: formData.get("description")
        })
      }
    );
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update category.");
      return;
    }
    refresh("Draft category updated.");
  }

  async function deleteCategory(categoryId: string) {
    const response = await fetch(
      `/api/admin/menu/draft/categories/${encodeURIComponent(categoryId)}`,
      { method: "DELETE" }
    );
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to delete category.");
      return;
    }
    refresh("Draft category deleted.");
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Menu Categories</p>
          <h1 className={styles.title}>Category editor</h1>
          <p className={styles.subtitle}>
            Structure the guest menu here. Every change stays inside the draft
            until the release is published.
          </p>
        </div>
        <div className={styles.navLinks}>
          <Link href="/admin/menu" className={styles.navLink}>
            Release overview
          </Link>
          <Link href="/admin/menu/dishes" className={styles.navLink}>
            Manage dishes
          </Link>
        </div>
      </section>

      {message ? <p className={styles.message}>{message}</p> : null}

      {!currentDraft ? (
        <section className={styles.emptyState}>
          <strong>No active draft</strong>
          <span>Create a draft from the release overview before editing categories.</span>
        </section>
      ) : (
        <>
          <section className={styles.statusPanel}>
            <div className={styles.statusCard}>
              <span className={styles.statusLabel}>Active draft</span>
              <strong>v{currentDraft.release.version}</strong>
              <span className={styles.statusText}>Internal edits only</span>
            </div>
            <div className={styles.statusCard}>
              <span className={styles.statusLabel}>Category count</span>
              <strong>{currentDraft.categories.length}</strong>
              <span className={styles.statusText}>Shown on next publish</span>
            </div>
          </section>

          <section className={styles.createPanel}>
            <h2 className={styles.sectionTitle}>Create category</h2>
            <form className={styles.formCard} action={createCategory}>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Label</span>
                  <input name="label" required />
                </label>
                <label className={styles.field}>
                  <span>Short label</span>
                  <input name="shortLabel" />
                </label>
              </div>
              <label className={styles.field}>
                <span>Description</span>
                <textarea name="description" rows={3} />
              </label>
              <button type="submit" className={styles.primaryButton} disabled={isPending}>
                Create category
              </button>
            </form>
          </section>

          <section className={styles.listSection}>
            <h2 className={styles.sectionTitle}>
              Draft v{currentDraft.release.version} categories
            </h2>
            <div className={styles.listGrid}>
              {currentDraft.categories.map((category) => (
                <form key={category.id} className={styles.formCard} action={updateCategory}>
                  <div className={styles.readOnlyLine}>
                    <strong>{category.label}</strong>
                    <span>Order {category.sortOrder + 1}</span>
                  </div>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <label className={styles.field}>
                    <span>Label</span>
                    <input name="label" defaultValue={category.label} required />
                  </label>
                  <label className={styles.field}>
                    <span>Short label</span>
                    <input name="shortLabel" defaultValue={category.shortLabel} />
                  </label>
                  <label className={styles.field}>
                    <span>Description</span>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={category.description ?? ""}
                    />
                  </label>
                  <div className={styles.actions}>
                    <button type="submit" className={styles.secondaryButton}>
                      Save
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => deleteCategory(category.id)}
                    >
                      Delete
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
