"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import styles from "@/components/admin/menu-release-manager.module.css";
import type { MenuDraftEditor, MenuReleaseSummary } from "@/lib/menu/menu-release-store";

type MenuReleaseManagerProps = {
  releases: MenuReleaseSummary[];
  currentDraft: MenuDraftEditor | null;
};

export function MenuReleaseManager({
  releases,
  currentDraft
}: MenuReleaseManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const publishedRelease = releases.find((release) => release.status === "PUBLISHED");

  function refreshWithMessage(nextMessage: string) {
    setMessage(nextMessage);
    startTransition(() => {
      router.refresh();
    });
  }

  async function createDraft() {
    setMessage(null);
    const response = await fetch("/api/admin/menu/releases", {
      method: "POST"
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create draft.");
      return;
    }

    refreshWithMessage("Draft created from the published release.");
  }

  async function publishRelease(releaseId: string) {
    setMessage(null);
    const response = await fetch(`/api/admin/menu/releases/${releaseId}/publish`, {
      method: "POST"
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to publish release.");
      return;
    }

    refreshWithMessage("Published release switched successfully.");
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Menu Release System</p>
          <h1 className={styles.title}>Menu control room</h1>
          <p className={styles.subtitle}>
            Keep the live guest menu stable while the team edits draft content
            and publishes a new release when it is ready.
          </p>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={createDraft}
          disabled={Boolean(currentDraft) || isPending}
        >
          {currentDraft ? "Draft already active" : "Create draft from published"}
        </button>
      </section>

      <section className={styles.releasePanel}>
        <div className={styles.snapshotGrid}>
          <article className={styles.snapshotCard}>
            <span className={styles.snapshotLabel}>Published release</span>
            <strong className={styles.snapshotValue}>
              {publishedRelease ? `v${publishedRelease.version}` : "No published release"}
            </strong>
            <span className={styles.snapshotMeta}>
              {publishedRelease ? "Visible to guests now" : "Public menu source missing"}
            </span>
          </article>
          <article className={styles.snapshotCard}>
            <span className={styles.snapshotLabel}>Active draft</span>
            <strong className={styles.snapshotValue}>
              {currentDraft ? `v${currentDraft.release.version}` : "No active draft"}
            </strong>
            <span className={styles.snapshotMeta}>
              {currentDraft
                ? `${currentDraft.categories.length} categories, ${currentDraft.dishes.length} dishes`
                : "Create a draft before editing"}
            </span>
          </article>
        </div>
      </section>

      <section className={styles.releasePanel}>
        <div className={styles.releaseLinks}>
          <Link href="/admin/menu/categories" className={styles.secondaryButton}>
            Manage categories
          </Link>
          <Link href="/admin/menu/dishes" className={styles.secondaryButton}>
            Manage dishes
          </Link>
        </div>
      </section>

      {message ? <p className={styles.message}>{message}</p> : null}

      <section className={styles.releasePanel}>
        <h2 className={styles.sectionTitle}>Releases</h2>
        <div className={styles.releaseList}>
          {releases.map((release) => (
            <article key={release.id} className={styles.releaseCard}>
              <div className={styles.releaseMeta}>
                <div className={styles.releaseTopline}>
                  <strong>v{release.version}</strong>
                  <span
                    className={
                      release.status === "PUBLISHED"
                        ? styles.publishedBadge
                        : release.status === "DRAFT"
                          ? styles.draftBadge
                          : styles.archivedBadge
                    }
                  >
                    {release.status}
                  </span>
                </div>
                <p>{release.title ?? "Untitled release"}</p>
                <small>
                  {release.status === "PUBLISHED"
                    ? "Current guest-facing menu"
                    : release.status === "DRAFT"
                      ? "Internal editing surface"
                      : "Historical release"}
                </small>
              </div>

              {release.status === "DRAFT" ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => publishRelease(release.id)}
                  disabled={isPending}
                >
                  Publish this release
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {currentDraft ? (
        <section className={styles.editorGrid}>
          <section className={styles.editorSection}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>
                Draft v{currentDraft.release.version} ready for editing
              </h2>
              <span>
                {currentDraft.categories.length} categories · {currentDraft.dishes.length} dishes
              </span>
            </div>
            <div className={styles.editorCard}>
              <p className={styles.subtitle}>
                Use the dedicated admin routes to manage full category and dish
                CRUD, including ingredients, allergens, and image references.
                The release overview stays focused on version control and
                publish actions.
              </p>
              <div className={styles.releaseLinks}>
                <Link href="/admin/menu/categories" className={styles.secondaryButton}>
                  Open category manager
                </Link>
                <Link href="/admin/menu/dishes" className={styles.secondaryButton}>
                  Open dish manager
                </Link>
              </div>
            </div>
          </section>
        </section>
      ) : (
        <section className={styles.emptyState}>
          <strong>No active draft</strong>
          <span>
            Create a draft from the published release before editing menu content.
          </span>
        </section>
      )}
    </main>
  );
}
