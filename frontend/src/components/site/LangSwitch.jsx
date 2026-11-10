import { Link, useLocation } from "react-router-dom";
import { ROUTES, pageKeyFromPath } from "../../lib/i18n";

export const LangSwitch = ({ lang, light = false, testPrefix = "header" }) => {
  const { pathname } = useLocation();
  const key = pageKeyFromPath(pathname);
  const base = light ? "text-paper/60 hover:text-paper" : "text-tamarind/50 hover:text-tamarind";
  const active = light ? "text-paper" : "text-lacquer";
  return (
    <div className="flex items-center gap-1 font-mono text-xs tracking-widest" data-testid={`${testPrefix}-language-switcher`}>
      <Link
        to={ROUTES[key].cs}
        hrefLang="cs"
        data-testid={`${testPrefix}-language-switcher-cz`}
        className={`px-1.5 py-1 transition-colors ${lang === "cs" ? active : base}`}
      >
        CZ
      </Link>
      <span className={light ? "text-paper/30" : "text-tamarind/25"}>/</span>
      <Link
        to={ROUTES[key].en}
        hrefLang="en"
        data-testid={`${testPrefix}-language-switcher-en`}
        className={`px-1.5 py-1 transition-colors ${lang === "en" ? active : base}`}
      >
        EN
      </Link>
    </div>
  );
};
