import { imgUrl } from "../../lib/api";
import { T, pick, formatPrice } from "../../lib/i18n";
import { Leaf, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../../context/CartContext";

export const AllergenChips = ({ list, testPrefix }) =>
  list?.length ? (
    <span className="inline-flex flex-wrap items-center gap-1" data-testid={`${testPrefix}-allergens`}>
      {list.map((a) => (
        <span
          key={a}
          title={`Alergen ${a}`}
          data-testid={`allergen-badge-${a}`}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-tamarind/25 px-1 font-mono text-[10px] text-tamarind/70"
        >
          {a}
        </span>
      ))}
    </span>
  ) : null;

const DietBadges = ({ item, lang }) => (
  <>
    {item.vegan && (
      <span className="inline-flex items-center gap-1 rounded-full bg-herb px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-50" data-testid={`vegan-badge-${item.id}`}>
        <Leaf size={11} /> {T[lang].vegan}
      </span>
    )}
    {item.vegetarian && !item.vegan && (
      <span className="inline-flex items-center gap-1 rounded-full border border-herb/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-herb" data-testid={`vegetarian-badge-${item.id}`}>
        <Leaf size={11} /> {T[lang].vegetarian}
      </span>
    )}
  </>
);

const AddButton = ({ onClick, label, testId }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    aria-label={label}
    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-lacquer px-3 text-xs font-medium text-paper transition-colors hover:bg-lacquer-dark"
  >
    <Plus size={14} /> {label}
  </button>
);

export const DishCard = ({ item, lang }) => {
  const name = pick(lang, item.name, item.name_en);
  const desc = pick(lang, item.desc_cz, item.desc_en);
  const cart = useCart();
  const canOrder = cart?.ordering?.accepting;
  const add = (variant = null) => {
    cart.add(item, variant);
    toast.success(T[lang].cart.added, { description: name, duration: 1800 });
  };
  return (
    <article data-testid={`menu-item-card-${item.id}`} className="group flex flex-col rounded-2xl border border-tamarind/10 bg-sand/60 p-5 transition-[background-color,box-shadow] duration-300 hover:bg-sand hover:shadow-[0_12px_40px_-16px_rgba(62,35,25,0.25)] sm:p-6">
      <div className="relative -mx-2 mb-4 flex aspect-[4/3] items-center justify-center">
        {item.image ? (
          <img src={imgUrl(item.image)} alt={name} loading="lazy" className="dish-float max-h-full max-w-full object-contain drop-shadow-[0_18px_22px_rgba(62,35,25,0.22)]" data-testid={`menu-item-image-${item.id}`} />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-tamarind/15">
            <span className="font-display text-5xl text-tamarind/15">{item.number || "—"}</span>
          </div>
        )}
        {item.number && (
          <span className="absolute left-2 top-0 font-mono text-xs tracking-widest text-lacquer">Nº {item.number}</span>
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-xl leading-snug sm:text-[22px]" data-testid={`menu-item-name-${item.id}`}>{name}</h3>
        {item.price != null && (
          <span className="shrink-0 pt-1 font-mono text-[15px] font-medium text-lacquer" data-testid={`menu-item-price-${item.id}`}>{formatPrice(item.price)}</span>
        )}
      </div>
      {desc && <p className="mt-2 text-sm leading-normal text-tamarind/75">{desc}</p>}
      {item.variants?.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-tamarind/10 pt-3" data-testid={`menu-item-variants-${item.id}`}>
          {item.variants.map((v, i) => (
            <li key={i} className="flex items-baseline gap-2 text-sm">
              <span className="font-mono text-[11px] text-tamarind/40">{String.fromCharCode(65 + i)}</span>
              <span>{pick(lang, v.label_cz, v.label_en)}</span>
              <AllergenChips list={v.allergens} testPrefix={`variant-${item.id}-${i}`} />
              <span className="dotted-leader" />
              <span className="font-mono text-[13px] text-lacquer">{formatPrice(v.price)}</span>
              {canOrder && <AddButton onClick={() => add(i)} label={T[lang].cart.add} testId={`add-${item.id}-${i}`} />}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <DietBadges item={item} lang={lang} />
        <AllergenChips list={item.allergens} testPrefix={`menu-item-${item.id}`} />
        {canOrder && item.price != null && !item.variants?.length && (
          <span className="ml-auto">
            <AddButton onClick={() => add()} label={T[lang].cart.add} testId={`add-${item.id}`} />
          </span>
        )}
      </div>
    </article>
  );
};
