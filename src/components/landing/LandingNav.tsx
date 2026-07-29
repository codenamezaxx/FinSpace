"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sun, Moon, Languages } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/i18n";

interface NavItem {
  labelKey: string;
  href: string;
  isRoute?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "landing.feature_dashboard", href: "/dashboard", isRoute: true },
  { labelKey: "landing.nav_features", href: "#features" },
  { labelKey: "landing.nav_works", href: "#how-it-works" },
  { labelKey: "landing.nav_benefits", href: "#benefits" },
  { labelKey: "landing.hero_cta_start", href: "#cta" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  /* ── Scroll detection for desktop nav ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Lock body scroll when sidebar is open ── */
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* ── Close sidebar on Escape key ── */
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const handleNavClick = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href.startsWith("#")) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
        setMenuOpen(false);
      }
    },
    [],
  );

  return (
    <>
      {/* ═══════════════════════════════════════════
          Desktop Navigation Bar (≥ lg)
         ═══════════════════════════════════════════ */}
      <nav
        className="fixed inset-x-0 top-0 z-40 hidden  lg:block"
      >
        <div className={`mx-auto flex h-16 max-w-300 items-center justify-between rounded-xl px-4 sm:px-6 md:mt-4 transition-all duration-300 ${
          scrolled
            ? "bg-surface-alt/50 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}>
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/icons/icon-192x192.svg"
              alt="FinSpace"
              width={32}
              height={32}
            />
            <span className="text-lg font-bold text-text-primary">
              FinSpace
            </span>
          </Link>

          {/* Center: Nav Links */}
          <div className="ml-20 flex items-center gap-8">
            {[
              { label: t("landing.nav_features"), href: "#features" },
              { label: t("landing.nav_works"), href: "#how-it-works" },
              { label: t("landing.nav_benefits"), href: "#benefits" },
              { label: t("landing.nav_faq"), href: "#faq" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="relative text-sm font-medium text-text-secondary transition-colors after:absolute after:-bottom-1 after:left-1/2 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:text-text-primary hover:after:left-0 hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang(lang === "id" ? "en" : "id")}
              className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
              aria-label="Toggle language"
            >
              <Languages size={16} />
              <span>{lang}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
              aria-label={t("profile.toggle_theme")}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              href="/dashboard"
              className="ml-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
            >
              {t("landing.hero_cta_start")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          Mobile Top Bar (< lg)
         ═══════════════════════════════════════════ */}
      <div
        className={`fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b px-4 transition-all duration-300 lg:hidden ${
          scrolled
            ? "border-border bg-surface-alt/80 backdrop-blur-md"
            : "border-transparent bg-surface-alt/40 backdrop-blur-sm"
        }`}
      >
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/icon-192x192.svg"
            alt="FinSpace"
            width={28}
            height={28}
          />
          <span className="text-base font-bold text-text-primary">
            FinSpace
          </span>
        </Link>

        {/* Right: Theme toggle + Hamburger */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            aria-label={t("profile.toggle_theme")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Animated Hamburger → X */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span className="relative h-5 w-5 mt-2" aria-hidden="true">
              {/* Top bar */}
              <span
                className={`absolute left-0.5 top-0 h-0.5 w-4 rounded-full bg-text-muted transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  menuOpen ? "translate-y-[9px] rotate-45" : ""
                }`}
              />
              {/* Middle bar */}
              <span
                className={`absolute left-0.5 top-[5px] h-0.5 w-4 rounded-full bg-text-muted transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  menuOpen ? "scale-x-0 opacity-0" : ""
                }`}
              />
              {/* Bottom bar */}
              <span
                className={`absolute left-0.5 top-[10px] h-0.5 w-4 rounded-full bg-text-muted transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  menuOpen ? "-translate-y-[9px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Mobile: Backdrop Overlay
         ═══════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ═══════════════════════════════════════════
          Mobile: Slide-in Sidebar
         ═══════════════════════════════════════════ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-col border-l border-border bg-surface-alt shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={handleNavClick}
          >
            <Image
              src="/icons/icon-192x192.svg"
              alt="FinSpace"
              width={28}
              height={28}
            />
            <span className="text-base font-bold text-text-primary">
              FinSpace
            </span>
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            aria-label="Close menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Nav Items with staggered entrance */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item, i) => (
              <div
                key={item.href}
                className={`transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  menuOpen
                    ? "translate-x-0 opacity-100"
                    : "translate-x-8 opacity-0"
                }`}
                style={{
                  transitionDelay: menuOpen ? `${150 + i * 60}ms` : "0ms",
                }}
              >
                {item.isRoute ? (
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                  >
                    {t(item.labelKey)}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => handleAnchorClick(e, item.href)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                  >
                    {t(item.labelKey)}
                  </a>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer: Language toggle */}
        <div className="border-t border-border px-4 py-3">
          <button
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
          >
            <Languages size={18} />
            <span className="uppercase tracking-wider">
              {lang === "id" ? "Indonesia" : "English"}
            </span>
          </button>
        </div>

        {/* Sidebar Footer: CTA */}
        <div className="px-4 pb-5">
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover"
          >
            {t("landing.hero_cta_start")}
          </Link>
        </div>
      </aside>
    </>
  );
}
