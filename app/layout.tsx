import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { PropsWithChildren, Suspense } from "react";

import { CartProvider } from "@/components/cart/cart-provider";
import { AppShell } from "@/components/layout/app-shell";
import { siteConfig } from "@/lib/config/site";
import "@/styles/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit"
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url)
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="sv">
      <body className={outfit.variable}>
        <Suspense fallback={null}>
          <CartProvider>
            <AppShell>{children}</AppShell>
          </CartProvider>
        </Suspense>
      </body>
    </html>
  );
}
