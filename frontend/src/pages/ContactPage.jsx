import { useLang } from "../components/site/Layout";
import { T } from "../lib/i18n";
import { SITE } from "../config/site";
import { PageHead } from "./PageHead";
import { ContactBlock, MapFrame } from "./home/Visit";

export default function ContactPage() {
  const lang = useLang();
  const t = T[lang];
  return (
    <div data-testid="contact-page">
      <PageHead eyebrow="Sapa Food" title={t.contactTitle} />
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 sm:px-8 md:grid-cols-12 lg:px-12">
        <div className="md:col-span-5">
          <ContactBlock lang={lang} testPrefix="contact" />
          <div className="mt-10 rounded-2xl border border-tamarind/10 bg-sand/60 p-6 text-sm text-tamarind/70" data-testid="contact-company-info">
            <p className="eyebrow mb-2 text-tamarind/50">{t.company}</p>
            <p>Sapa Food · {SITE.street}, {SITE.city}, {SITE.country[lang]}</p>
            <p className="mt-1 font-mono text-xs">{SITE.company}</p>
            <p className="mt-1">{SITE.registry[lang]}</p>
          </div>
        </div>
        <div className="md:col-span-7">
          <MapFrame className="h-[420px] md:sticky md:top-28 md:h-[640px]" />
        </div>
      </section>
    </div>
  );
}
