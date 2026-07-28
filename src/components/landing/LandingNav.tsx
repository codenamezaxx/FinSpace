"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Sun, Moon, Languages } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/i18n";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { label: t("landing.nav_features"), href: "#features" },
    { label: t("landing.nav_works"), href: "#how-it-works" },
    { label: t("landing.nav_benefits"), href: "#benefits" },
    { label: t("landing.nav_faq"), href: "#faq" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass md:backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex flex-row h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/icons/icon-192x192.svg"
            alt="FinSpace"
            width={32}
            height={32}
          />
          <span className="text-lg font-bold text-text-primary">FinSpace</span>
        </Link>

        {/* Center: Desktop Nav Links */}
        <div className="hidden items-center gap-8 ml-28 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-text-secondary transition-colors after:absolute after:-bottom-1 after:left-1/2 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:text-text-primary hover:after:left-0 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Lang toggle + Theme toggle + CTA */}
        <div className="hidden items-center gap-1 md:flex">
          <button
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
            aria-label="Ganti bahasa"
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
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
          >
            {t("landing.hero_cta_start")}
          </Link>
        </div>

        {/* Mobile: hamburger + theme toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-alt"
            aria-label={t("profile.toggle_theme")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-text-primary"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Panel (slide-in from right) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col shadow-xl bg-surface">
            <div className="flex items-center justify-between px-6 pb-4 pt-5">
              <span className="text-lg font-bold text-text-primary">
                FinSpace
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-text-muted hover:text-text-primary"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-col gap-1 px-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
            {/* Mobile: Language toggle */}
            <div className="border-t border-border px-4 py-3">
              <button
                onClick={() => setLang(lang === "id" ? "en" : "id")}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
              >
                <Languages size={18} />
                <span className="uppercase tracking-wider">{lang === "id" ? "Indonesia" : "English"}</span>
              </button>
            </div>
            <div className="border-t border-border px-4 py-6">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover"
              >
                {t("landing.hero_cta_start")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
