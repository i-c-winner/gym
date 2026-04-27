"use client";

import { useEffect } from "react";

import { RegistrationPanel, useAuth } from "@/features/auth";
import { HomeHero } from "@/widgets/home-hero";

export function HomePage() {
  const { checkAuth, status, user } = useAuth();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkAuth().catch((error: unknown) => {
        console.error("Initial auth check failed", error);
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkAuth]);

  if (status === "anonymous") {
    return <RegistrationPanel />;
  }

  return <HomeHero authStatus={status} userName={user?.firstName ?? user?.telephone} />;
}
