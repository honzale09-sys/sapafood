import { Link } from "react-router-dom";
import { AllergenChips } from "./DishCard";
import { ROUTES, T, pick, formatPrice } from "../../lib/i18n";

export const DailyItems = ({ menu, lang, dark = false }) => (
  <ol className="divide-y divide-current/10" data-testid="daily-menu-items">
    {menu.items.map((it, i) => (
      <li key={i} className={`grid grid-cols-[auto_1fr] gap-x-5 py-5 ${dark ? "border-paper/10" : "border-tamarind/10"}`} data-testid={`daily-menu-item-${i}`}>
        <span className={`pt-1 font-mono text-xs ${dark ? "text-turmeric" : "text-lacquer"}`}>{String(i + 1).padStart(2, "0")}</span>
        <div>
          <div className="flex items-baseline gap-3">
            <h3 className="font-display text-lg sm:text-xl" data-testid={`daily-menu-item-name-${i}`}>{it.name}</h3>
            <span className={`dotted-leader ${dark ? "!border-paper/25" : ""}`} />
            <span className={`shrink-0 font-mono text-[15px] ${dark ? "text-turmeric" : "text-lacquer"}`} data-testid={`daily-menu-item-price-${i}`}>{formatPrice(it.price)}</span>
          </div>
          {pick(lang, it.desc_cz, it.desc_en) && (
            <p className={`mt-1.5 text-sm leading-normal ${dark ? "text-paper/70" : "text-tamarind/70"}`}>{pick(lang, it.desc_cz, it.desc_en)}</p>
          )}
          <div className={`mt-2 ${dark ? "[&_span]:border-paper/25 [&_span]:text-paper/70" : ""}`}>
            <AllergenChips list={it.allergens} testPrefix={`daily-${i}`} />
          </div>
        </div>
      </li>
    ))}
  </ol>
);

export const DailyEmpty = ({ lang, dark = false }) => (
  <div data-testid="daily-menu-empty" className={`rounded-3xl border border-dashed p-8 sm:p-12 ${dark ? "border-paper/20" : "border-tamarind/20 bg-sand/50"}`}>
    <p className="font-display text-2xl sm:text-3xl">{T[lang].dailyEmptyTitle}</p>
    <p className={`mt-3 max-w-md text-[15px] ${dark ? "text-paper/70" : "text-tamarind/70"}`}>{T[lang].dailyEmptyText}</p>
    <Link
      to={ROUTES.menu[lang]}
      data-testid="daily-menu-empty-menu-link"
      className={`mt-6 inline-flex h-12 items-center rounded-full px-6 text-sm font-medium transition-colors ${dark ? "bg-paper text-tamarind hover:bg-turmeric" : "bg-lacquer text-paper hover:bg-lacquer-dark"}`}
    >
      {T[lang].seeMenu} →
    </Link>
  </div>
);
