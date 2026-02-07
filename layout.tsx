import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ruhestandsplaner - 3-Topfe-Strategie mit Monte Carlo Simulation",
  description: "Planen Sie Ihren Ruhestand wissenschaftlich fundiert mit der 3-Topfe-Strategie und Monte Carlo Simulation. Berechnen Sie die optimale Vermogensaufteilung fur Ihre Entnahmeziele.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          data-design-ignore="true"
          dangerouslySetInnerHTML={{
            __html: `(function() {
  if (window === window.parent || window.__DESIGN_NAV_REPORTER__) return;
  window.__DESIGN_NAV_REPORTER__ = true;
  function report() {
    try { window.parent.postMessage({ type: 'IFRAME_URL_CHANGE', payload: { url: location.origin + location.pathname + location.hash } }, '*'); } catch(e) {}
  }
  report();
  var ps = history.pushState, rs = history.replaceState;
  history.pushState = function() { ps.apply(this, arguments); report(); };
  history.replaceState = function() { rs.apply(this, arguments); report(); };
  window.addEventListener('popstate', report);
  window.addEventListener('hashchange', report);
  window.addEventListener('load', report);
})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
