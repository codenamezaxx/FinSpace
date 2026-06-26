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
  Plus,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/lib/theme-context";
import { useTransactionModal } from "@/lib/transaction-modal-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/wealth", label: "Wealth", icon: TrendingUp },
  { href: "/tools", label: "Tools", icon: Wrench },
];

export function NavigationBar() {
  const pathname = usePathname();
  const { toggleTheme } = useTheme();
  const { openAddTransaction } = useTransactionModal();

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
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface-alt" style={{ boxShadow: "var(--sidebar-shadow)" }}>
        {/* Logo area */}
        <div className="flex h-24 items-center gap-2 border-b border-border px-6">
          <img
            src="/icons/icon-192x192.svg"
            alt="FinSpace Logo"
            className="h-10 w-10"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-text-primary">
              FinSpace
            </span>
            <span className="text-xs text-text-muted">
              Personal Finance Manager
            </span>
          </div>
        </div>

        {/* Tambah Transaksi */}
        <div className="px-4 pt-6 pb-4">
          <button
            type="button"
            onClick={() => openAddTransaction()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-mono text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
          >
            <Plus className="h-4 w-4" />
            Tambah Transaksi
          </button>
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
      </aside>
    </>
  );
}
