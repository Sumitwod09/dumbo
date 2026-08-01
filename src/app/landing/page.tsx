"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Sparkles,
  Download,
  Music,
  Palette,
  Clock,
  Lock,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ArrowDown,
} from "lucide-react";

/* ─────────────────────── Shared Animation Variants ─────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ─────────────────────── Floating Hearts Background ────────────────────── */

function FloatingHearts() {
  const hearts = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: `${12 + i * 16}%`,
    delay: i * 1.5,
    duration: 8 + i * 2,
    size: 10 + (i % 3) * 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute text-rose-300/20"
          style={{ left: h.left, bottom: "-20px" }}
          animate={{
            y: [0, -800],
            rotate: [0, 15, -10, 20],
            opacity: [0, 0.6, 0.4, 0],
          }}
          transition={{
            duration: h.duration,
            repeat: Infinity,
            delay: h.delay,
            ease: "easeOut",
          }}
        >
          <Heart className="fill-current" style={{ width: h.size, height: h.size }} />
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────── Pulsing Glow Ring (Hero) ──────────────────────── */

function GlowRing() {
  return (
    <div className="relative flex items-center justify-center mb-6">
      <motion.div
        className="absolute w-24 h-24 rounded-full bg-rose-400/20 blur-xl"
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.15, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-16 h-16 rounded-full bg-amber-300/20 blur-lg"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
        className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-500/25"
      >
        <Heart className="w-7 h-7 text-white fill-white" />
      </motion.div>
    </div>
  );
}

/* ─────────────────────── Feature Card ──────────────────────────────────── */

interface FeatureCardProps {
  icon: React.ReactNode;
  heading: string;
  description: string;
  index: number;
  accentFrom: string;
  accentTo: string;
  iconBg: string;
}

function FeatureCard({
  icon,
  heading,
  description,
  index,
  accentFrom,
  accentTo,
  iconBg,
}: FeatureCardProps) {
  return (
    <motion.div
      custom={index}
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="group relative bg-white/70 backdrop-blur-sm border border-rose-100/60 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-rose-200/80 transition-all duration-300"
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${accentFrom} ${accentTo} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        <div
          className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3 shadow-sm`}
        >
          {icon}
        </div>
        <h3 className="text-sm font-bold text-zinc-800 mb-1">{heading}</h3>
        <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Install Step Accordion ───────────────────────── */

interface StepItem {
  number: string;
  title: string;
  detail: string;
}

function InstallAccordion({ steps }: { steps: StepItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const isOpen = openIndex === i;
        return (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-20px" }}
          >
            <button
              id={`install-step-${i + 1}`}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-300 ${
                isOpen
                  ? "bg-rose-50/80 border-rose-200 shadow-sm"
                  : "bg-white/60 border-rose-100/40 hover:bg-rose-50/40 hover:border-rose-200/60"
              }`}
              aria-expanded={isOpen}
              aria-controls={`step-detail-${i + 1}`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors duration-300 ${
                  isOpen
                    ? "bg-rose-500 text-white"
                    : "bg-rose-100 text-rose-500"
                }`}
              >
                {step.number}
              </span>
              <span className="flex-1 text-sm font-semibold text-zinc-700">
                {step.title}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  id={`step-detail-${i + 1}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-3 pt-1 text-xs text-zinc-500 leading-relaxed pl-14">
                    {step.detail}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────── Main Landing Page ─────────────────────────────── */

const features = [
  {
    icon: <Music className="w-5 h-5 text-rose-600" />,
    heading: "Our Shared Frequency",
    description:
      "Streaming favorite tracks directly in the background.",
    accentFrom: "from-rose-50/40",
    accentTo: "to-amber-50/30",
    iconBg: "bg-rose-100 text-rose-600",
  },
  {
    icon: <Palette className="w-5 h-5 text-amber-600" />,
    heading: "Real-Time Doodling",
    description:
      "Draw together on a shared canvas in real time.",
    accentFrom: "from-amber-50/40",
    accentTo: "to-rose-50/30",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    icon: <Clock className="w-5 h-5 text-violet-600" />,
    heading: "Focus & Water Reminders",
    description:
      "Joint Pomodoro timers and gentle hourly hydration alerts.",
    accentFrom: "from-violet-50/40",
    accentTo: "to-rose-50/30",
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    icon: <Lock className="w-5 h-5 text-emerald-600" />,
    heading: "Encrypted Couple Hub",
    description:
      "Private chat and video calling restricted strictly to the two of us.",
    accentFrom: "from-emerald-50/40",
    accentTo: "to-rose-50/30",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
];

const installSteps: StepItem[] = [
  {
    number: "1",
    title: "Click \"Download Dumbo\"",
    detail:
      "Tap the download button above or below. Your browser will begin downloading the Dumbo.apk file to your device.",
  },
  {
    number: "2",
    title: "Open the downloaded Dumbo.apk file",
    detail:
      "Once the download completes, tap the notification or find the file in your Downloads folder and open it.",
  },
  {
    number: "3",
    title: "Enable \"Allow from this source\"",
    detail:
      "If Android prompts you about unknown sources, go to Settings and enable \"Allow from this source\" for your browser, then return to the installer.",
  },
  {
    number: "4",
    title: "Tap Install and launch our private space",
    detail:
      "Once installed, tap \"Open\" to launch Dumbo and step into our own little digital world.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-rose-50 via-white to-amber-50/30 overflow-hidden">
      {/* Floating Hearts */}
      <FloatingHearts />

      {/* Ambient gradient blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 left-0 w-60 h-60 bg-amber-200/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-52 h-52 bg-violet-200/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto px-5 py-10 space-y-12">
        {/* ─────────── HERO SECTION ─────────── */}
        <section id="hero" className="text-center pt-6">
          <GlowRing />

          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight tracking-tight"
          >
            A Little Universe Built
            <br />
            <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Just for You, Gaurai
            </span>
          </motion.h1>

          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto"
          >
            A private space that holds everything created just for the two of
            us — shared music, live doodles, focus sessions, and our own
            little messenger.
          </motion.p>

          {/* Primary CTA */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8"
          >
            <a
              id="cta-download-hero"
              href="/Dumbo.apk"
              download
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-sm rounded-full shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Download className="w-4.5 h-4.5 group-hover:animate-bounce" />
              <span>Download Dumbo for Android</span>
            </a>
          </motion.div>

          {/* Version Badge */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-5"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/70 backdrop-blur-sm border border-rose-200/50 rounded-full text-xs font-medium text-zinc-500 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              Private 2-User Workspace &middot; Version 1.0
            </span>
          </motion.div>

          {/* Scroll Nudge */}
          <motion.div
            className="mt-10"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="w-4 h-4 text-rose-300 mx-auto" />
          </motion.div>
        </section>

        {/* ─────────── WHY DUMBO? SECTION ─────────── */}
        <motion.section
          id="why-dumbo"
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="relative bg-rose-50/60 backdrop-blur-sm border border-rose-200/60 rounded-2xl p-6 shadow-sm overflow-hidden">
            {/* Decorative sparkle */}
            <div className="absolute top-3 right-3">
              <Sparkles className="w-5 h-5 text-amber-400/40" />
            </div>
            <div className="absolute bottom-2 left-4">
              <Heart className="w-4 h-4 text-rose-300/30 fill-rose-300/30" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-rose-500" />
              </div>
              <h2 className="text-base font-bold text-zinc-800">Why Dumbo?</h2>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">
              Named in honor of your wonderfully goofy brain. You might be a
              dummy, but you{"\u2019"}re <em className="font-semibold text-rose-500 not-italic">my dummy</em>
              {"\u2014"}and this app was built just to keep up with you.
            </p>
          </div>
        </motion.section>

        {/* ─────────── FEATURE HIGHLIGHTS ─────────── */}
        <section id="features" className="space-y-4">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/60 border border-amber-200/40 rounded-full text-xs font-semibold text-amber-700 mb-3">
              <Sparkles className="w-3 h-3" />
              What awaits inside
            </span>
            <h2 className="text-lg font-bold text-zinc-800">
              Everything We Need, One Tap Away
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <FeatureCard key={f.heading} index={i} {...f} />
            ))}
          </div>
        </section>

        {/* ─────────── INSTALLATION GUIDE ─────────── */}
        <section id="install-guide" className="space-y-4">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100/60 border border-rose-200/40 rounded-full text-xs font-semibold text-rose-600 mb-3">
              <Download className="w-3 h-3" />
              Installation Guide
            </span>
            <h2 className="text-lg font-bold text-zinc-800">
              Setting Up Dumbo on Your Phone
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Four quick steps and we are connected.
            </p>
          </motion.div>

          <InstallAccordion steps={installSteps} />
        </section>

        {/* ─────────── BOTTOM CTA ─────────── */}
        <motion.section
          id="bottom-cta"
          custom={0}
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="relative bg-gradient-to-br from-rose-500 via-rose-500 to-amber-400 rounded-2xl p-7 text-white shadow-lg overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-300/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <Heart className="w-8 h-8 mx-auto mb-3 text-white/90 fill-white/20" />
              <h2 className="text-base font-bold mb-2">
                Ready to step inside, Gaurai?
              </h2>
              <p className="text-xs text-rose-100 mb-5 max-w-[220px] mx-auto leading-relaxed">
                Our own little world is one download away.
              </p>
              <a
                id="cta-download-bottom"
                href="/Dumbo.apk"
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-600 font-bold text-sm rounded-full shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                <span>Download Dumbo</span>
              </a>
            </div>
          </div>
        </motion.section>

        {/* ─────────── FOOTER ─────────── */}
        <footer id="footer" className="text-center pb-8 pt-2">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-1.5 text-xs text-zinc-400"
          >
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            <span>for Gaurai.</span>
          </motion.div>
        </footer>
      </div>
    </div>
  );
}
