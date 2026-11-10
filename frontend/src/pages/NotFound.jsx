import { Link, useLocation } from "react-router-dom";
import { T } from "../lib/i18n";

export default function NotFound() {
  const { pathname } = useLocation();
  const lang = pathname.startsWith("/en") ? "en" : "cs";
  return (
    <div className="grain flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center text-tamarind" data-testid="not-found-page">
      <title>404 | Sapa Food</title>
      <p className="font-display text-8xl text-lacquer">404</p>
      <h1 className="mt-4 font-display text-3xl">{T[lang].notFound}</h1>
      <Link to={lang === "en" ? "/en/" : "/"} data-testid="not-found-home-link" className="mt-8 inline-flex h-12 items-center rounded-full bg-lacquer px-6 text-sm text-paper">
        {T[lang].backHome}
      </Link>
    </div>
  );
}
