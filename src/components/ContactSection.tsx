import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import Reveal from "./Reveal";
import MagneticButton from "./ui/MagneticButton";
import { useSound } from "../audio/SoundProvider";
import { cn } from "../utils/cn";

/**
 * ContactSection — a premium interaction, not a form.
 * Glass panel, floating animated labels, magnetic submit, and an
 * electric success animation. Social channels with hover physics.
 */

const PHONE = "+989380215823";

function Field({
  id,
  label,
  textarea,
  value,
  onChange,
  dir,
}: {
  id: string;
  label: string;
  textarea?: boolean;
  value: string;
  onChange: (v: string) => void;
  dir?: "ltr" | "rtl";
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  const shared = {
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    required: true,
    className: cn(
      "peer w-full resize-none rounded-xl border bg-white/[0.03] px-4 pb-2.5 pt-6 text-sm text-white",
      "border-white/10 outline-none transition-all duration-300",
      "focus:border-electric/50 focus:bg-white/[0.05] focus:shadow-[0_0_24px_-6px_rgba(79,216,255,0.35)]",
      textarea ? "min-h-32" : "py-6"
    ),
  };

  return (
    <div className="relative" dir={dir}>
      {textarea ? <textarea {...shared} rows={4} /> : <input {...shared} type="text" />}
      <motion.label
        htmlFor={id}
        initial={false}
        animate={{
          y: floated ? "0.3rem" : textarea ? "1.6rem" : "1.15rem",
          scale: floated ? 0.78 : 1,
          color: floated ? "#4fd8ff" : "#64748b",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="pointer-events-none absolute start-4 top-0 origin-[left_center] font-medium rtl:origin-[right_center]"
      >
        {label}
      </motion.label>
    </div>
  );
}

export default function ContactSection({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];
  const { blip } = useSound();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (state !== "idle") return;
    setState("sending");
    // local ceremony — the storm acknowledges you
    window.setTimeout(() => {
      setState("done");
      blip("success");
    }, 900);
  };

  const socials = [
    {
      id: "ig",
      label: t.instagramLabel,
      href: "https://www.instagram.com/picksawm/",
      path: "M3 3h18v18H3V3Zm9 4.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm5.4-.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM12 9.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z",
    },
    {
      id: "wa",
      label: t.whatsappLabel,
      href: `https://wa.me/${PHONE.replace("+", "")}`,
      path: "M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a9.9 9.9 0 0 1-4.9-4.3c-.4-.7-.8-1.6-.8-2.5s.5-1.4.7-1.6c.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.3.4c-.1.2-.3.3-.1.6.2.3.7 1.1 1.4 1.8 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.3.1.1.1.6-.1 1.2Z",
    },
    {
      id: "tel",
      label: t.phoneLabel,
      href: `tel:${PHONE}`,
      path: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
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
          <div className="glass-strong bolt-lit relative overflow-hidden rounded-3xl p-6 sm:p-10">
            {/* ambient glow */}
            <div className="pointer-events-none absolute -top-32 start-1/2 h-64 w-[480px] -translate-x-1/2 rounded-full bg-electric/10 blur-[100px]" />

            <AnimatePresence mode="wait">
              {state === "done" ? (
                /* ── electric success ── */
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative flex flex-col items-center gap-6 py-10 text-center"
                >
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <motion.span
                      className="absolute inset-0 rounded-full border border-electric/60"
                      initial={{ scale: 0.4, opacity: 1 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.span
                      className="absolute inset-0 rounded-full border border-electric/40"
                      initial={{ scale: 0.4, opacity: 1 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4fd8ff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-10 w-10"
                      style={{ filter: "drop-shadow(0 0 12px rgba(79,216,255,0.8))" }}
                    >
                      <motion.path
                        d="M4 12.5l5 5L20 6.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                      />
                    </motion.svg>
                  </div>
                  <p className="max-w-sm text-base font-medium text-slate-200">{t.formSuccess}</p>
                  {/* socials with physics */}
                  <div className="mt-2 flex items-center gap-4">
                    {socials.map((s, i) => (
                      <motion.a
                        key={s.id}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        title={s.label}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 300, damping: 16 }}
                        whileHover={{ y: -5, rotate: i % 2 ? 4 : -4, scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="glass bolt-lit flex h-12 w-12 items-center justify-center rounded-2xl text-slate-300 hover:text-electric"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                          <path d={s.path} />
                        </svg>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* ── the form ── */
                <motion.form
                  key="form"
                  onSubmit={submit}
                  exit={{ opacity: 0, y: -14 }}
                  className="relative flex flex-col gap-4"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="cx-name" label={t.formName} value={name} onChange={setName} />
                    <Field id="cx-contact" label={t.formContact} value={contact} onChange={setContact} dir="ltr" />
                  </div>
                  <Field id="cx-msg" label={t.formMessage} textarea value={message} onChange={setMessage} />

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {socials.map((s) => (
                        <motion.a
                          key={s.id}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          title={s.label}
                          whileHover={{ y: -4, scale: 1.12 }}
                          whileTap={{ scale: 0.88 }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-electric/40 hover:text-electric"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4.5 w-4.5">
                            <path d={s.path} />
                          </svg>
                        </motion.a>
                      ))}
                    </div>

                    <MagneticButton type="submit" variant="primary" className="min-w-36">
                      {state === "sending" ? (
                        <span className="flex items-center gap-2">
                          <motion.span
                            className="h-4 w-4 rounded-full border-2 border-slate-900/30 border-t-slate-900"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                          />
                          {t.formSending}
                        </span>
                      ) : (
                        t.formSubmit
                      )}
                    </MagneticButton>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
