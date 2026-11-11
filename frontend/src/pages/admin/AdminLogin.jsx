import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { errMsg } from "../../lib/api";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-tamarind px-5" data-testid="admin-login-page">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-paper p-8 shadow-2xl" data-testid="admin-login-form">
        <p className="font-display text-3xl">Sapa <span className="text-turmeric">Food</span></p>
        <p className="eyebrow mt-2 text-tamarind/50">Quản trị</p>
        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-white text-base" data-testid="admin-login-email-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-white text-base" data-testid="admin-login-password-input" />
          </div>
          {error && <p className="rounded-xl bg-lacquer/10 px-4 py-3 text-sm text-lacquer" role="alert" data-testid="admin-login-error">{error}</p>}
          <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-lacquer text-base font-medium text-paper transition-colors hover:bg-lacquer-dark disabled:opacity-60" data-testid="admin-login-submit-button">
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </div>
      </form>
    </div>
  );
}
