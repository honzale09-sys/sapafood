import { useLocation } from "react-router-dom";
import { ROUTES, T, pageKeyFromPath } from "../../lib/i18n";

export const Seo = ({ lang }) => {
  const { pathname } = useLocation();
  const key = pageKeyFromPath(pathname);
  const [title, desc] = T[lang].seo[key];
  const origin = window.location.origin;
  const r = ROUTES[key];
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={origin + r[lang]} />
      <link rel="alternate" hrefLang="cs" href={origin + r.cs} />
      <link rel="alternate" hrefLang="en" href={origin + r.en} />
      <link rel="alternate" hrefLang="x-default" href={origin + r.cs} />
      <meta property="og:type" content="restaurant" />
      <meta property="og:site_name" content="Sapa Food" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={origin + r[lang]} />
      <meta property="og:image" content={`${origin}/media/hero-poster.jpg`} />
      <meta property="og:locale" content={lang === "en" ? "en_GB" : "cs_CZ"} />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
};
