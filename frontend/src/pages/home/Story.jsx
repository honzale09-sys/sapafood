import { Link } from "react-router-dom";
import { Reveal } from "../../components/site/Reveal";
import { ROUTES, T } from "../../lib/i18n";
import { GALLERY } from "../../config/site";
import { imgUrl } from "../../lib/api";

const WORDS = ["Pho Bo", "Bún Chả", "Pad Thai", "Bún Nem", "Tom Kha", "Xào Sả Ớt", "Pho Ga", "Nam Tok Ped", "Kung Pao", "Bo Luc Lac"];

export const Marquee = () => (
  <div className="overflow-hidden border-y border-tamarind/10 bg-lacquer py-4 text-paper" aria-hidden data-testid="home-marquee">
    <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
      {[...WORDS, ...WORDS].map((w, i) => (
        <span key={i} className="flex items-center gap-10 font-display text-2xl sm:text-3xl">
          {w} <span className="inline-block h-2 w-2 rounded-full bg-turmeric" />
        </span>
      ))}
    </div>
  </div>
);

export const Story = ({ lang }) => {
  const t = T[lang];
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-12" data-testid="home-story">
      <div className="grid gap-14 md:grid-cols-12 md:gap-10">
        <Reveal className="md:col-span-5 md:pt-10">
          <p className="eyebrow text-lacquer">{t.storyEyebrow}</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">{t.storyTitle}</h2>
          {t.story.map((p, i) => (
            <p key={i} className={`text-base leading-normal text-tamarind/80 sm:text-lg ${i === 0 ? "mt-8" : "mt-5"}`}>
              {p}
            </p>
          ))}
          <Link to={ROUTES.about[lang]} data-testid="home-story-about-link" className="mt-8 inline-block border-b border-lacquer pb-1 text-sm font-medium text-lacquer hover:border-turmeric hover:text-turmeric">
            {t.nav.about} →
          </Link>
        </Reveal>
        <div className="relative grid grid-cols-6 gap-4 md:col-span-7">
          <Reveal className="col-span-4 aspect-[4/5] overflow-hidden rounded-[2rem]" delay={100}>
            <img src={imgUrl(GALLERY[0].src)} alt={GALLERY[0].alt[lang]} loading="lazy" className="h-full w-full object-cover" />
          </Reveal>
          <Reveal className="col-span-2 mt-24 flex flex-col gap-4" delay={250}>
            <div className="aspect-[3/4] overflow-hidden rounded-full">
              <img src={imgUrl(GALLERY[2].src)} alt={GALLERY[2].alt[lang]} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <p className="font-display text-sm leading-snug text-tamarind/60">Vodičkova 699/28 · Praha 1</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
