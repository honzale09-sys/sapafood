import { Link } from "react-router-dom";
import { ROUTES, T } from "../../lib/i18n";
import { SITE } from "../../config/site";
import { LangSwitch } from "./LangSwitch";

export const Footer = ({ lang }) => {
  const t = T[lang];
  return (
    <footer className="relative bg-tamarind-deep text-paper" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-20 sm:px-8 lg:px-12">
        <p className="font-display text-[18vw] leading-[0.9] text-paper/[0.08] sm:text-[12vw] lg:text-[160px]" aria-hidden>
          Sapa Food
        </p>
        <div className="mt-10 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-display text-2xl">{t.footerTag}</p>
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" data-testid="footer-facebook-link" className="mt-6 inline-block eyebrow text-turmeric hover:text-paper">
              Facebook ↗
            </a>
          </div>
          <div className="md:col-span-3">
            <p className="eyebrow text-paper/50">{t.address}</p>
            <p className="mt-3 leading-normal">{SITE.street}<br />{SITE.city}</p>
            <p className="eyebrow mt-6 text-paper/50">{t.hours}</p>
            <p className="mt-3">{SITE.hours[lang]}<br /><span className="font-mono">{SITE.hours.time}</span></p>
          </div>
          <div className="md:col-span-3">
            <p className="eyebrow text-paper/50">{t.contactHead}</p>
            <a href={SITE.phoneHref} data-testid="footer-phone-link" className="mt-3 block font-mono hover:text-turmeric">{SITE.phone}</a>
            <a href={`mailto:${SITE.email}`} data-testid="footer-email-link" className="mt-1 block hover:text-turmeric">{SITE.email}</a>
          </div>
          <div className="md:col-span-2">
            <ul className="space-y-2">
              {["menu", "daily", "about", "contact"].map((k) => (
                <li key={k}>
                  <Link to={ROUTES[k][lang]} data-testid={`footer-nav-${k}`} className="hover:text-turmeric">{t.nav[k]}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-paper/10 pt-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Sapa Food · {SITE.company}</p>
          <LangSwitch lang={lang} light testPrefix="footer" />
        </div>
      </div>
    </footer>
  );
};
