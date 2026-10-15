import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/inter";
import "@fontsource-variable/geist-mono";
import "lenis/dist/lenis.css";
import "./theme.css";
import "./globals.css";
import { DesignProvider } from "@/components/design/theme";
import { AppProviders } from "@/components/app-shell";
import { themeBootstrap } from "@/lib/theme-bootstrap";
export const metadata: Metadata = {
  title: "CampusSignal — Your next small win",
  description:
    "A little momentum. A nearby friend. A way forward for working university learners.",
  applicationName: "CampusSignal",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/brand/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ea" },
    { media: "(prefers-color-scheme: dark)", color: "#15130f" },
  ],
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <DesignProvider>
          {/* Persistent session + shell: survives navigation between screens. */}
          <AppProviders>{children}</AppProviders>
        </DesignProvider>
      </body>
    </html>
  );
}
