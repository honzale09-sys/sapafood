import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, imgUrl } from "../../lib/api";
import { Reveal } from "../../components/site/Reveal";
import { ROUTES, T, pick, formatPrice } from "../../lib/i18n";

const priceOf = (it) => (it.price != null ? formatPrice(it.price) : it.variants?.length ? `${Math.min(...it.variants.map((v) => v.price))}+ Kč` : "");

export const Featured = ({ lang }) => {
  const t = T[lang];
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/menu/featured").then(({ data }) => setItems(data)).catch(() => setItems([]));
  }, []);
  if (!items.length) return null;
  return (
    <section className="bg-sand/70 py-24 sm:py-32" data-testid="home-featured">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal>
            <p className="eyebrow text-lacquer">{t.featuredEyebrow}</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl sm:text-5xl">{t.featuredTitle}</h2>
          </Reveal>
          <Link to={ROUTES.menu[lang]} data-testid="home-featured-full-menu" className="inline-flex h-12 w-fit items-center rounded-full border border-tamarind/25 px-6 text-sm font-medium hover:border-lacquer hover:bg-lacquer hover:text-paper">
            {t.fullMenu} →
          </Link>
        </div>
        <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.id} delay={(i % 3) * 120} className={`group ${i % 3 === 1 ? "lg:mt-16" : ""}`} data-testid={`featured-dish-${it.id}`}>
              <Link to={ROUTES.menu[lang]} className="block">
                <div className="relative flex aspect-square items-center justify-center rounded-full bg-paper">
                  <span className="absolute left-4 top-4 font-mono text-xs text-lacquer">Nº {it.number}</span>
                  {it.image && (
                    <img src={imgUrl(it.image)} alt={pick(lang, it.name, it.name_en)} loading="lazy" className="dish-float w-[88%] object-contain drop-shadow-[0_24px_28px_rgba(62,35,25,0.28)]" />
                  )}
                </div>
                <div className="mt-6 flex items-baseline gap-3">
                  <h3 className="font-display text-2xl">{pick(lang, it.name, it.name_en)}</h3>
                  <span className="dotted-leader" />
                  <span className="font-mono text-sm text-lacquer">{priceOf(it)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-tamarind/70">{pick(lang, it.desc_cz, it.desc_en)}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
