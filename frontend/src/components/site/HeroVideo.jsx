import { useEffect, useRef, useState } from "react";
import { HERO } from "../../config/hero";

const canPlayMotion = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))) return false;
  return true;
};

export const HeroVideo = () => {
  const ref = useRef(null);
  const [isMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [sources, setSources] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const poster = isMobile ? HERO.posterMobile : HERO.poster;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute("muted", "");
    const list = isMobile && HERO.mobile.length ? HERO.mobile : HERO.desktop;
    if (list.length && canPlayMotion()) setSources(list);
  }, [isMobile]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !sources.length) return;
    v.load();
    const p = v.play();
    if (p && p.catch) p.catch(() => setBlocked(true));
  }, [sources]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-tamarind-deep" data-testid="hero-video-container">
      <img
        src={poster}
        alt=""
        aria-hidden
        data-testid="hero-poster-image"
        fetchpriority="high"
        className="absolute inset-0 h-full w-full scale-105 object-cover"
      />
      <video
        ref={ref}
        data-testid="hero-video"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${blocked ? "opacity-0" : "opacity-100"}`}
        poster={poster}
        muted
        autoPlay
        loop
        playsInline
        preload={sources.length ? "auto" : "none"}
        aria-hidden
      >
        {sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-tamarind-deep via-tamarind-deep/55 to-tamarind-deep/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-tamarind-deep/70 via-transparent to-transparent" />
      <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-tamarind-deep/60 via-tamarind-deep/35 to-transparent md:hidden" />
    </div>
  );
};
