import { motion } from "motion/react";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import Reveal from "./Reveal";
import MagneticButton from "./ui/MagneticButton";

/**
 * ContactSection — direct human contact, zero database.
 * WhatsApp (prefilled message), phone, and Instagram — with the same
 * premium interaction language as the rest of the site.
 */

const PHONE = "+989380215823";
const WHATSAPP_MSG = encodeURIComponent(
  "Hi Picksaw! I'm interested in a website template. "
);

export default function ContactSection({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];

  const channels = [
    {
      id: "whatsapp",
      label: t.whatsappCta,
      href: `https://wa.me/${PHONE.replace("+", "")}?text=${WHATSAPP_MSG}`,
      primary: true,
      path: "M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a9.9 9.9 0 0 1-4.9-4.3c-.4-.7-.8-1.6-.8-2.5s.5-1.4.7-1.6c.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.3.4c-.1.2-.3.3-.1.6.2.3.7 1.1 1.4 1.8 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.3.1.1.1.6-.1 1.2Z",
    },
    {
      id: "phone",
      label: t.callCta,
      href: `tel:${PHONE}`,
      primary: false,
      path: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
    },
    {
      id: "instagram",
      label: t.followCta,
      href: "https://www.instagram.com/picksawm/",
      primary: false,
      path: "M3 3h18v18H3V3Zm9 4.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm5.4-.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM12 9.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z",
    },
  ];

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <Reveal>
            <h2 className="bolt-text text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              {t.contactTitle}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-400 sm:text-lg">
              {t.contactSubtitle}
            </p>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="glass-strong bolt-lit relative overflow-hidden rounded-3xl p-8 sm:p-12">
            {/* ambient glow */}
            <div className="pointer-events-none absolute -top-32 start-1/2 h-64 w-[480px] -translate-x-1/2 rounded-full bg-electric/10 blur-[100px]" />

            <div className="relative flex flex-col items-center gap-8">
              {/* primary — WhatsApp with prefilled message */}
              <MagneticButton
                href={channels[0].href}
                variant="primary"
                strength={0.4}
                className="!px-9 !py-5 text-base"
                ariaLabel={t.whatsappCta}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path d={channels[0].path} />
                </svg>
                {channels[0].label}
              </MagneticButton>

              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                {t.contactNote}
              </p>

              {/* secondary channels with hover physics */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {channels.slice(1).map((c, i) => (
                  <motion.a
                    key={c.id}
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={c.label}
                    whileHover={{ y: -5, rotate: i % 2 ? 3 : -3, scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16 }}
                    className="glass bolt-lit flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-200 hover:text-electric"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4.5 w-4.5" aria-hidden>
                      <path d={c.path} strokeLinejoin="round" />
                    </svg>
                    {c.label}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
