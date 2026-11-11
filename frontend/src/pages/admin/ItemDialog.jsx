import { useRef, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg, imgUrl } from "../../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Switch } from "../../components/ui/switch";
import { AllergenPicker, Field, inputCls, areaCls, parsePrice } from "./AdminFields";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const toForm = (it, cats) => ({
  category_id: it.category_id || cats[0]?.id || "",
  number: it.number || "", name: it.name || "", name_en: it.name_en || "",
  desc_cz: it.desc_cz || "", desc_en: it.desc_en || "",
  price: it.price != null ? String(it.price) : "",
  allergens: it.allergens || [],
  variants: (it.variants || []).map((v) => ({ ...v, price: String(v.price) })),
  image: it.image || "",
  vegetarian: !!it.vegetarian, vegan: !!it.vegan,
  visible: it.visible ?? true, featured: !!it.featured,
});

const Toggle = ({ label, checked, onChange, id }) => (
  <label className="flex h-12 items-center justify-between rounded-xl border border-tamarind/15 bg-white px-3">
    <span className="text-sm font-medium">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} data-testid={`admin-item-form-${id}`} />
  </label>
);

const PhotoField = ({ value, onChange }) => {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast.error("Định dạng không hỗ trợ. Chỉ nhận JPG, PNG và WEBP.");
    if (file.size > MAX) return toast.error("Ảnh quá lớn (tối đa 5 MB).");
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      const { data } = await api.post("/admin/upload", fd);
      onChange(data.url);
      toast.success("Đã tải ảnh lên. Đừng quên lưu.");
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sand">
        {value ? <img src={imgUrl(value)} alt="" className="h-full w-full object-contain" data-testid="admin-item-form-photo-preview" /> : <span className="text-xs text-tamarind/40">Chưa có ảnh</span>}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickFile} data-testid="admin-item-form-photo-input" />
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="flex h-11 items-center gap-2 rounded-full border border-tamarind/20 px-4 text-sm disabled:opacity-60" data-testid="admin-item-form-photo-upload">
          <Upload size={16} /> {busy ? "Đang tải lên…" : value ? "Đổi ảnh" : "Tải ảnh lên"}
        </button>
        {value && <button type="button" onClick={() => onChange("")} className="text-left text-sm text-lacquer" data-testid="admin-item-form-photo-remove">Xóa ảnh</button>}
        <span className="text-xs text-tamarind/50">JPG, PNG hoặc WEBP, tối đa 5 MB</span>
      </div>
    </div>
  );
};

const Variants = ({ list, set }) => {
  const upd = (i, p) => set(list.map((v, j) => (j === i ? { ...v, ...p } : v)));
  return (
    <div className="space-y-3" data-testid="admin-item-form-variants">
      {list.map((v, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-tamarind/15 bg-white p-3" data-testid={`admin-item-form-variant-${i}`}>
          <div className="flex items-center justify-between"><span className="font-mono text-xs text-lacquer">{String.fromCharCode(65 + i)}.</span>
            <button type="button" onClick={() => set(list.filter((_, j) => j !== i))} className="p-1 text-lacquer" aria-label="Xóa loại này" data-testid={`admin-item-form-variant-remove-${i}`}><X size={16} /></button></div>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} placeholder="Tên tiếng Séc (vd. Krevety) *" value={v.label_cz} onChange={(e) => upd(i, { label_cz: e.target.value })} data-testid={`admin-item-form-variant-label-cz-${i}`} />
            <input className={inputCls} placeholder="Tên tiếng Anh" value={v.label_en} onChange={(e) => upd(i, { label_en: e.target.value })} data-testid={`admin-item-form-variant-label-en-${i}`} />
          </div>
          <input className={inputCls} inputMode="numeric" placeholder="Giá Kč *" value={v.price} onChange={(e) => upd(i, { price: e.target.value })} data-testid={`admin-item-form-variant-price-${i}`} />
          <AllergenPicker value={v.allergens} onChange={(a) => upd(i, { allergens: a })} testPrefix={`admin-item-form-variant-${i}`} />
        </div>
      ))}
      <button type="button" onClick={() => set([...list, { label_cz: "", label_en: "", price: "", allergens: [] }])} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-tamarind/25 text-sm" data-testid="admin-item-form-add-variant">
        <Plus size={16} /> Thêm loại (vd. kuřecí / hovězí)
      </button>
    </div>
  );
};

const validate = (f) => {
  const errs = [];
  if (!f.name.trim()) errs.push("Tên món (tiếng Séc) là bắt buộc.");
  if (!f.category_id) errs.push("Hãy chọn danh mục.");
  const price = f.price.trim() === "" ? null : parsePrice(f.price);
  if (f.price.trim() !== "" && price == null) errs.push("Giá phải là số nguyên dương.");
  if (price == null && !f.variants.length) errs.push("Hãy nhập giá hoặc thêm ít nhất một loại.");
  const variants = f.variants.map((v, i) => {
    const p = parsePrice(v.price);
    if (!v.label_cz.trim()) errs.push(`Loại ${String.fromCharCode(65 + i)}: hãy nhập tên.`);
    if (p == null) errs.push(`Loại ${String.fromCharCode(65 + i)}: giá phải là số nguyên dương.`);
    return { ...v, price: p ?? 0 };
  });
  return { errs, payload: { ...f, price, variants } };
};

export const ItemDialog = ({ item, cats, onClose, onSaved }) => {
  const [f, setF] = useState(() => toForm(item, cats));
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const s = (p) => setF((x) => ({ ...x, ...p }));

  const save = async (e) => {
    e.preventDefault();
    const { errs, payload } = validate(f);
    setErrors(errs);
    if (errs.length) return;
    setBusy(true);
    try {
      if (item.id) await api.put(`/admin/items/${item.id}`, payload);
      else await api.post("/admin/items", payload);
      toast.success("Đã lưu. Thay đổi đã có trên web.");
      onSaved();
    } catch (err) { setErrors([errMsg(err)]); } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[100dvh] w-full max-w-2xl overflow-y-auto bg-paper p-5 sm:max-h-[92vh] sm:rounded-3xl" data-testid="admin-item-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{item.id ? "Sửa món" : "Món mới"}</DialogTitle>
          <DialogDescription>Các ô có dấu * là bắt buộc.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4" data-testid="admin-item-form">
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Field label="Danh mục *">
              <select className={inputCls} value={f.category_id} onChange={(e) => s({ category_id: e.target.value })} data-testid="admin-item-form-category">
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name_cz}</option>)}
              </select>
            </Field>
            <Field label="Số"><input className={inputCls} value={f.number} onChange={(e) => s({ number: e.target.value })} data-testid="admin-item-form-number" /></Field>
          </div>
          <Field label="Tên món (tiếng Séc / tiếng Việt) *"><input className={inputCls} value={f.name} onChange={(e) => s({ name: e.target.value })} data-testid="admin-item-form-name" /></Field>
          <Field label="Tên tiếng Anh" hint="Không bắt buộc – nếu trống sẽ dùng tên tiếng Séc."><input className={inputCls} value={f.name_en} onChange={(e) => s({ name_en: e.target.value })} data-testid="admin-item-form-name-en" /></Field>
          <Field label="Mô tả tiếng Séc"><textarea className={areaCls} value={f.desc_cz} onChange={(e) => s({ desc_cz: e.target.value })} data-testid="admin-item-form-desc-cz" /></Field>
          <Field label="Mô tả tiếng Anh"><textarea className={areaCls} value={f.desc_en} onChange={(e) => s({ desc_en: e.target.value })} data-testid="admin-item-form-desc-en" /></Field>
          <Field label="Giá (Kč)" hint="Số nguyên. Để trống nếu món có các loại với giá riêng.">
            <input className={inputCls} inputMode="numeric" value={f.price} onChange={(e) => s({ price: e.target.value })} data-testid="admin-item-form-price" />
          </Field>
          <div className="space-y-1.5"><span className="text-sm font-medium">Các loại</span><Variants list={f.variants} set={(v) => s({ variants: v })} /></div>
          <div className="space-y-1.5"><span className="text-sm font-medium">Chất gây dị ứng (1–14)</span><AllergenPicker value={f.allergens} onChange={(a) => s({ allergens: a })} testPrefix="admin-item-form" /></div>
          <div className="space-y-1.5"><span className="text-sm font-medium">Ảnh</span><PhotoField value={f.image} onChange={(url) => s({ image: url })} /></div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle id="visible" label="Hiển thị trên web" checked={f.visible} onChange={(v) => s({ visible: v })} />
            <Toggle id="featured" label="Nổi bật ở trang chủ" checked={f.featured} onChange={(v) => s({ featured: v })} />
            <Toggle id="vegetarian" label="Món chay" checked={f.vegetarian} onChange={(v) => s({ vegetarian: v })} />
            <Toggle id="vegan" label="Thuần chay" checked={f.vegan} onChange={(v) => s({ vegan: v })} />
          </div>
          {errors.length > 0 && (
            <div className="space-y-1 rounded-2xl bg-lacquer/10 p-4 text-sm text-lacquer" role="alert" data-testid="admin-item-form-errors">
              {errors.map((x, i) => <p key={i}>{x}</p>)}
            </div>
          )}
          <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-tamarind/10 bg-paper px-5 pb-1 pt-3">
            <button type="submit" disabled={busy} className="h-12 flex-1 rounded-full bg-lacquer font-medium text-paper disabled:opacity-60" data-testid="admin-item-form-save">{busy ? "Đang lưu…" : "Lưu"}</button>
            <button type="button" onClick={onClose} className="h-12 rounded-full border border-tamarind/20 px-5" data-testid="admin-item-form-cancel">Hủy</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
