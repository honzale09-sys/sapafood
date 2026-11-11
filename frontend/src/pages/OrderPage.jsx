import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Minus, Plus, Lock, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "../components/site/Layout";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { ROUTES, T, pick, formatPrice } from "../lib/i18n";
import { OrderButtons } from "../components/site/OrderLinks";
import { PageHead } from "./PageHead";

const FORM_KEY = "sapa_order_form";
const inputCls =
  "h-12 w-full rounded-xl border border-tamarind/20 bg-paper px-4 text-base text-tamarind outline-none transition-colors placeholder:text-tamarind/35 focus:border-lacquer";
const labelCls = "mb-1.5 block text-sm font-medium text-tamarind";

export default function OrderPage() {
  const lang = useLang();
  const t = T[lang].cart;
  const { lines, total, setQty, ordering, refreshOrdering } = useCart();
  const [params] = useSearchParams();
  const [form, setForm] = useState(() => {
    try {
      return { name: "", phone: "", email: "", note: "", ...JSON.parse(sessionStorage.getItem(FORM_KEY) || "{}"), pickup: "" };
    } catch {
      return { name: "", phone: "", email: "", note: "", pickup: "" };
    }
  });
  const [paying, setPaying] = useState(false);

  useEffect(refreshOrdering, [refreshOrdering]);
  useEffect(() => {
    if (params.get("cancelled")) toast(t.cancelled);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      const { pickup, ...keep } = form;
      sessionStorage.setItem(FORM_KEY, JSON.stringify(keep));
    } catch {}
  }, [form]);

  const slots = ordering?.slots || [];
  // Keep the chosen time while it is still offered; otherwise the earliest one.
  useEffect(() => {
    if (slots.length && !slots.includes(form.pickup)) setForm((f) => ({ ...f, pickup: slots[0] }));
  }, [slots.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (paying) return;
    setPaying(true);
    try {
      const { data } = await api.post("/orders/start", {
        lines: lines.map((l) => ({ item_id: l.item_id, variant: l.variant, qty: l.qty })),
        ...form,
        lang: lang === "en" ? "en" : "cs",
      });
      window.location.href = data.redirectUrl;
    } catch (err) {
      const code = err?.response?.data?.detail;
      if (code === "pickup_unavailable") refreshOrdering();
      toast.error(
        code === "item_unavailable" ? t.unavailable
          : code === "pickup_unavailable" ? t.slotGone
          : code === "ordering_closed" ? t.closed
          : code === "payments_not_configured" || code === "payment_unavailable" ? t.payDown
          : typeof code === "string" && err.response.status === 422 ? code
          : t.error,
      );
      setPaying(false);
    }
  };

  return (
    <div data-testid="order-page">
      <PageHead lang={lang} eyebrow={t.pickupOnly} title={t.title} />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-[1fr_400px] lg:gap-14 lg:px-12">
        <section className="order-2 lg:order-1">
          {!lines.length ? (
            <div className="rounded-3xl border border-dashed border-tamarind/20 p-8 text-center" data-testid="order-empty">
              <p className="text-tamarind/70">{t.empty}</p>
              <Link to={ROUTES.menu[lang]} className="mt-5 inline-flex h-11 items-center rounded-full bg-lacquer px-6 text-sm font-medium text-paper">
                {t.toMenu}
              </Link>
            </div>
          ) : ordering && !ordering.accepting ? (
            <div className="rounded-3xl border border-tamarind/10 bg-sand/70 p-8" data-testid="order-closed">
              <p className="text-tamarind">{ordering.enabled && !slots.length ? t.noSlots : t.closed}</p>
              <div className="mt-6">
                <OrderButtons lang={lang} testPrefix="order-closed" />
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6" data-testid="order-form">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="order-name" className={labelCls}>{t.name}</label>
                  <input id="order-name" data-testid="order-name" className={inputCls} required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={set("name")} />
                </div>
                <div>
                  <label htmlFor="order-phone" className={labelCls}>{t.phone}</label>
                  <input id="order-phone" data-testid="order-phone" className={inputCls} required type="tel" inputMode="tel" autoComplete="tel" placeholder="+420" value={form.phone} onChange={set("phone")} />
                </div>
                <div>
                  <label htmlFor="order-email" className={labelCls}>{t.email}</label>
                  <input id="order-email" data-testid="order-email" className={inputCls} required type="email" autoComplete="email" value={form.email} onChange={set("email")} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="order-pickup" className={labelCls}>{t.pickup}</label>
                  <select id="order-pickup" data-testid="order-pickup" className={`${inputCls} cursor-pointer`} required value={form.pickup} onChange={set("pickup")}>
                    {slots.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-tamarind/60"><MapPin size={13} /> {t.address}</p>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="order-note" className={labelCls}>{t.note}</label>
                  <textarea id="order-note" data-testid="order-note" rows={2} maxLength={300} className={`${inputCls} h-auto py-3`} placeholder={t.notePlaceholder} value={form.note} onChange={set("note")} />
                </div>
              </div>
              <button
                type="submit"
                disabled={paying || !ordering}
                data-testid="order-pay"
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-lacquer text-[15px] font-medium text-paper transition-colors hover:bg-lacquer-dark disabled:opacity-60"
              >
                {paying ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                {paying ? t.paying : `${t.pay} · ${formatPrice(total)}`}
              </button>
              <p className="text-center text-xs text-tamarind/60">
                {t.agree} {t.agreeLegal[0]}{" "}
                <Link to={ROUTES.terms[lang]} className="underline underline-offset-2" data-testid="order-terms-link">{t.agreeLegal[1]}</Link>. {t.agreeLegal[2]}{" "}
                <Link to={ROUTES.privacy[lang]} className="underline underline-offset-2" data-testid="order-privacy-link">{t.agreeLegal[3]}</Link>.
              </p>
            </form>
          )}
        </section>

        {lines.length > 0 && (
          <aside className="order-1 h-fit rounded-3xl border border-tamarind/10 bg-sand/70 p-6 lg:order-2 lg:sticky lg:top-28" data-testid="order-summary">
            <ul className="divide-y divide-tamarind/10">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3 py-3" data-testid="order-line">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[17px] leading-snug">
                      {l.number && <span className="mr-1.5 font-mono text-xs text-lacquer">{l.number}</span>}
                      {pick(lang, l.name, l.name_en)}
                    </p>
                    {l.label && <p className="text-xs text-tamarind/60">{pick(lang, l.label, l.label_en)}</p>}
                    <p className="mt-0.5 font-mono text-xs text-tamarind/60">{formatPrice(l.price)}</p>
                  </div>
                  <div className="flex items-center rounded-full border border-tamarind/20">
                    <button type="button" onClick={() => setQty(l.key, l.qty - 1)} aria-label="−" className="flex h-9 w-9 items-center justify-center" data-testid="order-qty-minus">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-mono text-sm">{l.qty}</span>
                    <button type="button" onClick={() => setQty(l.key, l.qty + 1)} aria-label="+" className="flex h-9 w-9 items-center justify-center" data-testid="order-qty-plus">
                      <Plus size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-tamarind/15 pt-4">
              <span className="text-sm font-medium">{t.total}</span>
              <span className="font-mono text-xl text-lacquer" data-testid="order-total">{formatPrice(total)}</span>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
