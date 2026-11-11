import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, MessageSquareWarning, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../../lib/api";
import { formatPrice } from "../../lib/i18n";
import { Switch } from "../../components/ui/switch";
import { Field, inputCls } from "./AdminFields";

const REFRESH_MS = 30000;

const SettingsCard = () => {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get("/admin/ordering").then(({ data }) => setS(data)).catch((e) => toast.error(errMsg(e)));
  }, []);
  if (!s) return null;
  const save = async (next = s) => {
    setSaving(true);
    try {
      const { data } = await api.put("/admin/ordering", { enabled: next.enabled, open: next.open, close: next.close, lead_minutes: Number(next.lead_minutes) || 0 });
      setS(data);
      toast.success("Đã lưu.");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="space-y-4 rounded-2xl border border-tamarind/10 bg-sand/60 p-5" data-testid="admin-ordering-settings">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Nhận đơn hàng online</p>
          <p className="text-sm text-tamarind/60">Khi tắt, khách không đặt được trên web và sẽ được chuyển sang Wolt và Foodora.</p>
        </div>
        <Switch
          checked={s.enabled}
          disabled={saving}
          data-testid="admin-ordering-enabled"
          onCheckedChange={(enabled) => {
            const next = { ...s, enabled };
            setS(next);
            save(next);
          }}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nhận đơn từ"><input className={inputCls} type="time" value={s.open} onChange={(e) => setS({ ...s, open: e.target.value })} /></Field>
        <Field label="Đến (giờ đóng cửa)"><input className={inputCls} type="time" value={s.close} onChange={(e) => setS({ ...s, close: e.target.value })} /></Field>
        <Field label="Thời gian chuẩn bị (phút)"><input className={inputCls} inputMode="numeric" value={s.lead_minutes} onChange={(e) => setS({ ...s, lead_minutes: e.target.value })} /></Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-tamarind/60">
          Thanh toán: {s.payments ? "đã kết nối" : "chưa cài đặt"} · SMS cho nhà hàng: {s.sms ? "đã kết nối" : "chưa cài đặt"}
        </p>
        <button type="button" onClick={() => save()} disabled={saving} className="flex h-11 items-center gap-2 rounded-full bg-lacquer px-5 text-sm font-medium text-paper disabled:opacity-60">
          <Save size={16} /> Lưu giờ
        </button>
      </div>
    </section>
  );
};

export default function AdminOrders() {
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    api.get("/admin/orders").then(({ data }) => setData(data)).catch((e) => toast.error(errMsg(e)));
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const done = async (ref) => {
    try {
      await api.put(`/admin/orders/${ref}/done`);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-orders-page">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Đơn hàng</h1>
          <p className="mt-1 text-sm text-tamarind/60">Đơn đã thanh toán hôm nay, khách đến lấy. Tự cập nhật mỗi 30 giây.</p>
        </div>
        <button type="button" onClick={load} className="flex h-11 w-11 items-center justify-center rounded-full border border-tamarind/20" aria-label="Làm mới">
          <RefreshCw size={16} />
        </button>
      </div>
      <SettingsCard />
      {!data ? null : !data.orders.length ? (
        <p className="rounded-2xl border border-dashed border-tamarind/20 p-8 text-center text-tamarind/60" data-testid="admin-orders-empty">Hôm nay chưa có đơn hàng nào.</p>
      ) : (
        <ul className="space-y-3">
          {data.orders.map((o) => (
            <li key={o.ref} className={`rounded-2xl border p-4 ${o.status === "done" ? "border-tamarind/10 opacity-60" : "border-lacquer/30 bg-white"}`} data-testid={`admin-order-${o.ref}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg"><span className="text-lacquer">{o.pickup}</span> · #{o.number}</p>
                  <p className="text-sm">{o.name} · <a href={`tel:${o.phone.replace(/\s/g, "")}`} className="underline">{o.phone}</a></p>
                </div>
                <div className="flex items-center gap-2">
                  {o.sms_state !== "sent" && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-900" title="Không gửi được SMS">
                      <MessageSquareWarning size={14} /> chưa gửi SMS
                    </span>
                  )}
                  {o.status === "done" ? (
                    <span className="flex items-center gap-1 text-sm text-herb"><CheckCircle2 size={16} /> Đã giao</span>
                  ) : (
                    <button type="button" onClick={() => done(o.ref)} className="h-10 rounded-full bg-herb px-4 text-sm font-medium text-paper" data-testid={`admin-order-done-${o.ref}`}>
                      Đã giao
                    </button>
                  )}
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {o.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{l.qty}× {l.number && <span className="font-mono text-lacquer">{l.number} </span>}{l.name}{l.label ? ` (${l.label})` : ""}</span>
                    <span className="font-mono">{formatPrice(l.price * l.qty)}</span>
                  </li>
                ))}
              </ul>
              {o.note && <p className="mt-2 rounded-lg bg-sand px-3 py-2 text-sm">Ghi chú: {o.note}</p>}
              <p className="mt-2 text-right font-mono text-sm">Tổng {formatPrice(o.total)} · đã thanh toán</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
