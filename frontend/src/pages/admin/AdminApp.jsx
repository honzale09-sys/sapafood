import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";
import AdminDaily from "./AdminDaily";
import AdminMenu from "./AdminMenu";
import AdminPassword from "./AdminPassword";
import AdminOrders from "./AdminOrders";

const Gate = () => {
  const { user } = useAuth();
  if (user === null) return <div className="flex min-h-screen items-center justify-center bg-paper font-mono text-sm text-tamarind/50" data-testid="admin-loading">Đang tải…</div>;
  if (!user) return <AdminLogin />;
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/denni-menu" replace />} />
        <Route path="denni-menu" element={<AdminDaily />} />
        <Route path="menu" element={<AdminMenu />} />
        <Route path="objednavky" element={<AdminOrders />} />
        <Route path="heslo" element={<AdminPassword />} />
        <Route path="*" element={<Navigate to="/admin/denni-menu" replace />} />
      </Route>
    </Routes>
  );
};

export default function AdminApp() {
  useEffect(() => {
    document.documentElement.lang = "vi";
  }, []);
  return (
    <AuthProvider>
      <title>Quản trị | Sapa Food</title>
      <meta name="robots" content="noindex, nofollow" />
      <Gate />
    </AuthProvider>
  );
}
