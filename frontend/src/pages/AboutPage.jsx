import { useLang } from "../components/site/Layout";
import { T } from "../lib/i18n";
import { SITE } from "../config/site";
import { PageHead } from "./PageHead";
import { GalleryGrid } from "./home/Gallery";
import { Reveal } from "../components/site/Reveal";

export default function AboutPage() {
  const lang = useLang();
  const t = T[lang];
  return (
    <div data-testid="about-page">
      <PageHead eyebrow="Sapa Food" title={t.aboutTitle} />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 sm:px-8 md:grid-cols-12 lg:px-12">
        <Reveal className="md:col-span-7">
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">{t.storyTitle}</h2>
          {t.story.map((p, i) => (
            <p key={i} className="mt-5 text-base leading-normal text-tamarind/80 sm:text-lg" data-testid={`about-text-${i}`}>{p}</p>
          ))}
        </Reveal>
        <Reveal className="md:col-span-4 md:col-start-9" delay={150}>
          <div className="rounded-3xl bg-tamarind p-8 text-paper">
            <p className="eyebrow text-turmeric">{t.hours}</p>
            <p className="mt-3 font-display text-2xl">{SITE.hours[lang]}</p>
            <p className="font-mono text-lg">{SITE.hours.time}</p>
            <p className="mt-4 text-sm text-paper/70">{t.servedUntilLong}</p>
          </div>
        </Reveal>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-12">
        <GalleryGrid lang={lang} />
      </section>
    </div>
  );
}
