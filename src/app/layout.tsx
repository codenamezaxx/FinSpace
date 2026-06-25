import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { ClientSerwistProvider } from "@/components/layout/ClientSerwistProvider";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const APP_NAME = "FinSpace";
const APP_DEFAULT_TITLE = "FinSpace - Personal Finance Manager";
const APP_TITLE_TEMPLATE = "%s - FinSpace";
const APP_DESCRIPTION = "Manage your finances offline with FinSpace PWA";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("finspace-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`,
          }}
        />
        <style>{`
          /* ─── Theme visibility helpers (both icons in DOM, CSS shows correct one) ─── */
          .light-only { display: inline-flex; }
          .dark-only { display: none; }
          [data-theme="dark"] .light-only { display: none !important; }
          [data-theme="dark"] .dark-only { display: inline-flex !important; }

          .light-block { display: block; }
          .dark-block { display: none; }
          [data-theme="dark"] .light-block { display: none !important; }
          [data-theme="dark"] .dark-block { display: block !important; }

          .light-hidden { display: none; }
          .dark-hidden { display: inline-flex; }
          [data-theme="dark"] .light-hidden { display: inline-flex !important; }
          [data-theme="dark"] .dark-hidden { display: none !important; }

          /* ─── Dark mode utility class overrides ─── */
          [data-theme="dark"] .bg-background { background-color: #020617 !important; }
          [data-theme="dark"] .bg-surface { background-color: #1E293B !important; }
          [data-theme="dark"] .bg-surface-alt { background-color: #0F172A !important; }
          [data-theme="dark"] .text-text-primary { color: #FFFFFF !important; }
          [data-theme="dark"] .text-text-secondary { color: #94A3B8 !important; }
          [data-theme="dark"] .text-text-muted { color: #64748B !important; }
          [data-theme="dark"] .border-border { border-color: #334155 !important; }
          [data-theme="dark"] .text-primary { color: #3B82F6 !important; }

          [data-theme="dark"] .glass {
            background: rgba(30, 41, 59, 0.55) !important;
            border-color: rgba(255, 255, 255, 0.06) !important;
          }

          [data-theme="dark"] .hover\\:bg-surface:hover { background-color: #1E293B !important; }
          [data-theme="dark"] .hover\\:bg-surface-alt:hover { background-color: #0F172A !important; }
          [data-theme="dark"] .hover\\:text-text-secondary:hover { color: #94A3B8 !important; }
          [data-theme="dark"] .hover\\:text-text-primary:hover { color: #FFFFFF !important; }
        `}</style>
      </head>
      <body className="min-h-full bg-background text-text-secondary">
        <ThemeProvider>
          <ClientSerwistProvider>
            <AppShell>{children}</AppShell>
          </ClientSerwistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
