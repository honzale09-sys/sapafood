import { useEffect, useRef, useState } from "react";
import { useLang } from "../components/site/Layout";
import { api } from "../lib/api";
import { T, pick } from "../lib/i18n";
import { DishCard } from "../components/site/DishCard";
import { AllergenLegend } from "../components/site/AllergenLegend";
import { PageHead } from "./PageHead";

const CategoryNav = ({ cats, active, lang, onPick }) => {
  const navRef = useRef(null);
  useEffect(() => {
    const el = navRef.current?.querySelector(`[data-active="true"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);
  return (
    <div className="sticky top-16 z-40 border-y border-tamarind/10 bg-paper/90 backdrop-blur-xl lg:top-20" data-testid="menu-category-nav">
      <div ref={navRef} className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8 lg:px-12">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            data-active={active === c.id}
            data-testid={`category-tab-${c.id}`}
            onClick={() => onPick(c.id)}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${active === c.id ? "bg-lacquer text-paper" : "text-tamarind/70 hover:bg-sand hover:text-tamarind"}`}
          >
            {pick(lang, c.name_cz, c.name_en)}
          </button>
        ))}
        <a href="#alergeny" data-testid="category-tab-allergens" className="flex h-10 shrink-0 items-center rounded-full px-4 font-mono text-xs uppercase tracking-widest text-tamarind/50 hover:text-lacquer">
          {T[lang].allergens} 1–14
        </a>
      </div>
    </div>
  );
};

export default function MenuPage() {
  const lang = useLang();
  const t = T[lang];
  const [cats, setCats] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/menu").then(({ data }) => {
      setCats(data.categories);
      setActive(data.categories[0]?.id);
    }).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    if (!cats?.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.dataset.cat)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    cats.forEach((c) => { const el = document.getElementById(`cat-${c.id}`); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [cats]);

  const jump = (id) => {
    const el = document.getElementById(`cat-${id}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
  };

  return (
    <div data-testid="menu-page">
      <PageHead eyebrow="Sapa Food" title={t.menuTitle} intro={t.menuIntro} />
      {cats === null && <p className="px-5 py-20 text-center text-tamarind/60" data-testid="menu-loading">{t.menuLoading}</p>}
      {cats?.length > 0 && <CategoryNav cats={cats} active={active} lang={lang} onPick={jump} />}
      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-12">
        {cats?.map((c, ci) => (
          <section key={c.id} id={`cat-${c.id}`} data-cat={c.id} className="pt-16 sm:pt-20" data-testid={`menu-category-${c.id}`}>
            <div className="mb-8 flex items-baseline gap-4 border-b border-tamarind/15 pb-4">
              <span className="font-mono text-xs text-lacquer">{String(ci + 1).padStart(2, "0")}</span>
              <h2 className="font-display text-3xl sm:text-4xl">{pick(lang, c.name_cz, c.name_en)}</h2>
              <span className="ml-auto font-mono text-xs text-tamarind/40">{c.items.length}</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {c.items.map((it) => <DishCard key={it.id} item={it} lang={lang} />)}
            </div>
          </section>
        ))}
        <div className="pt-20"><AllergenLegend lang={lang} /></div>
      </div>
    </div>
  );
}
