import "./globals.css";
import "@fontsource/open-sauce-one/400.css";
import "@fontsource/open-sauce-one/500.css";
import "@fontsource/open-sauce-one/700.css";

import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Gym Frontend",
  description: "Простая заглушка фронтенда.",
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
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
