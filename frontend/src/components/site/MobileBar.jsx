import { Link } from "react-router-dom";
import { UtensilsCrossed, Phone, ShoppingBag } from "lucide-react";
import { ROUTES, T } from "../../lib/i18n";
import { SITE } from "../../config/site";

export const MobileBar = ({ lang }) => {
  const t = T[lang];
  const item = "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium tracking-wide";
  return (
    <nav
      data-testid="mobile-sticky-bar"
      className="fixed inset-x-0 bottom-0 z-50 flex gap-2 border-t border-tamarind/10 bg-paper/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"
    >
      <Link to={ROUTES.menu[lang]} data-testid="mobile-sticky-menu-button" className={`${item} text-tamarind`}>
        <UtensilsCrossed size={20} strokeWidth={1.6} />
        {t.nav.menu}
      </Link>
      <a href={SITE.phoneHref} data-testid="mobile-sticky-call-button" className={`${item} text-tamarind`}>
        <Phone size={20} strokeWidth={1.6} />
        {t.call}
      </a>
      <a
        href={SITE.wolt}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="mobile-sticky-wolt-button"
        className={`${item} flex-[1.6] bg-lacquer text-paper`}
      >
        <ShoppingBag size={20} strokeWidth={1.6} />
        {t.orderVia} Wolt
      </a>
    </nav>
  );
};
