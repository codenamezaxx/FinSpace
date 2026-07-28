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
} from "lucide-react";
import { motion } from "framer-motion";
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
    <main className="relative min-h-screen bg-background">
      {/* ─── Hero ─── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
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
              {/* Title bar */}
              <div className="flex items-center border-b border-border bg-surface px-5 py-3">
                <span className="text-xs font-medium text-text-primary/80">
                  {t("landing.tagline")} · {t("landing.feature_dashboard")}
                </span>
              </div>

              <div className="space-y-4 p-5">
                {/* Row 1: Balance Card + Net Worth Card */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Balance card — brand gradient */}
                  <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-white">
                    <p className="text-xs font-medium text-white/80">{t("landing.mock_balance")}</p>
                    <p className="mt-1.5 text-2xl font-bold">{t("landing.mock_balance_amount")}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold">
                        {t("landing.mock_balance_change")}
                      </span>
                      <span className="text-xs text-white/70">{t("landing.mock_balance_change_label")}</span>
                    </div>
                  </div>

                  {/* Net Worth card — accent gradient */}
                  <div className="rounded-xl bg-gradient-to-br from-accent-secondary to-accent-secondary/80 p-5 text-white">
                    <p className="text-xs font-medium text-white/80">{t("landing.mock_net_worth")}</p>
                    <p className="mt-1.5 text-2xl font-bold">{t("landing.mock_net_worth_amount")}</p>
                    <div className="mt-3 flex items-center gap-2">
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
                <div className="grid grid-cols-5 gap-4">
                  {/* Chart — 3 cols */}
                  <div className="col-span-3 rounded-xl border border-border bg-surface-alt/50 p-4">
                    <p className="mb-3 text-xs font-medium text-text-muted">{t("landing.mock_chart_title")}</p>
                    <div className="flex items-end justify-between gap-1.5">
                      {([
                        { day: "mon", income: 32, expense: 18 },
                        { day: "tue", income: 28, expense: 24 },
                        { day: "wed", income: 36, expense: 14 },
                        { day: "thu", income: 22, expense: 30 },
                        { day: "fri", income: 40, expense: 20 },
                        { day: "sat", income: 18, expense: 34 },
                        { day: "sun", income: 12, expense: 16 },
                      ] as const).map((d) => (
                        <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                          {/* Income bar */}
                          <div
                            className="w-full rounded-t-sm bg-primary/60"
                            style={{ height: `${d.income}px` }}
                          />
                          {/* Expense bar */}
                          <div
                            className="w-full rounded-t-sm bg-accent-secondary/60"
                            style={{ height: `${d.expense}px` }}
                          />
                          <span className="text-[10px] text-text-muted">{t(`landing.mock_chart_${d.day}`)}</span>
                        </div>
                      ))}
                    </div>
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
                      <div className="rounded-lg border border-border bg-surface p-3">
                        <Lightbulb className="mb-1 h-4 w-4 text-accent-secondary" />
                        <p className="text-xs leading-relaxed text-text-secondary">{t("landing.mock_insight_1")}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-surface p-3">
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

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-border bg-surface-alt/50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <Image src="/icons/icon-192x192.svg" alt="FinSpace" width={28} height={28} className="h-7 w-7" />
                <span className="text-base font-bold text-text-primary">FinSpace</span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{t("landing.footer_tagline")}</p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-text-primary">{t("landing.footer_features")}</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#features" className="transition-colors hover:text-text-primary">{t("landing.footer_features")}</a></li>
                <li><a href="#benefits" className="transition-colors hover:text-text-primary">{t("landing.footer_benefits")}</a></li>
                <li><a href="#faq" className="transition-colors hover:text-text-primary">{t("landing.footer_faq")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-text-primary">{t("landing.footer_contact")}</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="mailto:zakky.ahmad@protonmail.com" className="transition-colors hover:text-text-primary">zakky.ahmad@protonmail.com</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-text-muted">
            {t("landing.footer_copyright")}
          </div>
        </div>
      </footer>
    </main>
  );
}
