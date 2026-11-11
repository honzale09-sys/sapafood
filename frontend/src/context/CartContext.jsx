import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const CART_KEY = "sapa_cart";
const CartContext = createContext(null);

const load = () => {
  try {
    const lines = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(lines) ? lines : [];
  } catch {
    return [];
  }
};

// One line per dish (and per size for dishes with variants). Prices here are for display only:
// the server prices the order from the menu again.
export function CartProvider({ children }) {
  const [lines, setLines] = useState(load);
  const [ordering, setOrdering] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const refreshOrdering = useCallback(() => {
    api.get("/ordering/status").then(({ data }) => setOrdering(data)).catch(() => setOrdering({ accepting: false, enabled: false, slots: [] }));
  }, []);
  useEffect(refreshOrdering, [refreshOrdering]);

  const add = useCallback((item, variantIndex = null) => {
    const v = variantIndex === null ? null : item.variants[variantIndex];
    const key = `${item.id}:${variantIndex ?? "-"}`;
    setLines((cur) => {
      const found = cur.find((l) => l.key === key);
      if (found) return cur.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + 1) } : l));
      return [
        ...cur,
        {
          key,
          item_id: item.id,
          variant: variantIndex,
          number: item.number || "",
          name: item.name,
          name_en: item.name_en || "",
          label: v?.label_cz || "",
          label_en: v?.label_en || "",
          price: v ? v.price : item.price,
          qty: 1,
        },
      ];
    });
  }, []);

  const setQty = useCallback((key, qty) => {
    setLines((cur) => (qty <= 0 ? cur.filter((l) => l.key !== key) : cur.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l))));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
    return { lines, count, total, add, setQty, clear, ordering, refreshOrdering };
  }, [lines, add, setQty, clear, ordering, refreshOrdering]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
