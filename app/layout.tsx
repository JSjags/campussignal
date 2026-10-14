import type { Metadata } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/inter";
import "@fontsource-variable/geist-mono";
import "@fontsource/instrument-serif/400-italic.css";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./theme.css";
import { DesignProvider } from "@/components/design/theme";
import { themeBootstrap } from "@/lib/theme-bootstrap";
export const metadata: Metadata = {
  title: "CampusSignal — Your next small win",
  description:
    "A little momentum. A nearby friend. A way forward for working university learners.",
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
        <DesignProvider>{children}</DesignProvider>
      </body>
    </html>
  );
}
