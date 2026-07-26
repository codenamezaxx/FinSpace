"use client";

import Link from "next/link";
import { LayoutDashboard, Wallet, TrendingUp, Wrench } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: LayoutDashboard,
      name: t("landing.feature_dashboard"),
      description: t("landing.desc_dashboard"),
      href: "/dashboard",
    },
    {
      icon: Wallet,
      name: t("landing.feature_budget"),
      description: t("landing.desc_budget"),
      href: "/budget",
    },
    {
      icon: TrendingUp,
      name: t("landing.feature_wealth"),
      description: t("landing.desc_wealth"),
      href: "/wealth",
    },
    {
      icon: Wrench,
      name: t("landing.feature_tools"),
      description: t("landing.desc_tools"),
      href: "/tools",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        {/* Subtle radial glow behind logo */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[420px] w-[420px] rounded-full bg-primary/15 blur-[120px]" />
        </div>

        <div className="relative z-10">
          {/* Logo mark */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center">
            <img
              src="/icons/icon-192x192.svg"
              alt="FinSpace Logo"
              className="h-24 w-24"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold tracking-tight text-text-primary sm:text-6xl">
            FinSpace
          </h1>

          {/* Tagline */}
          <p className="mx-auto mt-4 max-w-md text-lg text-text-muted">
            {t("landing.tagline")}
          </p>

          {/* CTA */}
          <Link
            href="/dashboard"
            className="mt-10 inline-flex h-12 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
          >
            {t("landing.get_started")}
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link
              key={feature.name}
              href={feature.href}
              className="group flex flex-col glass rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--card-hover-shadow)]"
            >
              <feature.icon className="mb-4 h-6 w-6 text-primary transition-transform duration-200 group-hover:scale-110" />
              <h3 className="font-medium text-text-primary">{feature.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
