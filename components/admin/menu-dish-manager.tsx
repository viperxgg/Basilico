"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import styles from "@/components/admin/menu-draft-crud.module.css";
import type { MenuDraftEditor } from "@/lib/menu/menu-release-store";

type MenuDishManagerProps = {
  currentDraft: MenuDraftEditor | null;
};

export function MenuDishManager({ currentDraft }: MenuDishManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = currentDraft?.categories ?? [];
  const sortedDishes = useMemo(
    () => [...(currentDraft?.dishes ?? [])].sort((left, right) => left.number - right.number),
    [currentDraft]
  );

  function refresh(nextMessage: string) {
    setMessage(nextMessage);
    startTransition(() => router.refresh());
  }

  async function uploadDishImage(file: File) {
    const uploadFormData = new FormData();
    uploadFormData.set("file", file);

    const response = await fetch("/api/admin/menu/images", {
      method: "POST",
      body: uploadFormData
    });
    const payload = (await response.json()) as { error?: string; url?: string };

    if (!response.ok || !payload.url) {
      throw new Error(payload.error ?? "Unable to upload image.");
    }

    return payload.url;
  }

  async function resolveImageRef(formData: FormData) {
    const uploadedFile = formData.get("imageFile");

    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      return uploadDishImage(uploadedFile);
    }

    const imageRef = formData.get("imageRef");
    return typeof imageRef === "string" ? imageRef : "";
  }

  async function createDish(formData: FormData) {
    let imageRef = "";

    try {
      imageRef = await resolveImageRef(formData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload image.");
      return;
    }

    const response = await fetch("/api/admin/menu/draft/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: formData.get("categoryId"),
        name: formData.get("name"),
        description: formData.get("description"),
        priceMinor: Number.parseInt(String(formData.get("priceMinor") ?? ""), 10),
        calories: String(formData.get("calories") ?? "").trim()
          ? Number.parseInt(String(formData.get("calories") ?? ""), 10)
          : null,
        status: formData.get("status"),
        imageRef,
        imageAlt: formData.get("imageAlt"),
        ingredients: formData.get("ingredients"),
        allergens: formData.get("allergens")
      })
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create dish.");
      return;
    }
    refresh("Draft dish created.");
  }

  async function updateDish(formData: FormData) {
    const dishId = String(formData.get("dishId") ?? "");
    let imageRef = "";

    try {
      imageRef = await resolveImageRef(formData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload image.");
      return;
    }

    const response = await fetch(`/api/admin/menu/draft/dishes/${encodeURIComponent(dishId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: formData.get("categoryId"),
        name: formData.get("name"),
        description: formData.get("description"),
        priceMinor: Number.parseInt(String(formData.get("priceMinor") ?? ""), 10),
        calories: String(formData.get("calories") ?? "").trim()
          ? Number.parseInt(String(formData.get("calories") ?? ""), 10)
          : null,
        status: formData.get("status"),
        imageRef,
        imageAlt: formData.get("imageAlt"),
        ingredients: formData.get("ingredients"),
        allergens: formData.get("allergens")
      })
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update dish.");
      return;
    }
    refresh("Draft dish updated.");
  }

  async function deleteDish(dishId: string) {
    const response = await fetch(`/api/admin/menu/draft/dishes/${encodeURIComponent(dishId)}`, {
      method: "DELETE"
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to delete dish.");
      return;
    }
    refresh("Draft dish deleted.");
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Menu Dishes</p>
          <h1 className={styles.title}>Dish editor</h1>
          <p className={styles.subtitle}>
            Update the draft menu dish by dish, including operational pricing,
            dietary details, and guest-facing imagery.
          </p>
        </div>
        <div className={styles.navLinks}>
          <Link href="/admin/menu" className={styles.navLink}>
            Release overview
          </Link>
          <Link href="/admin/menu/categories" className={styles.navLink}>
            Manage categories
          </Link>
        </div>
      </section>

      {message ? <p className={styles.message}>{message}</p> : null}

      {!currentDraft ? (
        <section className={styles.emptyState}>
          <strong>No active draft</strong>
          <span>Create a draft from the release overview before editing dishes.</span>
        </section>
      ) : (
        <>
          <section className={styles.statusPanel}>
            <div className={styles.statusCard}>
              <span className={styles.statusLabel}>Active draft</span>
              <strong>v{currentDraft.release.version}</strong>
              <span className={styles.statusText}>Safe internal editing surface</span>
            </div>
            <div className={styles.statusCard}>
              <span className={styles.statusLabel}>Dish count</span>
              <strong>{sortedDishes.length}</strong>
              <span className={styles.statusText}>Guests stay on published menu</span>
            </div>
          </section>

          <section className={styles.createPanel}>
            <h2 className={styles.sectionTitle}>Create dish</h2>
            <form className={styles.formCard} action={createDish}>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Name</span>
                  <input name="name" required />
                </label>
                <label className={styles.field}>
                  <span>Category</span>
                  <select name="categoryId" required defaultValue="">
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={styles.field}>
                <span>Description</span>
                <textarea name="description" rows={3} required />
              </label>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Price (minor)</span>
                  <input name="priceMinor" inputMode="numeric" required />
                </label>
                <label className={styles.field}>
                  <span>Calories</span>
                  <input name="calories" inputMode="numeric" />
                </label>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Status</span>
                  <select name="status" defaultValue="available">
                    <option value="available">available</option>
                    <option value="sold-out">sold-out</option>
                    <option value="hidden">hidden</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Image reference</span>
                  <input
                    name="imageRef"
                    placeholder="/restaurants/basilico/dishes/uploads/general-gallery-image.png"
                  />
                </label>
              </div>
              <label className={styles.field}>
                <span>Upload image</span>
                <input
                  name="imageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                />
              </label>
              <p className={styles.helperText}>
                Upload a new image or paste an internal image reference below.
              </p>
              <label className={styles.field}>
                <span>Image alt</span>
                <input name="imageAlt" required />
              </label>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Ingredients</span>
                  <textarea name="ingredients" rows={6} placeholder="One ingredient per line" />
                </label>
                <label className={styles.field}>
                  <span>Allergens</span>
                  <textarea name="allergens" rows={6} placeholder="One allergen per line" />
                </label>
              </div>
              <button type="submit" className={styles.primaryButton} disabled={isPending}>
                Create dish
              </button>
            </form>
          </section>

          <section className={styles.listSection}>
            <h2 className={styles.sectionTitle}>
              Draft v{currentDraft.release.version} dishes
            </h2>
            <div className={styles.listGrid}>
              {sortedDishes.map((dish) => (
                <form key={dish.id} className={styles.formCard} action={updateDish}>
                  <input type="hidden" name="dishId" value={dish.id} />
                  <div className={styles.readOnlyLine}>
                    <strong>{dish.number.toString().padStart(3, "0")} · {dish.name}</strong>
                    <span>{dish.status}</span>
                  </div>
                  {dish.imageRef ? (
                    <div className={styles.imagePreviewWrap}>
                      <Image
                        src={dish.imageRef}
                        alt={dish.imageAlt}
                        className={styles.imagePreview}
                        width={1200}
                        height={700}
                      />
                    </div>
                  ) : null}
                  <div className={styles.fieldRow}>
                    <label className={styles.field}>
                      <span>Name</span>
                      <input name="name" defaultValue={dish.name} required />
                    </label>
                    <label className={styles.field}>
                      <span>Category</span>
                      <select name="categoryId" defaultValue={dish.categoryId}>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className={styles.field}>
                    <span>Description</span>
                    <textarea name="description" rows={3} defaultValue={dish.description} required />
                  </label>
                  <div className={styles.fieldRow}>
                    <label className={styles.field}>
                      <span>Price (minor)</span>
                      <input
                        name="priceMinor"
                        inputMode="numeric"
                        defaultValue={dish.priceMinor}
                        required
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Calories</span>
                      <input
                        name="calories"
                        inputMode="numeric"
                        defaultValue={dish.calories ?? ""}
                      />
                    </label>
                  </div>
                  <div className={styles.fieldRow}>
                    <label className={styles.field}>
                      <span>Status</span>
                      <select name="status" defaultValue={dish.status}>
                        <option value="available">available</option>
                        <option value="sold-out">sold-out</option>
                        <option value="hidden">hidden</option>
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Image reference</span>
                      <input name="imageRef" defaultValue={dish.imageRef ?? ""} />
                    </label>
                  </div>
                  <label className={styles.field}>
                    <span>Upload replacement image</span>
                    <input
                      name="imageFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                    />
                  </label>
                  <p className={styles.helperText}>Current slug: {dish.slug}</p>
                  <label className={styles.field}>
                    <span>Image alt</span>
                    <input name="imageAlt" defaultValue={dish.imageAlt} required />
                  </label>
                  <div className={styles.fieldRow}>
                    <label className={styles.field}>
                      <span>Ingredients</span>
                      <textarea
                        name="ingredients"
                        rows={6}
                        defaultValue={dish.ingredients.join("\n")}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Allergens</span>
                      <textarea
                        name="allergens"
                        rows={6}
                        defaultValue={dish.allergens.join("\n")}
                      />
                    </label>
                  </div>
                  <div className={styles.actions}>
                    <button type="submit" className={styles.secondaryButton}>
                      Save
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => deleteDish(dish.id)}
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
