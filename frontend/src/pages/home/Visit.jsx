import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { Reveal } from "../../components/site/Reveal";
import { OrderButtons } from "../../components/site/OrderLinks";
import { T } from "../../lib/i18n";
import { SITE } from "../../config/site";

const Row = ({ icon: Icon, label, children }) => (
  <div className="flex gap-4 border-b border-tamarind/10 py-5">
    <Icon size={18} className="mt-1 shrink-0 text-lacquer" strokeWidth={1.6} />
    <div>
      <p className="eyebrow text-tamarind/50">{label}</p>
      <div className="mt-1.5 text-[17px]">{children}</div>
    </div>
  </div>
);

export const ContactBlock = ({ lang, testPrefix }) => {
  const t = T[lang];
  return (
    <div data-testid={`${testPrefix}-contact-block`}>
      <Row icon={MapPin} label={t.address}>
        {SITE.street}, {SITE.city}
        <a href={SITE.mapLink} target="_blank" rel="noopener noreferrer" data-testid={`${testPrefix}-directions-link`} className="mt-1 block text-sm text-lacquer underline-offset-4 hover:underline">{t.directions} ↗</a>
      </Row>
      <Row icon={Clock} label={t.hours}>
        {SITE.hours[lang]} <span className="font-mono">{SITE.hours.time}</span>
        <span className="mt-1 block text-sm text-tamarind/60">{t.servedUntilLong}</span>
      </Row>
      <Row icon={Phone} label={t.contactHead}>
        <a href={SITE.phoneHref} data-testid={`${testPrefix}-phone-link`} className="font-mono hover:text-lacquer">{SITE.phone}</a>
      </Row>
      <Row icon={Mail} label="E-mail">
        <a href={`mailto:${SITE.email}`} data-testid={`${testPrefix}-email-link`} className="hover:text-lacquer">{SITE.email}</a>
      </Row>
      <div className="pt-8">
        <p className="eyebrow text-tamarind/50">{t.delivery}</p>
        <p className="mb-4 mt-2 text-sm text-tamarind/70">{t.deliveryText}</p>
        <OrderButtons lang={lang} testPrefix={`${testPrefix}-order`} />
      </div>
    </div>
  );
};

export const MapFrame = ({ className = "" }) => (
  <div className={`map-frame overflow-hidden rounded-[2rem] border border-tamarind/15 bg-sand ${className}`} data-testid="google-map">
    <iframe title="Sapa Food – mapa" src={SITE.mapEmbed} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
  </div>
);

export const Visit = ({ lang }) => (
  <section className="bg-sand/70 py-24 sm:py-32" data-testid="home-visit">
    <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 md:grid-cols-12 lg:px-12">
      <Reveal className="md:col-span-5">
        <p className="eyebrow text-lacquer">{T[lang].visitEyebrow}</p>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">{T[lang].visitTitle}</h2>
        <div className="mt-8"><ContactBlock lang={lang} testPrefix="home" /></div>
      </Reveal>
      <Reveal className="md:col-span-7" delay={150}>
        <MapFrame className="h-[380px] md:h-full md:min-h-[560px]" />
      </Reveal>
    </div>
  </section>
);
