import { NavLink, Outlet, Link } from "react-router-dom";
import { CalendarDays, BookOpen, KeyRound, LogOut, ExternalLink, ShoppingBag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const TABS = [
  { to: "/admin/objednavky", label: "Đơn hàng", icon: ShoppingBag, id: "orders" },
  { to: "/admin/denni-menu", label: "Thực đơn ngày", icon: CalendarDays, id: "daily" },
  { to: "/admin/menu", label: "Thực đơn", icon: BookOpen, id: "menu" },
  { to: "/admin/heslo", label: "Mật khẩu", icon: KeyRound, id: "password" },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  return (
    <div className="min-h-screen bg-paper pb-24 text-tamarind md:pb-10" data-testid="admin-layout">
      <header className="sticky top-0 z-40 border-b border-tamarind/10 bg-paper/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div>
            <p className="font-display text-xl">Sapa <span className="text-turmeric">Food</span></p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-tamarind/50">{user?.email}</p>
          </div>
          <nav className="hidden gap-1 md:flex">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} data-testid={`admin-nav-${t.id}`} className={({ isActive }) => `flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium ${isActive ? "bg-tamarind text-paper" : "hover:bg-sand"}`}>
                <t.icon size={16} /> {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link to="/" target="_blank" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sand" title="Xem trang web" data-testid="admin-view-site"><ExternalLink size={18} /></Link>
            <button type="button" onClick={logout} className="flex h-11 items-center gap-2 rounded-full px-3 text-sm hover:bg-sand" data-testid="admin-logout-button">
              <LogOut size={18} /> <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-tamarind/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} data-testid={`admin-mobile-nav-${t.id}`} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium ${isActive ? "text-lacquer" : "text-tamarind/60"}`}>
            <t.icon size={20} /> {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
