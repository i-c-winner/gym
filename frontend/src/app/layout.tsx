import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Inter } from "next/font/google";

import { AppProviders } from "@/shared/providers/app-providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Gym Frontend",
  description: "Next.js frontend scaffold for the gym workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>
        <AppRouterCacheProvider>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
