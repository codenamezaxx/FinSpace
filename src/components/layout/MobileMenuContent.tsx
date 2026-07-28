"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Wallet, TrendingUp, Wrench, Settings, Info, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { AboutFeedbackModal } from "@/components/shared/AboutFeedbackModal";

interface MobileMenuContentProps {
  isOpen?: boolean;
  onClose: () => void;
}

export function MobileMenuContent({ isOpen = false, onClose }: MobileMenuContentProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [aboutOpen, setAboutOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/budget", label: t("nav.budget"), icon: Wallet },
    { href: "/wealth", label: t("nav.wealth"), icon: TrendingUp },
    { href: "/tools", label: t("nav.tools"), icon: Wrench },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 h-16">
        <span className="text-base font-bold text-primary">FinSpace</span>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface transition-all duration-200"
          aria-label={t("common.close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item, i) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                } ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-surface hover:text-text-secondary"
                }`}
                style={{ transitionDelay: isOpen ? `${150 + i * 60}ms` : "0ms" }}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="my-4 border-t border-border" />

        <Link
          href="/settings"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          } ${
            pathname.startsWith("/settings")
              ? "bg-primary/10 text-primary"
              : "text-text-muted hover:bg-surface hover:text-text-secondary"
          }`}
          style={{ transitionDelay: isOpen ? `${150 + navItems.length * 60}ms` : "0ms" }}
        >
          <Settings className="h-5 w-5" />
          {t("nav.settings")}
        </Link>

        <button
          onClick={() => setAboutOpen(true)}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          } text-text-muted hover:bg-surface hover:text-text-secondary`}
          style={{ transitionDelay: isOpen ? `${150 + (navItems.length + 1) * 60}ms` : "0ms" }}
        >
          <Info className="h-5 w-5" />
          {t("about.title")}
        </button>
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher compact />
        </div>
        <p className="mt-3 text-xs text-text-muted">
          {t("landing.footer_tagline")}
        </p>
      </div>

      <AboutFeedbackModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
