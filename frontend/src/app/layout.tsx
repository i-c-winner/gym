import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import { AppProviders } from "@/shared/providers/app-providers";

import "./globals.css";

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
    <html lang="ru">
      <body>
        <AppRouterCacheProvider>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
