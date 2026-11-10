import { ALLERGENS, T } from "../../lib/i18n";

export const AllergenLegend = ({ lang, id = "alergeny" }) => (
  <section id={id} className="scroll-mt-32 rounded-3xl border border-tamarind/10 bg-sand/70 p-6 sm:p-10" data-testid="allergen-legend">
    <p className="eyebrow text-lacquer">{T[lang].allergens}</p>
    <h2 className="mt-3 font-display text-2xl sm:text-3xl">{T[lang].allergenLegend}</h2>
    <p className="mt-3 max-w-2xl text-sm text-tamarind/70">{T[lang].allergenNote}</p>
    <ol className="mt-8 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {ALLERGENS[lang].map((a, i) => (
        <li key={i} className="flex items-baseline gap-3 border-b border-tamarind/10 pb-3" data-testid={`allergen-legend-item-${i + 1}`}>
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tamarind font-mono text-xs text-paper">{i + 1}</span>
          <span className="text-[15px]">{a}</span>
        </li>
      ))}
    </ol>
  </section>
);
