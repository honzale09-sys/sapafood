import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu as MenuIcon, X, Phone } from "lucide-react";
import { ROUTES, T } from "../../lib/i18n";
import { SITE } from "../../config/site";
import { LangSwitch } from "./LangSwitch";
import { OrderMenu } from "./OrderLinks";

const NAV = ["menu", "daily", "about", "contact"];

export const Header = ({ lang }) => {
  const t = T[lang];
  const { pathname } = useLocation();
  const isHome = pathname === ROUTES.home[lang];
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const overHero = isHome && !scrolled && !open;
  const txt = overHero ? "text-paper" : "text-tamarind";

  return (
    <header
      data-testid="site-header"
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
        overHero ? "bg-transparent" : "bg-paper/90 backdrop-blur-xl shadow-[0_1px_0_rgba(62,35,25,0.08)]"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-20 lg:px-12">
        <Link to={ROUTES.home[lang]} data-testid="header-nav-logo" className={`group flex items-baseline gap-1.5 ${txt}`}>
          <span className="font-display text-2xl font-bold lg:text-[28px]">Sapa</span>
          <span className="font-display text-2xl font-bold text-turmeric lg:text-[28px]">Food</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" data-testid="header-nav">
          {NAV.map((k) => (
            <NavLink
              key={k}
              to={ROUTES[k][lang]}
              data-testid={`header-nav-${k}`}
              className={({ isActive }) =>
                `relative text-[15px] font-medium transition-colors ${txt} after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-turmeric after:transition-[width] after:duration-300 ${
                  isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
                }`
              }
            >
              {t.nav[k]}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <LangSwitch lang={lang} light={overHero} />
          <OrderMenu lang={lang} testId="header-order-button" />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LangSwitch lang={lang} light={overHero} testPrefix="mobile-header" />
          <button
            type="button"
            aria-label="Menu"
            data-testid="mobile-nav-toggle"
            onClick={() => setOpen((v) => !v)}
            className={`flex h-11 w-11 items-center justify-center rounded-full ${txt}`}
          >
            {open ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-tamarind/10 bg-paper px-5 pb-8 pt-4 md:hidden" data-testid="mobile-nav-panel">
          {NAV.map((k, i) => (
            <Link
              key={k}
              to={ROUTES[k][lang]}
              data-testid={`mobile-nav-${k}`}
              className="hero-rise flex items-center justify-between border-b border-tamarind/10 py-4 font-display text-3xl text-tamarind"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {t.nav[k]}
              <span className="font-mono text-xs text-tamarind/40">0{i + 1}</span>
            </Link>
          ))}
          <a href={SITE.phoneHref} data-testid="mobile-nav-call" className="mt-6 flex items-center gap-3 font-mono text-sm text-lacquer">
            <Phone size={16} /> {SITE.phone}
          </a>
        </div>
      )}
    </header>
  );
};
