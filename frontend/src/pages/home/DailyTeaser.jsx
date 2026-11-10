import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Reveal } from "../../components/site/Reveal";
import { useTodayMenu } from "../../components/site/useTodayMenu";
import { DailyItems, DailyEmpty } from "../../components/site/DailyItems";
import { ROUTES, T, formatDate, pick } from "../../lib/i18n";

export const DailyTeaser = ({ lang }) => {
  const t = T[lang];
  const { loading, today, menu } = useTodayMenu();
  return (
    <section className="bg-tamarind py-24 text-paper sm:py-32" data-testid="home-daily-teaser">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 md:grid-cols-12 lg:px-12">
        <Reveal className="md:col-span-5">
          <p className="eyebrow text-turmeric">{t.dailyEyebrow}</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">{t.dailyTitle}</h2>
          {today && <p className="mt-6 font-display text-xl text-paper/80" data-testid="home-daily-date">{formatDate(today, lang)}</p>}
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-turmeric px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-tamarind-deep">
            <Clock size={13} /> {t.servedUntil}
          </p>
          {menu && pick(lang, menu.note_cz, menu.note_en) && <p className="mt-6 text-paper/75">{pick(lang, menu.note_cz, menu.note_en)}</p>}
          <Link to={ROUTES.daily[lang]} data-testid="home-daily-link" className="mt-8 block w-fit border-b border-turmeric pb-1 text-sm font-medium text-turmeric hover:text-paper">
            {t.seeDaily} →
          </Link>
        </Reveal>
        <Reveal className="md:col-span-7" delay={150}>
          {loading ? <div className="h-48 animate-pulse rounded-3xl bg-paper/5" /> : menu ? <DailyItems menu={menu} lang={lang} dark /> : <DailyEmpty lang={lang} dark />}
        </Reveal>
      </div>
    </section>
  );
};
