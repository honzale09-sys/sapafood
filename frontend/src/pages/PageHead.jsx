export const PageHead = ({ eyebrow, title, intro, children }) => (
  <header className="mx-auto max-w-7xl px-5 pb-12 pt-32 sm:px-8 sm:pb-16 sm:pt-40 lg:px-12" data-testid="page-head">
    <p className="eyebrow hero-rise text-lacquer">{eyebrow}</p>
    <h1 className="hero-rise mt-4 font-display text-5xl leading-none sm:text-6xl lg:text-7xl" style={{ animationDelay: "100ms" }} data-testid="page-title">
      {title}
    </h1>
    {intro && <p className="hero-rise mt-6 max-w-xl text-base text-tamarind/70 sm:text-lg" style={{ animationDelay: "200ms" }}>{intro}</p>}
    {children}
  </header>
);
