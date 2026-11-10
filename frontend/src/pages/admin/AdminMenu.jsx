import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg, imgUrl } from "../../lib/api";
import { formatPrice } from "../../lib/i18n";
import { Switch } from "../../components/ui/switch";
import { ItemDialog } from "./ItemDialog";
import { CategoryManager } from "./CategoryManager";

const move = (arr, i, d) => {
  const a = [...arr];
  [a[i], a[i + d]] = [a[i + d], a[i]];
  return a;
};

const ItemRow = ({ it, i, count, onEdit, onToggle, onMove, onDelete }) => (
  <li className={`flex items-center gap-3 rounded-2xl border border-tamarind/10 bg-white p-3 ${it.visible ? "" : "opacity-60"}`} data-testid={`admin-item-row-${it.id}`}>
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand">
      {it.image ? <img src={imgUrl(it.image)} alt="" className="h-full w-full object-contain" /> : <ImageOff size={18} className="text-tamarind/30" />}
    </div>
    <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left" data-testid={`admin-item-edit-${it.id}`}>
      <p className="truncate font-medium"><span className="font-mono text-xs text-lacquer">{it.number}</span> {it.name}</p>
      <p className="font-mono text-xs text-tamarind/60">
        {it.price != null ? formatPrice(it.price) : `${it.variants.length} variant`}
        {!it.visible && " · skryto"}
      </p>
    </button>
    <div className="flex items-center gap-1">
      <Switch checked={it.visible} onCheckedChange={onToggle} aria-label="Viditelné" data-testid={`admin-item-visible-${it.id}`} />
      <div className="hidden flex-col sm:flex">
        <button type="button" disabled={i === 0} onClick={() => onMove(-1)} className="p-1 disabled:opacity-20" aria-label="Nahoru" data-testid={`admin-item-up-${it.id}`}><ArrowUp size={16} /></button>
        <button type="button" disabled={i === count - 1} onClick={() => onMove(1)} className="p-1 disabled:opacity-20" aria-label="Dolů" data-testid={`admin-item-down-${it.id}`}><ArrowDown size={16} /></button>
      </div>
      <button type="button" onClick={onEdit} className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-sand sm:flex" aria-label="Upravit"><Pencil size={16} /></button>
      <button type="button" onClick={onDelete} className="flex h-10 w-10 items-center justify-center rounded-full text-lacquer hover:bg-lacquer/10" aria-label="Smazat" data-testid={`admin-item-delete-${it.id}`}><Trash2 size={16} /></button>
    </div>
  </li>
);

export default function AdminMenu() {
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const [c, i] = await Promise.all([api.get("/admin/categories"), api.get("/admin/items")]);
      setCats(c.data);
      setItems(i.data);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (it, visible) => {
    try {
      await api.patch(`/admin/items/${it.id}/visibility`, { visible });
      setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, visible } : x)));
      toast.success(visible ? "Položka je viditelná na webu." : "Položka je skrytá.");
    } catch (e) { toast.error(errMsg(e)); }
  };

  const reorder = async (list, i, d) => {
    const next = move(list, i, d);
    try {
      await api.put("/admin/items-order", { ids: next.map((x) => x.id) });
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const del = async (it) => {
    if (!window.confirm(`Smazat „${it.name}“?`)) return;
    try {
      await api.delete(`/admin/items/${it.id}`);
      toast.success("Položka smazána.");
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-8" data-testid="admin-menu-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Jídelní lístek</h1>
          <p className="mt-1 text-sm text-tamarind/60">Změny se na webu projeví okamžitě.</p>
        </div>
        <button type="button" onClick={() => setEditing({})} disabled={!cats.length} className="flex h-12 items-center gap-2 rounded-full bg-lacquer px-5 font-medium text-paper disabled:opacity-50" data-testid="admin-menu-add-item-button">
          <Plus size={18} /> Přidat jídlo
        </button>
      </div>

      <CategoryManager cats={cats} reload={load} />

      {cats.map((c) => {
        const list = items.filter((x) => x.category_id === c.id);
        return (
          <section key={c.id} data-testid={`admin-category-section-${c.id}`}>
            <h2 className="mb-3 flex items-baseline gap-2 font-display text-2xl">{c.name_cz} <span className="font-mono text-xs text-tamarind/40">{list.length}</span></h2>
            {list.length ? (
              <ul className="space-y-2">
                {list.map((it, i) => (
                  <ItemRow key={it.id} it={it} i={i} count={list.length} onEdit={() => setEditing(it)} onToggle={(v) => toggle(it, v)} onMove={(d) => reorder(list, i, d)} onDelete={() => del(it)} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-tamarind/20 p-4 text-sm text-tamarind/50">Zatím žádná jídla.</p>
            )}
          </section>
        );
      })}

      {editing && <ItemDialog item={editing} cats={cats} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}
