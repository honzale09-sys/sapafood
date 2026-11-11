import { useState } from "react";
import { toast } from "sonner";
import { api, errMsg } from "../../lib/api";
import { Field, inputCls } from "./AdminFields";

export default function AdminPassword() {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (f.next.length < 8) return setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
    if (f.next !== f.again) return setError("Hai mật khẩu mới không khớp.");
    setBusy(true);
    try {
      await api.post("/auth/change-password", { current_password: f.current, new_password: f.next });
      toast.success("Đã đổi mật khẩu.");
      setF({ current: "", next: "", again: "" });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-5" data-testid="admin-password-form">
      <h1 className="font-display text-3xl">Đổi mật khẩu</h1>
      <Field label="Mật khẩu hiện tại"><input type="password" autoComplete="current-password" className={inputCls} value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} data-testid="admin-password-current" required /></Field>
      <Field label="Mật khẩu mới" hint="Ít nhất 8 ký tự."><input type="password" autoComplete="new-password" className={inputCls} value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} data-testid="admin-password-new" required /></Field>
      <Field label="Nhập lại mật khẩu mới"><input type="password" autoComplete="new-password" className={inputCls} value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} data-testid="admin-password-again" required /></Field>
      {error && <p className="rounded-xl bg-lacquer/10 px-4 py-3 text-sm text-lacquer" role="alert" data-testid="admin-password-error">{error}</p>}
      <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-lacquer text-base font-medium text-paper disabled:opacity-60" data-testid="admin-password-submit">
        {busy ? "Đang lưu…" : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
