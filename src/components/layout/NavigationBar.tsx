"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Wrench,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTransactionModal } from "@/lib/transaction-modal-context";

const navItems = [
  { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  { href: "/budget", label: "Anggaran", icon: Wallet },
  { href: "/wealth", label: "Kekayaan", icon: TrendingUp },
  { href: "/tools", label: "Alat", icon: Wrench },
];

interface NavigationBarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onScan?: () => void;
}

export function NavigationBar({ isCollapsed = false, onToggle, onScan }: NavigationBarProps) {
  const pathname = usePathname();
  const { openAddTransaction } = useTransactionModal();

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-surface/60 backdrop-blur-xl px-2 py-2 lg:hidden">
        {navItems.map((item, i) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Fragment key={item.href}>
              {i === 2 && onScan && (
                <button
                  onClick={onScan}
                  className="flex items-center justify-center w-full max-w-14 h-14 -mt-5 rounded-full bg-primary text-white shadow-lg shadow-primary/30 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
                  aria-label="Scan struk"
                >
                  <Camera className="w-6 h-6" />
                </button>
              )}
              <Link
                href={item.href}
                className={`flex flex-col items-center w-full gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </Link>
            </Fragment>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col lg:border-r lg:border-border lg:bg-surface-alt transition-all duration-300 ${
          isCollapsed ? "w-[72px]" : "w-64"
        }`}
        style={{ boxShadow: "var(--sidebar-shadow)" }}
      >
        {/* Logo area — collapsed: only logo icon */}
        <div
          className={`flex items-center border-b border-border transition-all duration-300 ${
            isCollapsed ? "h-16 justify-center px-0" : "h-24 gap-2 px-6"
          }`}
        >
          <img
            src="/icons/icon-192x192.svg"
            alt="FinSpace Logo"
            className="h-9 w-9 shrink-0"
          />
          <div
            className={`flex flex-col overflow-hidden transition-all duration-300 ${
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            <span className="whitespace-nowrap text-xl font-bold px-2 text-text-primary">
              FinSpace
            </span>
            <span className="whitespace-nowrap text-xs font-medium px-2 text-text-muted">
              Financial Dashboard
            </span>
          </div>
        </div>

        {/* Tambah Transaksi */}
        <div className={`transition-all duration-300 ${isCollapsed ? "px-2 pt-4 pb-3" : "px-4 pt-6 pb-4"}`}>
          <button
            type="button"
            onClick={() => openAddTransaction()}
            className={`flex items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 ${
              isCollapsed
                ? "mx-auto h-10 w-10"
                : "w-full gap-2 px-5 py-3"
            }`}
            title={isCollapsed ? "Tambah Transaksi" : undefined}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span
              className={`overflow-hidden transition-all duration-300 ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              Tambah Transaksi
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-lg text-xs font-medium transition-all duration-200 ${
                  isCollapsed
                    ? "justify-center px-0 py-3"
                    : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-surface hover:text-text-secondary"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? "text-primary" : "text-text-muted"
                  }`}
                />
                <span
                  className={`overflow-hidden transition-all duration-300 ${
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

          {/* Toggle button */}
          <div className="p-3 pt-1">
            <button
              type="button"
              onClick={onToggle}
              className={`flex items-center rounded-lg transition-colors hover:bg-surface ${
                isCollapsed
                  ? "mx-auto h-9 w-9 justify-center"
                  : "w-full gap-3 px-3 py-2"
              }`}
              aria-label={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 shrink-0 text-text-muted" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 shrink-0 text-text-muted" />
                  <span className="text-xs font-medium text-text-muted">
                    Ciutkan
                  </span>
                </>
              )}
            </button>
          </div>

        {/* Settings + Toggle — bottom of sidebar */}
        <div className="border-t border-border">
          {/* Settings */}
          <div className="px-3 py-4">
            <Link
              href="/settings"
              className={`flex items-center rounded-lg transition-colors hover:bg-surface ${
                isCollapsed
                  ? "mx-auto h-9 w-9 justify-center"
                  : "w-full gap-3 px-3 py-2"
              } ${
                pathname.startsWith("/settings")
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted"
              }`}
              title={isCollapsed ? "Pengaturan" : undefined}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span
                className={`overflow-hidden text-xs transition-all duration-300 ${
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                }`}
              >
                Pengaturan
              </span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
