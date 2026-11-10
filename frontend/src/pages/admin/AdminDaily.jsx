import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../../lib/api";
import { formatDate } from "../../lib/i18n";
import { Switch } from "../../components/ui/switch";
import { AllergenPicker, Field, inputCls, areaCls, parsePrice } from "./AdminFields";

const pragueToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague" }).format(new Date());
const shift = (iso, days) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const blank = () => ({ name: "", desc_cz: "", desc_en: "", price: "", allergens: [] });
const empty = { published: false, note_cz: "", note_en: "", items: [] };

const ItemEditor = ({ it, i, set, remove }) => (
  <div className="space-y-3 rounded-2xl border border-tamarind/10 bg-sand/60 p-4" data-testid={`admin-daily-item-${i}`}>
    <div className="flex items-center justify-between">
      <span className="font-mono text-xs text-lacquer">Položka {i + 1}</span>
      <button type="button" onClick={remove} className="flex h-10 items-center gap-1 rounded-full px-3 text-sm text-lacquer hover:bg-lacquer/10" data-testid={`admin-daily-item-remove-${i}`}>
        <Trash2 size={16} /> Odebrat
      </button>
    </div>
    <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
      <Field label="Název *"><input className={inputCls} value={it.name} onChange={(e) => set({ name: e.target.value })} placeholder="např. DM1. PHO BO" data-testid={`admin-daily-item-name-${i}`} /></Field>
      <Field label="Cena (Kč) *"><input className={inputCls} inputMode="numeric" value={it.price} onChange={(e) => set({ price: e.target.value })} data-testid={`admin-daily-item-price-${i}`} /></Field>
    </div>
    <Field label="Popis česky"><textarea className={areaCls} value={it.desc_cz} onChange={(e) => set({ desc_cz: e.target.value })} data-testid={`admin-daily-item-desc-cz-${i}`} /></Field>
    <Field label="Popis anglicky" hint="Nepovinné – když chybí, zobrazí se český popis."><textarea className={areaCls} value={it.desc_en} onChange={(e) => set({ desc_en: e.target.value })} data-testid={`admin-daily-item-desc-en-${i}`} /></Field>
    <div className="space-y-1.5"><span className="text-sm font-medium">Alergeny</span><AllergenPicker value={it.allergens} onChange={(a) => set({ allergens: a })} testPrefix={`admin-daily-item-${i}`} /></div>
  </div>
);

export default function AdminDaily() {
  const [date, setDate] = useState(pragueToday());
  const [menu, setMenu] = useState(empty);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  const load = useCallback(async (d) => {
    setLoading(true);
    setErrors([]);
    try {
      const { data } = await api.get(`/admin/daily-menus/${d}`);
      setExists(!!data.menu);
      setMenu(data.menu ? { ...data.menu, items: data.menu.items.map((x) => ({ ...x, price: String(x.price) })) } : empty);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const setItem = (i, patch) => setMenu((m) => ({ ...m, items: m.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  const copyPrev = async () => {
    try {
      const { data } = await api.get(`/admin/daily-menus/${date}/previous`);
      setMenu((m) => ({ ...m, note_cz: data.menu.note_cz, note_en: data.menu.note_en, items: data.menu.items.map((x) => ({ ...x, price: String(x.price) })) }));
      toast.success(`Zkopírováno z ${formatDate(data.menu.date, "cs")}. Nezapomeňte uložit.`);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const save = async (publishedOverride) => {
    const published = publishedOverride ?? menu.published;
    const errs = [];
    const items = menu.items.map((it, i) => {
      if (!it.name.trim()) errs.push(`Položka ${i + 1}: vyplňte název.`);
      const p = parsePrice(it.price);
      if (p == null) errs.push(`Položka ${i + 1}: cena musí být kladné celé číslo.`);
      return { ...it, price: p ?? 0 };
    });
    if (published && !items.length) errs.push("Nelze zveřejnit prázdné menu – přidejte alespoň jednu položku.");
    setErrors(errs);
    if (errs.length) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/daily-menus/${date}`, { ...menu, published, items });
      setMenu({ ...data, items: data.items.map((x) => ({ ...x, price: String(x.price) })) });
      setExists(true);
      toast.success(published ? "Menu je uložené a zveřejněné." : "Menu je uložené (nezveřejněné).");
    } catch (e) {
      setErrors([errMsg(e)]);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Opravdu smazat menu pro tento den?")) return;
    try {
      await api.delete(`/admin/daily-menus/${date}`);
      toast.success("Menu smazáno.");
      load(date);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const status = !exists ? ["Žádné menu", "bg-tamarind/10 text-tamarind"] : menu.published ? ["Zveřejněno", "bg-herb text-emerald-50"] : ["Koncept – nezveřejněno", "bg-turmeric/20 text-tamarind"];

  return (
    <div className="space-y-6" data-testid="admin-daily-page">
      <div>
        <h1 className="font-display text-3xl">Denní menu</h1>
        <p className="mt-1 text-sm text-tamarind/60">Vyberte den, přidejte jídla a zveřejněte. Na webu se zobrazí jen dnešní zveřejněné menu.</p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-tamarind/10 bg-white p-2">
        <button type="button" onClick={() => setDate(shift(date, -1))} className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-sand" aria-label="Předchozí den" data-testid="admin-daily-prev-day"><ChevronLeft /></button>
        <div className="flex-1 text-center">
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-10 rounded-lg bg-transparent text-center font-mono text-base outline-none" data-testid="admin-daily-date-input" />
          <p className="text-xs text-tamarind/60" data-testid="admin-daily-date-label">{formatDate(date, "cs")}{date === pragueToday() ? " · dnes" : ""}</p>
        </div>
        <button type="button" onClick={() => setDate(shift(date, 1))} className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-sand" aria-label="Další den" data-testid="admin-daily-next-day"><ChevronRight /></button>
      </div>
      {date !== pragueToday() && (
        <button type="button" onClick={() => setDate(pragueToday())} className="text-sm text-lacquer underline" data-testid="admin-daily-today-button">Přejít na dnešek</button>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-sand" />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${status[1]}`} data-testid="admin-daily-status">{status[0]}</span>
            <button type="button" onClick={copyPrev} className="flex h-11 items-center gap-2 rounded-full border border-tamarind/20 px-4 text-sm hover:bg-sand" data-testid="admin-daily-menu-copy-prev-day">
              <Copy size={16} /> Kopírovat z předchozího dne
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Poznámka česky" hint="Např. „K polednímu menu polévka zdarma“"><input className={inputCls} value={menu.note_cz} onChange={(e) => setMenu({ ...menu, note_cz: e.target.value })} data-testid="admin-daily-note-cz" /></Field>
            <Field label="Poznámka anglicky"><input className={inputCls} value={menu.note_en} onChange={(e) => setMenu({ ...menu, note_en: e.target.value })} data-testid="admin-daily-note-en" /></Field>
          </div>

          <div className="space-y-4">
            {menu.items.map((it, i) => (
              <ItemEditor key={i} it={it} i={i} set={(p) => setItem(i, p)} remove={() => setMenu((m) => ({ ...m, items: m.items.filter((_, j) => j !== i) }))} />
            ))}
            <button type="button" onClick={() => setMenu((m) => ({ ...m, items: [...m.items, blank()] }))} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-tamarind/20 text-base font-medium hover:border-lacquer hover:text-lacquer" data-testid="admin-daily-add-item">
              <Plus size={18} /> Přidat jídlo
            </button>
          </div>

          {errors.length > 0 && (
            <div className="space-y-1 rounded-2xl bg-lacquer/10 p-4 text-sm text-lacquer" role="alert" data-testid="admin-daily-errors">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          <div className="h-20 md:hidden" aria-hidden />
          <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-tamarind/10 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(62,35,25,0.25)] backdrop-blur md:sticky md:bottom-4 md:rounded-2xl md:border md:p-4" data-testid="admin-daily-action-bar">
            <label className="flex shrink-0 items-center gap-2">
              <Switch checked={menu.published} onCheckedChange={(v) => setMenu({ ...menu, published: v })} data-testid="admin-daily-menu-publish-toggle" />
              <span className="text-sm font-medium leading-tight">Zveřejnit<span className="hidden sm:inline"> na webu</span></span>
            </label>
            <div className="flex flex-1 gap-2">
              <button type="button" disabled={saving} onClick={() => save()} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-lacquer text-base font-medium text-paper hover:bg-lacquer-dark disabled:opacity-60" data-testid="admin-daily-save-button">
                <Save size={18} /> {saving ? "Ukládám…" : "Uložit"}
              </button>
              {exists && (
                <button type="button" onClick={remove} className="flex h-12 w-12 items-center justify-center rounded-full border border-lacquer/30 text-lacquer" aria-label="Smazat menu" data-testid="admin-daily-delete-button"><Trash2 size={18} /></button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
