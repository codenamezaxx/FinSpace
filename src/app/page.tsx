import Link from "next/link";
import { LayoutDashboard, Wallet, TrendingUp, Wrench } from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    name: "Dasbor",
    description: "Ikhtisar keuangan real-time dengan wawasan cerdas dan metrik utama sekilas.",
    href: "/dashboard",
  },
  {
    icon: Wallet,
    name: "Anggaran",
    description: "Tetapkan batas pengeluaran, lacak kategori, dan kendalikan anggaran bulanan Anda.",
    href: "/budget",
  },
  {
    icon: TrendingUp,
    name: "Kekayaan",
    description: "Pantau kekayaan bersih, aset, dan kewajiban untuk mengembangkan kesehatan finansial Anda.",
    href: "/wealth",
  },
  {
    icon: Wrench,
    name: "Alat",
    description: "Kalkulator, perencana, dan utilitas untuk membuat keputusan keuangan yang lebih cerdas.",
    href: "/tools",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        {/* Subtle radial glow behind logo */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[420px] w-[420px] rounded-full bg-accent-secondary/10 blur-[120px]" />
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
            Pengelola Keuangan Pribadi
          </p>

          {/* CTA */}
          <Link
            href="/dashboard"
            className="mt-10 inline-flex h-12 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
          >
            Mulai
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
