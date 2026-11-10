import { Clock } from "lucide-react";
import { useLang } from "../components/site/Layout";
import { useTodayMenu } from "../components/site/useTodayMenu";
import { DailyItems, DailyEmpty } from "../components/site/DailyItems";
import { AllergenLegend } from "../components/site/AllergenLegend";
import { T, formatDate, pick } from "../lib/i18n";
import { PageHead } from "./PageHead";

export default function DailyMenuPage() {
  const lang = useLang();
  const t = T[lang];
  const { loading, today, menu } = useTodayMenu();
  return (
    <div data-testid="daily-menu-page">
      <PageHead eyebrow={t.dailyEyebrow} title={t.dailyTitle}>
        <div className="hero-rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "250ms" }}>
          {today && <p className="font-display text-2xl" data-testid="daily-menu-date">{formatDate(today, lang)}</p>}
          <span className="inline-flex items-center gap-2 rounded-full bg-turmeric px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-tamarind-deep" data-testid="daily-menu-served-until">
            <Clock size={13} /> {t.servedUntil}
          </span>
        </div>
      </PageHead>
      <div className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        {loading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-sand" />
        ) : menu ? (
          <>
            {pick(lang, menu.note_cz, menu.note_en) && (
              <p className="mb-6 rounded-2xl border border-herb/20 bg-herb/5 px-5 py-4 text-[15px] text-herb" data-testid="daily-menu-note">
                {pick(lang, menu.note_cz, menu.note_en)}
              </p>
            )}
            <DailyItems menu={menu} lang={lang} />
          </>
        ) : (
          <DailyEmpty lang={lang} />
        )}
        <div className="mt-20"><AllergenLegend lang={lang} /></div>
      </div>
    </div>
  );
}
