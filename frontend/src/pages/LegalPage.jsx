import { useLang } from "../components/site/Layout";
import { LEGAL } from "../lib/legal";
import { PageHead } from "./PageHead";

export default function LegalPage({ doc }) {
  const lang = useLang();
  const d = LEGAL[doc][lang];
  return (
    <div data-testid={`legal-${doc}`}>
      <PageHead eyebrow={lang === "en" ? `Effective from ${d.effective}` : `Účinné od ${d.effective}`} title={d.title} />
      <div className="mx-auto max-w-3xl space-y-10 px-5 pb-24 sm:px-8">
        {d.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-2xl">{s.h}</h2>
            {s.p.map((p, i) => (
              <p key={i} className="mt-3 leading-relaxed text-tamarind/80">{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
