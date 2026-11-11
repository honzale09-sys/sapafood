import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useLang } from "../components/site/Layout";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { ROUTES, T, pick, formatPrice } from "../lib/i18n";

// Teya sends the customer back here; the server confirms the payment with Teya before reporting "paid".
const POLL_MS = 2000;
const POLL_TRIES = 30;

export default function OrderDonePage() {
  const lang = useLang();
  const t = T[lang].cart;
  const { clear } = useCart();
  const [params] = useSearchParams();
  const ref = params.get("ref");
  const [order, setOrder] = useState(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!ref) return;
    let tries = 0;
    let timer;
    let alive = true;
    const poll = async () => {
      try {
        const { data } = await api.get(`/orders/status/${encodeURIComponent(ref)}`);
        if (!alive) return;
        setOrder(data);
        if (data.status === "paid" || data.status === "done") {
          clear();
          return;
        }
        if (data.status !== "pending") return;
      } catch {
        if (!alive) return;
      }
      if (++tries >= POLL_TRIES) setGaveUp(true);
      else timer = setTimeout(poll, POLL_MS);
    };
    poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = order?.status;
  const paid = status === "paid" || status === "done";
  const failed = status === "failed" || status === "expired";

  return (
    <div className="mx-auto max-w-xl px-5 pt-36 pb-24 text-center sm:pt-44" data-testid="order-done" data-status={status || "loading"}>
      {paid ? (
        <>
          <CheckCircle2 size={44} className="mx-auto text-herb" />
          <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">{t.paidTitle}</h1>
          <p className="mt-4 text-tamarind/70">
            {t.paidText} <strong className="text-tamarind">{order.pickup}</strong>.
          </p>
          <p className="mt-6 eyebrow text-lacquer">{t.orderNo}</p>
          <p className="mt-1 font-mono text-5xl" data-testid="order-done-ref">#{order.number}</p>
          <ul className="mx-auto mt-8 max-w-sm divide-y divide-tamarind/10 rounded-2xl border border-tamarind/10 bg-sand/60 px-5 text-left text-sm">
            {order.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-3 py-2.5">
                <span>{l.qty}× {pick(lang, l.name, l.name_en)}{l.label ? ` (${l.label})` : ""}</span>
                <span className="font-mono">{formatPrice(l.price * l.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between py-3 font-medium">
              <span>{t.total}</span>
              <span className="font-mono text-lacquer">{formatPrice(order.total)}</span>
            </li>
          </ul>
          <p className="mt-6 text-sm text-tamarind/60">{t.address}</p>
          <Link to={ROUTES.home[lang]} className="mt-8 inline-flex h-11 items-center rounded-full border border-tamarind/25 px-6 text-sm">{t.backHome}</Link>
        </>
      ) : failed ? (
        <>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{t.failedTitle}</h1>
          <p className="mt-4 text-tamarind/70">{t.failedText}</p>
          <Link to={ROUTES.order[lang]} data-testid="order-done-retry" className="mt-8 inline-flex h-12 items-center rounded-full bg-lacquer px-7 text-sm font-medium text-paper">{t.again}</Link>
        </>
      ) : gaveUp || !ref ? (
        <p className="text-tamarind/70">{t.pendingText}</p>
      ) : (
        <p className="flex items-center justify-center gap-3 text-tamarind/70"><Loader2 size={18} className="animate-spin" /> {t.checking}</p>
      )}
    </div>
  );
}
