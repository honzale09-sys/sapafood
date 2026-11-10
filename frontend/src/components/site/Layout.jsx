import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBar } from "./MobileBar";
import { Seo } from "./Seo";

export const useLang = () => useOutletContext().lang;

export default function Layout({ lang }) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  if (!pathname.endsWith("/")) return <Navigate to={`${pathname}/${hash}`} replace />;

  return (
    <div className="grain min-h-screen bg-paper pb-[76px] md:pb-0" data-testid={`site-layout-${lang}`}>
      <Seo lang={lang} />
      <Header lang={lang} />
      <main>
        <Outlet context={{ lang }} />
      </main>
      <Footer lang={lang} />
      <MobileBar lang={lang} />
    </div>
  );
}
