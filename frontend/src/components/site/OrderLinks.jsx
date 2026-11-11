import { ChevronDown, ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { SITE } from "../../config/site";
import { ROUTES, T } from "../../lib/i18n";

const PROVIDERS = [
  { key: "wolt", name: "Wolt", href: SITE.wolt },
  { key: "foodora", name: "Foodora", href: SITE.foodora },
];

export const OrderMenu = ({ lang, testId, variant = "solid", label }) => {
  const t = T[lang];
  const cls =
    variant === "ghost"
      ? "border border-paper/40 text-paper hover:bg-paper hover:text-tamarind"
      : "bg-lacquer text-paper hover:bg-lacquer-dark";
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        data-testid={testId}
        className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors ${cls}`}
      >
        {label || t.order} <ChevronDown size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[70] min-w-[200px] rounded-xl border-tamarind/15 bg-paper p-1.5">
        <DropdownMenuItem asChild>
          <Link
            to={ROUTES.menu[lang]}
            data-testid={`${testId}-online`}
            className="flex cursor-pointer items-center justify-between rounded-lg bg-sand px-3 py-3 text-[15px] font-medium text-lacquer"
          >
            {t.orderOnline} <ShoppingBag size={16} />
          </Link>
        </DropdownMenuItem>
        {PROVIDERS.map((p) => (
          <DropdownMenuItem key={p.key} asChild>
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`${testId}-${p.key}`}
              className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-[15px] text-tamarind"
            >
              {t.orderVia} {p.name} <ArrowUpRight size={16} className="text-lacquer" />
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const OrderButtons = ({ lang, testPrefix, dark = false }) => (
  <div className="flex flex-wrap gap-3">
    {PROVIDERS.map((p) => (
      <a
        key={p.key}
        href={p.href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`${testPrefix}-${p.key}`}
        className={`group inline-flex h-12 items-center gap-3 rounded-full border px-6 text-sm font-medium transition-colors ${
          dark
            ? "border-paper/30 text-paper hover:bg-paper hover:text-tamarind"
            : "border-tamarind/25 text-tamarind hover:border-lacquer hover:bg-lacquer hover:text-paper"
        }`}
      >
        {T[lang].orderVia} {p.name}
        <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </a>
    ))}
  </div>
);
