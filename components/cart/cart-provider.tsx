"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import styles from "./cart-provider.module.css";
import { formatPrice } from "@/lib/menu/format";
import { siteConfig } from "@/lib/config/site";
import type { DishRecord } from "@/lib/types/restaurant";

type CartItem = {
  id: string;
  dish: DishRecord;
  variant?: NonNullable<DishRecord["variants"]>[number];
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalCalories: number;
  isOpen: boolean;
  addDish: (
    dish: DishRecord,
    quantity?: number,
    variant?: NonNullable<DishRecord["variants"]>[number]
  ) => void;
  incrementDish: (itemId: string) => void;
  decrementDish: (itemId: string) => void;
  removeDish: (itemId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getDishQuantity: (dishId: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartItemsUpdater = CartItem[] | ((current: CartItem[]) => CartItem[]);

function getCartItemId(
  dish: DishRecord,
  variant?: NonNullable<DishRecord["variants"]>[number]
) {
  return variant ? `${dish.id}::${variant.id}` : dish.id;
}

function getItemUnitPrice(item: CartItem) {
  return item.variant?.price.amount ?? item.dish.price.amount;
}

export function CartProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const setItems = useCallback((updater: CartItemsUpdater) => {
    setCartItems((currentItems) =>
      typeof updater === "function" ? updater(currentItems) : updater
    );
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0),
    [items]
  );
  const totalCalories = useMemo(
    () => items.reduce((sum, item) => sum + item.dish.calories * item.quantity, 0),
    [items]
  );
  const cartCurrency = items[0]?.dish.price.currency ?? "SEK";

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((current) => !current), []);

  const addDish = useCallback((
    dish: DishRecord,
    quantity = 1,
    variant?: NonNullable<DishRecord["variants"]>[number]
  ) => {
    const itemId = getCartItemId(dish, variant);

    setItems((current) => {
      const existing = current.find((item) => item.id === itemId);

      if (existing) {
        return current.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...current, { id: itemId, dish, variant, quantity }];
    });

    setFeedback(`${dish.name}${variant ? ` (${variant.label})` : ""} tillagd`);
  }, [setItems]);

  const incrementDish = useCallback((itemId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, [setItems]);

  const decrementDish = useCallback((itemId: string) => {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.id !== itemId) {
          return [item];
        }

        if (item.quantity <= 1) {
          return [];
        }

        return [{ ...item, quantity: item.quantity - 1 }];
      })
    );
  }, [setItems]);

  const removeDish = useCallback((itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }, [setItems]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const continueToReview = useCallback(() => {
    if (items.length === 0) {
      return;
    }

    const nextSearchParams = new URLSearchParams();
    const tableLabel = searchParams.get("table");

    if (tableLabel) {
      nextSearchParams.set("table", tableLabel);
    }

    setIsOpen(false);
    const reviewHref =
      nextSearchParams.size > 0
        ? `/review?${nextSearchParams.toString()}`
        : "/review";
    router.push(reviewHref);
  }, [items.length, router, searchParams]);

  const getDishQuantity = useCallback(
    (dishId: string) =>
      items
        .filter((item) => item.dish.id === dishId)
        .reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const orderingEnabled = siteConfig.orderingMode !== "browsing-only";
  const showCartUi =
    orderingEnabled &&
    (pathname === "/" ||
      pathname === "/menu" ||
      Boolean(pathname?.startsWith("/menu/")) ||
      Boolean(pathname?.startsWith("/dish/")));

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      totalPrice,
      totalCalories,
      isOpen,
      addDish,
      incrementDish,
      decrementDish,
      removeDish,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      getDishQuantity
    }),
    [
      items,
      totalItems,
      totalPrice,
      totalCalories,
      isOpen,
      addDish,
      incrementDish,
      decrementDish,
      removeDish,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      getDishQuantity
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}

      {showCartUi ? (
        <>
          {!isOpen ? (
            <button
              type="button"
              className={styles.cartButton}
              aria-label={`Öppna beställning med ${totalItems} val`}
              onClick={toggleCart}
            >
              <span className={styles.cartButtonLabel}>Beställning</span>
              <span className={styles.cartButtonCount}>{totalItems}</span>
            </button>
          ) : null}

          {isOpen ? (
            <div
              className={styles.drawerOverlay}
              role="presentation"
              onClick={closeCart}
            >
              <aside
                className={styles.drawer}
                role="dialog"
                aria-modal="true"
                aria-label="Beställning"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.drawerHeader}>
                  <div>
                    <p className={styles.drawerEyebrow}>Bordsbeställning</p>
                    <h2 className={styles.drawerTitle}>Din beställning</h2>
                  </div>
                  <button
                    type="button"
                    className={styles.closeButton}
                    aria-label="Stäng beställning"
                    onClick={closeCart}
                  >
                    X
                  </button>
                </div>

                <div className={styles.drawerBody}>
                  {items.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>Din beställning är tom</p>
                      <p className={styles.emptyDescription}>
                        Lägg till rätter från menyn för att börja.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.itemList}>
                      {items.map((item) => (
                        <div key={item.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <div className={styles.itemCopy}>
                              <strong>{item.dish.name}</strong>
                              {item.variant ? (
                                <span className={styles.itemMeta}>
                                  {item.variant.label}
                                </span>
                              ) : null}
                              <span className={styles.itemMeta}>
                                {item.dish.calories * item.quantity} kcal
                              </span>
                            </div>

                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() => removeDish(item.id)}
                            >
                              Ta bort
                            </button>
                          </div>

                          <div className={styles.itemFooter}>
                            <div
                              className={styles.quantityControl}
                              aria-label={`Ändra antal för ${item.dish.name}`}
                            >
                              <button
                                type="button"
                                className={styles.quantityButton}
                                aria-label={`Minska antal för ${item.dish.name}`}
                                onClick={() => decrementDish(item.id)}
                              >
                                -
                              </button>
                              <span className={styles.quantityValue}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className={styles.quantityButton}
                                aria-label={`Öka antal för ${item.dish.name}`}
                                onClick={() => incrementDish(item.id)}
                              >
                                +
                              </button>
                            </div>

                            <strong className={styles.itemSubtotal}>
                              {formatPrice({
                                amount: getItemUnitPrice(item) * item.quantity,
                                currency:
                                  item.variant?.price.currency ?? item.dish.price.currency
                              })}
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.checkoutSection}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryRow}>
                      <span>Antal</span>
                      <strong>{totalItems}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Kalorier</span>
                      <strong>{totalCalories} kcal</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Totalt</span>
                      <strong>
                        {formatPrice({ amount: totalPrice, currency: cartCurrency })}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.submitButton}
                    disabled={items.length === 0}
                    onClick={continueToReview}
                  >
                    Granska beställning
                  </button>
                </div>
              </aside>
            </div>
          ) : null}

          {feedback ? (
            <div className={styles.toast} role="status" aria-live="polite">
              {feedback}
            </div>
          ) : null}
        </>
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
