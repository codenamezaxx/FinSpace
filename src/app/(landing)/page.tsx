"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Lightbulb,
  Wallet,
  TrendingUp,
  Wrench,
  WifiOff,
  Brain,
  Heart,
  ArrowRight,
  Receipt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { LandingSkeleton } from "@/components/landing/LandingSkeleton";
import { useLanguage } from "@/lib/i18n";
import { useCloudAuth } from "@/hooks/useCloudAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Animation Variants ───
const heroContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.15 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 22, stiffness: 250 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 20, stiffness: 200 },
  },
};

const staggerCards = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function LandingPage() {
  const { t } = useLanguage();
  const { isLoggedIn, isLoading: authLoading } = useCloudAuth();
  const router = useRouter();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const shouldRedirect = isLoggedIn || isStandalone;

  useEffect(() => {
    if (!authLoading && shouldRedirect) {
      router.replace("/dashboard");
    }
  }, [authLoading, shouldRedirect, router]);

  const features = [
    { icon: LayoutDashboard, key: "dashboard" },
    { icon: Wallet, key: "budget" },
    { icon: TrendingUp, key: "wealth" },
    { icon: Wrench, key: "tools" },
  ] as const;

  const benefits = [
    { icon: WifiOff, titleKey: "benefits_offline_title", descKey: "benefits_offline_desc" },
    { icon: Brain, titleKey: "benefits_ai_title", descKey: "benefits_ai_desc" },
    { icon: Heart, titleKey: "benefits_free_title", descKey: "benefits_free_desc" },
  ] as const;

  const howItWorks = [
    { icon: Receipt, key: "step1" },
    { icon: Wallet, key: "step2" },
    { icon: TrendingUp, key: "step3" },
  ] as const;

  return (
    <LandingSkeleton isLoading={authLoading}>
      <main className="relative min-h-screen bg-background">
      {/* ─── Hero ─── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div variants={heroItem} className="mb-8">
            <Image src="/icons/icon-192x192.svg" alt="FinSpace" width={56} height={56} className="h-20 w-20" />
          </motion.div>

          <motion.h1
            variants={heroItem}
            className="text-5xl font-bold tracking-tight text-text-primary sm:text-6xl lg:text-7xl"
          >
            {t("landing.title")}
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mx-auto mt-6 max-w-xl text-lg text-text-muted sm:text-xl"
          >
            {t("landing.subtitle")}
          </motion.p>

          <motion.div variants={heroItem} className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30"
            >
              {t("landing.hero_cta_start")}
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center rounded-xl border border-border bg-surface/50 px-8 text-sm font-semibold text-text-secondary backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-text-muted hover:bg-surface hover:text-text-primary"
            >
              {t("landing.hero_cta_learn")}
            </a>
          </motion.div>

          {/* Mini Dashboard Preview */}
          <motion.div variants={heroItem} className="mt-16 w-full max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-alt shadow-lg">
              {/* macOS-style Title bar */}
              <div className="relative flex items-center border-b border-border bg-surface px-5 py-3">
                {/* Traffic light dots */}
                <div className="flex items-center gap-[6px]">
                  <span className="h-[10px] w-[10px] rounded-full bg-[#EF4444]" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#EAB393]" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#22C55E]" />
                </div>
                {/* Centered title */}
                <span className="absolute inset-y-0 left-0 flex w-full items-center justify-center text-xs font-medium text-text-primary/80 pointer-events-none">
                  {t("landing.tagline")} · {t("landing.feature_dashboard")}
                </span>
              </div>

              <div className="space-y-4 p-5">
                {/* Row 1: Balance Card + Net Worth Card */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Balance card — brand gradient */}
                  <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-white w-full">
                    <p className="text-xs font-medium text-white/80">{t("landing.mock_balance")}</p>
                    <p className="mt-1.5 text-2xl font-bold">{t("landing.mock_balance_amount")}</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold">
                        {t("landing.mock_balance_change")}
                      </span>
                      <span className="text-xs text-white/70">{t("landing.mock_balance_change_label")}</span>
                    </div>
                  </div>

                  {/* Net Worth card — accent gradient */}
                  <div className="rounded-xl bg-gradient-to-br from-accent-secondary to-accent-secondary/80 p-5 text-white w-full">
                    <p className="text-xs font-medium text-white/80">{t("landing.mock_net_worth")}</p>
                    <p className="mt-1.5 text-2xl font-bold">{t("landing.mock_net_worth_amount")}</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold">
                        {t("landing.mock_net_worth_change")}
                      </span>
                      <span className="text-xs text-white/70">{t("landing.mock_balance_change_label")}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Quick Actions */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-muted">{t("landing.mock_quick_actions")}</span>
                  {(["transfer", "pay", "top_up"] as const).map((action) => (
                    <span
                      key={action}
                      className="rounded-lg border border-border bg-surface-alt/70 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-text-muted/30 hover:text-text-primary"
                    >
                      {t(`landing.mock_${action}`)}
                    </span>
                  ))}
                </div>

                {/* Row 3: Mini Chart + Insights */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Chart — 3 cols */}
                  <div className="col-span-3 w-full rounded-xl border border-border bg-surface-alt/50 p-4">
                    <p className="mb-3 text-xs font-medium text-text-muted">{t("landing.mock_chart_title")}</p>
                    <svg
                      viewBox="0 0 290 100"
                      className="w-full"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#723EC3" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#723EC3" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Area fills (render first so lines draw on top) */}
                      <path
                        d="M 10,22 C 25,24 40,30 55,29 C 70,28 85,15 100,16 C 115,18 130,39 145,38 C 160,37 175,11 190,10 C 205,11 220,43 235,44 C 250,51 265,50 280,53 L 280,82 L 10,82 Z"
                        fill="url(#incomeArea)"
                      />
                      <path
                        d="M 10,44 C 25,41 40,34 55,35 C 70,36 85,52 100,50 C 115,49 130,28 145,26 C 160,25 175,42 190,41 C 205,40 220,20 235,19 C 250,28 265,38 280,47 L 280,82 L 10,82 Z"
                        fill="url(#expenseArea)"
                      />

                      {/* Income line */}
                      <path
                        d="M 10,22 C 25,24 40,30 55,29 C 70,28 85,15 100,16 C 115,18 130,39 145,38 C 160,37 175,11 190,10 C 205,11 220,43 235,44 C 250,51 265,50 280,53"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Expense line */}
                      <path
                        d="M 10,44 C 25,41 40,34 55,35 C 70,36 85,52 100,50 C 115,49 130,28 145,26 C 160,25 175,42 190,41 C 205,40 220,20 235,19 C 250,28 265,38 280,47"
                        fill="none"
                        stroke="#723EC3"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* X-axis labels */}
                      {[
                        { x: 10, day: "mon" },
                        { x: 55, day: "tue" },
                        { x: 100, day: "wed" },
                        { x: 145, day: "thu" },
                        { x: 190, day: "fri" },
                        { x: 235, day: "sat" },
                        { x: 280, day: "sun" },
                      ].map((l) => (
                        <text key={l.day} x={l.x} y="96" textAnchor="middle" className="fill-text-muted" fontSize="9">
                          {t(`landing.mock_chart_${l.day}`)}
                        </text>
                      ))}
                    </svg>
                    {/* Legend */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
                        <span className="text-[11px] text-text-muted">{t("landing.mock_chart_income")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-sm bg-accent-secondary/60" />
                        <span className="text-[11px] text-text-muted">{t("landing.mock_chart_expense")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Insights — 2 cols */}
                  <div className="col-span-2 rounded-xl border border-border bg-surface-alt/50 p-4">
                    <p className="mb-3 text-xs font-medium text-text-muted">{t("landing.mock_insight_title")}</p>
                    <div className="space-y-3">
                      <div className="flex rounded-lg border border-border justify-center bg-surface p-3">
                        <Lightbulb className="mb-1 h-4 w-4 text-accent-secondary" />
                        <p className="text-xs leading-relaxed text-text-secondary">{t("landing.mock_insight_1")}</p>
                      </div>
                      <div className="flex rounded-lg border border-border justify-center bg-surface p-3">
                        <Lightbulb className="mb-1 h-4 w-4 text-primary" />
                        <p className="text-xs leading-relaxed text-text-secondary">{t("landing.mock_insight_2")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features Section ─── */}
      <motion.section
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative z-10 px-6 pb-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              {t("landing.features_title")}
            </h2>
            <p className="mt-2 text-text-muted">
              {t("landing.subtitle")}
            </p>
          </div>

          <motion.div
            variants={staggerCards}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((f, i) => (
              <motion.div key={f.key} variants={fadeUp}>
                <Link
                  href={`/${f.key === "dashboard" ? "dashboard" : f.key}`}
                  className={`group block rounded-2xl border p-7 transition-all duration-200 hover:-translate-y-0.5 ${
                    i % 2 === 0
                      ? "border-border bg-surface hover:shadow-md hover:border-text-muted/30"
                      : "border-transparent bg-surface-alt/70 hover:border-border hover:bg-surface"
                  }`}
                >
                  <f.icon className={`mb-4 h-7 w-7 transition-transform duration-200 group-hover:scale-110 ${
                    i % 2 === 0 ? "text-primary" : "text-accent-secondary"
                  }`} />
                  <h3 className="text-base font-semibold text-text-primary">
                    {t(`landing.feature_${f.key}`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {t(`landing.desc_${f.key}`)}
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── How It Works ─── */}
      <motion.section
        id="how-it-works"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative z-10 border-t border-border bg-surface/50 px-6 py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-14">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              {t("landing.hiw_title")}
            </h2>
            <p className="mt-2 text-text-muted">
              {t("landing.hiw_subtitle")}
            </p>
          </div>

          <motion.div
            variants={staggerCards}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            {howItWorks.map((step, i) => (
              <motion.div key={step.key} variants={fadeUp}>
                <div className="group rounded-2xl border border-border bg-surface p-8 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-200 group-hover:bg-primary/20">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-text-primary">
                    {t(`landing.hiw_${step.key}_title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {t(`landing.hiw_${step.key}_desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Benefits Section ─── */}
      <motion.section
        id="benefits"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative z-10 border-t border-border bg-surface/50 px-6 py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-14">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              {t("landing.benefits_title")}
            </h2>
            <p className="mt-2 text-text-muted">
              {t("landing.benefits_subtitle")}
            </p>
          </div>

          <motion.div
            variants={staggerCards}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            {/* Hero benefit — full width, featured */}
            <motion.div variants={fadeUp}>
              <div className="rounded-2xl border border-border bg-surface p-8 transition-all duration-200 hover:shadow-md sm:flex sm:items-center sm:gap-8">
                <div className="mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:mb-0">
                  <WifiOff className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">
                    {t("landing.benefits_offline_title")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {t("landing.benefits_offline_desc")}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Two smaller benefits side by side */}
            <motion.div
              variants={staggerCards}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2"
            >
              {[benefits[1], benefits[2]].map((b) => (
                <motion.div key={b.titleKey} variants={fadeUp}>
                  <div className="group rounded-2xl border border-border bg-surface p-7 transition-all duration-200 hover:shadow-md hover:border-text-muted/30">
                    <b.icon className="mb-4 h-7 w-7 text-primary" />
                    <h3 className="text-base font-semibold text-text-primary">
                      {t(`landing.${b.titleKey}`)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      {t(`landing.${b.descKey}`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── FAQ ─── */}
      <motion.section
        id="faq"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative z-10 px-6 py-24"
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-14">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              {t("landing.faq_title")}
            </h2>
            <p className="mt-2 text-text-muted">
              {t("landing.faq_subtitle")}
            </p>
          </div>

          <motion.div
            variants={staggerCards}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {([1, 2, 3, 4, 5] as const).map((num) => (
              <motion.details
                key={num}
                variants={fadeUp}
                className="group rounded-xl border border-border bg-surface transition-all duration-200 open:shadow-md open:border-primary/30"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-text-primary transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  {t(`landing.faq_q${num}`)}
                  <span className="ml-4 shrink-0 text-text-muted transition-transform duration-200 group-open:rotate-180">
                    <ChevronDown size={18} />
                  </span>
                </summary>
                <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-text-muted">
                  {t(`landing.faq_a${num}`)}
                </div>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── CTA Section ─── */}
      <motion.section
        id="cta"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeUp}
        className="relative z-10 px-6 py-24"
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-3xl border border-border bg-surface px-8 py-16 sm:px-16">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              {t("landing.cta_title")}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-text-muted">
              {t("landing.cta_subtitle")}
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30"
            >
              {t("landing.hero_cta_start")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ─── Back to Top ─── */}
      <div className="relative z-10 flex justify-center pb-4">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group inline-flex items-center gap-1.5 rounded-full border border-border  bg-surface-alt px-4 py-2 text-xs font-medium text-text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-text-muted/30 hover:bg-surface-alt hover:text-text-secondary"
        >
          <ChevronUp size={14} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
          {t("landing.button_back_to_top")}
        </button>
      </div>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-border bg-surface-alt/50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:justify-between gap-8 md:grid-cols-4">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <Image src="/icons/icon-192x192.svg" alt="FinSpace" width={28} height={28} className="h-7 w-7" />
                <span className="text-base font-bold text-text-primary">FinSpace</span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{t("landing.footer_tagline")}</p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://github.com/codenamezaxx/Finspace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-text-primary"
                  aria-label="GitHub"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
              </div>
              <p className="mt-3 text-[11px] text-text-muted/60">Next.js · Dexie · Tailwind</p>
            </div>

            {/* Divider */}
            <div className="hidden md:block" />

            {/* Features column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-text-primary">{t("landing.footer_features")}</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#features" className="transition-colors hover:text-text-primary">{t("landing.footer_features")}</a></li>
                <li><a href="#how-it-works" className="transition-colors hover:text-text-primary">{t("landing.footer_hiw")}</a></li>
                <li><a href="#benefits" className="transition-colors hover:text-text-primary">{t("landing.footer_benefits")}</a></li>
                <li><a href="#faq" className="transition-colors hover:text-text-primary">{t("landing.footer_faq")}</a></li>
              </ul>
            </div>

            {/* Contact column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-text-primary">{t("landing.footer_contact")}</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="mailto:zakky.ahmad@protonmail.com" className="transition-colors hover:text-text-primary">zakky.ahmad@protonmail.com</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="relative mt-10 border-t border-primary/10 pt-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="text-xs text-text-muted">{t("landing.footer_copyright")}</p>
              <span className="inline-flex items-center rounded-full border border-border bg-surface-alt/80 px-2.5 py-0.5 text-[10px] font-medium text-text-muted">
                v1.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
    </LandingSkeleton>
  );
}
