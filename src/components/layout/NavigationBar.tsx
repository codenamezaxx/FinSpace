"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Wrench,
  Sun,
  Moon,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/lib/theme-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/wealth", label: "Wealth", icon: TrendingUp },
  { href: "/tools", label: "Tools", icon: Wrench },
];

export function NavigationBar() {
  const pathname = usePathname();
  const { toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-surface/60 backdrop-blur-xl px-2 py-2 lg:hidden">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-primary" : ""
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {/* Theme toggle compact — both icons in DOM, CSS shows correct one */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-text-muted transition-colors hover:text-text-secondary"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 light-only" />
          <Moon className="h-5 w-5 dark-only" />
        </button>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface-alt" style={{ boxShadow: "var(--sidebar-shadow)" }}>
        {/* Logo area */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            F
          </div>
          <span className="text-lg font-bold text-text-primary">
            FinSpace
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-surface hover:text-text-secondary"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? "text-primary" : "text-text-muted"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle at bottom — both icons in DOM, CSS shows correct one */}
        <div className="border-t border-border p-4">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-xs font-medium text-text-muted transition-all duration-200 hover:bg-surface hover:text-text-secondary"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 light-only" />
            <Moon className="h-5 w-5 dark-only" />
            <span className="light-only">Dark Mode</span>
            <span className="dark-only">Light Mode</span>
          </button>
        </div>
      </aside>
    </>
  );
}
