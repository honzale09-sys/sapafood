import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { ROUTES, T, formatPrice } from "../../lib/i18n";

// Floating link to the order page; sits above the mobile bar.
export const CartBar = ({ lang }) => {
  const { count, total } = useCart();
  const { pathname } = useLocation();
  if (!count || pathname.startsWith(ROUTES.order[lang])) return null;
  return (
    <Link
      to={ROUTES.order[lang]}
      data-testid="cart-bar"
      className="fixed inset-x-3 bottom-[calc(84px+env(safe-area-inset-bottom))] z-50 flex items-center justify-between gap-3 rounded-full bg-tamarind-deep px-5 py-3.5 text-paper shadow-[0_12px_30px_rgba(36,20,14,0.35)] transition-colors hover:bg-tamarind md:inset-x-auto md:right-8 md:bottom-8 md:min-w-[320px]"
    >
      <span className="flex items-center gap-3 text-sm font-medium">
        <span className="relative">
          <ShoppingBag size={20} />
          <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-lacquer px-1 text-[11px]">{count}</span>
        </span>
        {T[lang].cart.bar}
      </span>
      <span className="flex items-center gap-2 font-mono text-sm">
        {formatPrice(total)} <ArrowRight size={16} />
      </span>
    </Link>
  );
};
