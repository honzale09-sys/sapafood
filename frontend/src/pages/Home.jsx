import { Link } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
import { useLang } from "../components/site/Layout";
import { HeroVideo } from "../components/site/HeroVideo";
import { ROUTES, T } from "../lib/i18n";
import { SITE } from "../config/site";
import { OrderMenu } from "../components/site/OrderLinks";
import { Story, Marquee } from "./home/Story";
import { Featured } from "./home/Featured";
import { DailyTeaser } from "./home/DailyTeaser";
import { Gallery } from "./home/Gallery";
import { Visit } from "./home/Visit";

const Hero = ({ lang }) => {
  const t = T[lang];
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden" data-testid="hero-section">
      <HeroVideo />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-24 lg:px-12">
        <p className="eyebrow hero-rise text-turmeric [text-shadow:0_1px_2px_rgba(36,20,14,0.9),0_0_14px_rgba(36,20,14,0.85)]" data-testid="hero-eyebrow">{t.heroEyebrow}</p>
        <h1 className="mt-5 max-w-4xl font-display text-[44px] leading-none text-paper sm:text-6xl lg:text-[88px]" data-testid="hero-title">
          {t.heroTitle.map((l, i) => (
            <span key={i} className={`hero-rise block ${i === 1 ? "text-turmeric" : ""}`} style={{ animationDelay: `${120 + i * 120}ms` }}>
              {l}
            </span>
          ))}
        </h1>
        <p className="hero-rise mt-6 max-w-lg text-base text-paper/80 sm:text-lg" style={{ animationDelay: "520ms" }}>{t.heroSub}</p>
        <div className="hero-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "640ms" }}>
          <Link to={ROUTES.menu[lang]} data-testid="hero-cta-menu" className="inline-flex h-12 items-center gap-2 rounded-full bg-paper px-7 text-sm font-medium text-tamarind transition-colors hover:bg-turmeric">
            {t.nav.menu} <ArrowRight size={16} />
          </Link>
          <Link to={ROUTES.daily[lang]} data-testid="hero-cta-daily-menu" className="inline-flex h-12 items-center rounded-full border border-paper/40 px-7 text-sm font-medium text-paper transition-colors hover:bg-paper hover:text-tamarind">
            {t.nav.daily}
          </Link>
          <OrderMenu lang={lang} testId="hero-cta-order-wolt" label={t.heroOrder} />
          <a href={SITE.phoneHref} data-testid="hero-cta-call" className="inline-flex h-12 items-center gap-2 px-3 text-sm font-medium text-paper/90 underline-offset-4 hover:underline">
            <Phone size={16} /> {t.call}
          </a>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const lang = useLang();
  return (
    <div data-testid="home-page">
      <Hero lang={lang} />
      <Marquee />
      <Story lang={lang} />
      <Featured lang={lang} />
      <DailyTeaser lang={lang} />
      <Gallery lang={lang} />
      <Visit lang={lang} />
    </div>
  );
}
