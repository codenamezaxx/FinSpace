"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
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
  CloudOff,
  LockKeyhole,
  CircleDollarSign,
  Smartphone,
  MonitorDown,
  Download,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { LandingSkeleton } from "@/components/landing/LandingSkeleton";
import { LandingDashboardPreview } from "@/components/landing/LandingDashboardPreview";
import { useLanguage } from "@/lib/i18n";
import { useCloudAuth } from "@/hooks/useCloudAuth";
import { APP_VERSION } from "@/lib/version";
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

  const trustPoints = [
    { icon: CloudOff, key: "trust_offline" },
    { icon: LockKeyhole, key: "trust_private" },
    { icon: CircleDollarSign, key: "trust_free" },
  ] as const;

  return (
    <LandingSkeleton isLoading={authLoading}>
      <main className="relative min-h-screen bg-background">
      {/* ─── Hero ─── */}
      <section className="relative z-10 px-5 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-28 lg:px-10 lg:pb-24 lg:pt-28">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14"
        >
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div variants={heroItem} className="mb-6 inline-flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                {t("landing.tagline")}
              </span>
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="max-w-[15ch] text-4xl font-bold leading-[1.08] tracking-tight text-text-primary sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              {t("landing.title")}
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="mt-6 max-w-lg text-base leading-7 text-text-secondary sm:text-lg sm:leading-8"
            >
              {t("landing.subtitle")}
            </motion.p>

            <motion.div variants={heroItem} className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row lg:items-start">
              <Link
                href="/dashboard"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-on-primary shadow-card transition-colors duration-200 hover:bg-primary-hover sm:w-auto"
              >
                {t("landing.hero_cta_start")}
                <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-7 text-sm font-semibold text-text-secondary transition-colors duration-200 hover:border-text-muted hover:text-text-primary sm:w-auto"
              >
                {t("landing.hero_cta_learn")}
              </a>
            </motion.div>

            <motion.div
              variants={heroItem}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 lg:justify-start"
            >
              {trustPoints.map(({ icon: Icon, key }) => (
                <div key={key} className="inline-flex items-center gap-2 text-xs font-medium text-text-muted">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t(`landing.${key}`)}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={heroItem} className="w-full min-w-0 lg:pl-2">
            <LandingDashboardPreview />
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
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {t("landing.features_eyebrow")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              {t("landing.features_title")}
            </h2>
            <p className="mt-3 max-w-xl leading-7 text-text-muted">
              {t("landing.features_subtitle")}
            </p>
          </div>

          <motion.div
            variants={staggerCards}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((f, i) => (
              <motion.div key={f.key} variants={fadeUp}>
                <Link
                  href={`/${f.key === "dashboard" ? "dashboard" : f.key}`}
                  className="group flex h-full flex-col border-t border-border py-6 transition-colors duration-200 hover:border-primary"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-text-muted">
                      0{i + 1}
                    </span>
                    <f.icon className="h-5 w-5 text-primary transition-transform duration-200 group-hover:-translate-y-0.5" />
                  </div>
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
        className="relative z-10 border-t border-border bg-surface px-6 py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {t("landing.hiw_eyebrow")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
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
                <div className="group h-full border-t border-border py-6 transition-colors duration-200 hover:border-primary sm:py-7">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">0{i + 1}</span>
                    <step.icon className="h-5 w-5 text-text-muted transition-colors group-hover:text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">
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
        className="relative z-10 border-t border-border bg-surface px-6 py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {t("landing.benefits_eyebrow")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
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
              <div className="rounded-2xl border border-border bg-surface-alt/60 p-8 transition-colors duration-200 hover:border-primary/40 sm:flex sm:items-center sm:gap-8">
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
                  <div className="group rounded-2xl border border-border bg-surface-alt/60 p-7 transition-colors duration-200 hover:border-primary/40">
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

      {/* ─── Downloads & source ─── */}
      <motion.section
        id="downloads"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative z-10 border-t border-border bg-surface px-6 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {t("landing.downloads_eyebrow")}
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                {t("landing.downloads_title")}
              </h2>
              <p className="mt-3 leading-7 text-text-muted">
                {t("landing.downloads_subtitle")}
              </p>
            </div>
            <a
              href="https://github.com/codenamezaxx/FinSpace"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              {t("landing.github_repository")}
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface-alt/60 p-6 sm:p-7">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                {t("landing.android_download_title")}
              </h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-text-muted">
                {t("landing.android_download_desc")}
              </p>
              <a
                href="https://github.com/codenamezaxx/FinSpace/releases/download/v1.0.0/FinSpace-1.0.0.apk"
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
              >
                <Download className="h-4 w-4" />
                {t("landing.android_download_button")}
              </a>
              <p className="mt-3 text-xs leading-5 text-text-muted">
                {t("landing.android_download_note")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-alt/60 p-6 sm:p-7">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MonitorDown className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                {t("landing.desktop_download_title")}
              </h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-text-muted">
                {t("landing.desktop_download_desc")}
              </p>
              <a
                href="https://github.com/codenamezaxx/FinSpace/releases/download/v1.0.0/FinSpace_0.1.0_x64-setup.exe"
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
              >
                <Download className="h-4 w-4" />
                {t("landing.desktop_download_button")}
              </a>
              <p className="mt-3 text-xs leading-5 text-text-muted">
                {t("landing.desktop_download_note")}
              </p>
            </div>
          </div>
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
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-primary px-6 py-12 text-center sm:px-12 sm:py-16">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-on-primary/70">
              {t("landing.cta_eyebrow")}
            </p>
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-on-primary sm:text-4xl">
              {t("landing.cta_title")}
            </h2>
            <p className="mx-auto mt-4 max-w-md leading-7 text-on-primary/80">
              {t("landing.cta_subtitle")}
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-surface px-8 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-surface-alt"
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
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-4 py-2 text-xs font-medium text-text-muted transition-all duration-200 hover:border-text-muted/30 hover:bg-surface-alt hover:text-text-secondary"
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
            <div className="absolute inset-x-0 top-0 h-px bg-border" />
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="text-xs text-text-muted">{t("landing.footer_copyright")}</p>
              <span className="inline-flex items-center rounded-full border border-border bg-surface-alt/80 px-2.5 py-0.5 text-[10px] font-medium text-text-muted">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
    </LandingSkeleton>
  );
}
