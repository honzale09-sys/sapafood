import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../../lib/api";
import { inputCls } from "./AdminFields";

const CatRow = ({ c, i, count, reload, cats }) => {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name_cz: c.name_cz, name_en: c.name_en });

  const save = async () => {
    if (!f.name_cz.trim()) return toast.error("Tên danh mục (tiếng Séc) là bắt buộc.");
    try {
      await api.put(`/admin/categories/${c.id}`, f);
      toast.success("Đã đổi tên danh mục.");
      setEdit(false);
      reload();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const del = async () => {
    if (!window.confirm(`Xóa danh mục „${c.name_cz}“?`)) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      toast.success("Đã xóa danh mục.");
      reload();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const moveBy = async (d) => {
    const ids = cats.map((x) => x.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    try { await api.put("/admin/categories-order", { ids }); reload(); } catch (e) { toast.error(errMsg(e)); }
  };

  if (edit)
    return (
      <li className="space-y-2 rounded-xl bg-white p-3" data-testid={`admin-category-edit-${c.id}`}>
        <input className={inputCls} value={f.name_cz} onChange={(e) => setF({ ...f, name_cz: e.target.value })} placeholder="Tên tiếng Séc *" data-testid={`admin-category-name-cz-${c.id}`} />
        <input className={inputCls} value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} placeholder="Tên tiếng Anh" data-testid={`admin-category-name-en-${c.id}`} />
        <div className="flex gap-2">
          <button type="button" onClick={save} className="flex h-11 flex-1 items-center justify-center gap-1 rounded-full bg-lacquer text-paper" data-testid={`admin-category-save-${c.id}`}><Check size={16} /> Lưu</button>
          <button type="button" onClick={() => setEdit(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-tamarind/20" aria-label="Hủy"><X size={16} /></button>
        </div>
      </li>
    );

  return (
    <li className="flex items-center gap-2 rounded-xl bg-white px-3 py-2" data-testid={`admin-category-row-${c.id}`}>
      <span className="flex-1 truncate">{c.name_cz} <span className="text-xs text-tamarind/50">/ {c.name_en || "—"} · {c.item_count}</span></span>
      <button type="button" disabled={i === 0} onClick={() => moveBy(-1)} className="p-2 disabled:opacity-20" aria-label="Lên" data-testid={`admin-category-up-${c.id}`}><ArrowUp size={16} /></button>
      <button type="button" disabled={i === count - 1} onClick={() => moveBy(1)} className="p-2 disabled:opacity-20" aria-label="Xuống" data-testid={`admin-category-down-${c.id}`}><ArrowDown size={16} /></button>
      <button type="button" onClick={() => setEdit(true)} className="p-2" aria-label="Đổi tên" data-testid={`admin-category-rename-${c.id}`}><Pencil size={16} /></button>
      <button type="button" onClick={del} className="p-2 text-lacquer" aria-label="Xóa" data-testid={`admin-category-delete-${c.id}`}><Trash2 size={16} /></button>
    </li>
  );
};

export const CategoryManager = ({ cats, reload }) => {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name_cz: "", name_en: "" });

  const add = async (e) => {
    e.preventDefault();
    if (!f.name_cz.trim()) return toast.error("Tên danh mục (tiếng Séc) là bắt buộc.");
    try {
      await api.post("/admin/categories", f);
      setF({ name_cz: "", name_en: "" });
      toast.success("Đã thêm danh mục.");
      reload();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="rounded-2xl border border-tamarind/10 bg-sand/60 p-4" data-testid="admin-category-manager">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-10 w-full items-center justify-between text-left font-medium" data-testid="admin-category-manager-toggle">
        Kategorie ({cats.length}) <span className="text-sm text-lacquer">{open ? "Ẩn" : "Sửa danh mục"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <ul className="space-y-2">
            {cats.map((c, i) => <CatRow key={c.id + c.name_cz + c.name_en} c={c} i={i} count={cats.length} cats={cats} reload={reload} />)}
          </ul>
          <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input className={inputCls} placeholder="Danh mục mới (tiếng Séc) *" value={f.name_cz} onChange={(e) => setF({ ...f, name_cz: e.target.value })} data-testid="admin-category-new-cz" />
            <input className={inputCls} placeholder="Tiếng Anh" value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} data-testid="admin-category-new-en" />
            <button type="submit" className="flex h-12 items-center justify-center gap-1 rounded-full bg-tamarind px-5 text-paper" data-testid="admin-category-add-button"><Plus size={16} /> Thêm</button>
          </form>
        </div>
      )}
    </div>
  );
};
