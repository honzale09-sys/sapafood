import { Reveal } from "../../components/site/Reveal";
import { T } from "../../lib/i18n";
import { GALLERY } from "../../config/site";
import { imgUrl } from "../../lib/api";

const SPANS = [
  "col-span-2 row-span-2 md:col-span-3 md:row-span-2",
  "col-span-1 md:col-span-2",
  "col-span-1 md:col-span-1",
  "col-span-1 md:col-span-1 md:row-span-2",
  "col-span-1 md:col-span-2",
  "col-span-2 md:col-span-2",
  "col-span-1 md:col-span-2",
  "col-span-1 md:col-span-2",
];

export const GalleryGrid = ({ lang }) => (
  <div className="grid auto-rows-[140px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-6 md:gap-4" data-testid="gallery-grid">
    {GALLERY.map((g, i) => (
      <Reveal key={g.src} delay={(i % 4) * 90} className={`group overflow-hidden rounded-2xl ${SPANS[i]}`} data-testid={`gallery-image-${i}`}>
        <img src={imgUrl(g.src)} alt={g.alt[lang]} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
      </Reveal>
    ))}
  </div>
);

export const Gallery = ({ lang }) => (
  <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-12" data-testid="home-gallery">
    <Reveal className="mb-12">
      <p className="eyebrow text-lacquer">{T[lang].galleryEyebrow}</p>
      <h2 className="mt-4 font-display text-4xl sm:text-5xl">{T[lang].galleryTitle}</h2>
    </Reveal>
    <GalleryGrid lang={lang} />
  </section>
);
