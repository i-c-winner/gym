"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import OndemandVideoOutlinedIcon from "@mui/icons-material/OndemandVideoOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import type { NavItem } from "./AccountSidebar";

function useAccountNavItems(activeHref: string): NavItem[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { label: t("accountMyPrograms.navigation.home"), icon: <HomeOutlinedIcon fontSize="small" />, href: "/main", active: activeHref === "/main" },
      { label: t("accountMyPrograms.navigation.programs"), icon: <AppsOutlinedIcon fontSize="small" />, href: "/account/programs", active: activeHref === "/account/programs" },
      { label: t("accountMyPrograms.navigation.lessons"), icon: <OndemandVideoOutlinedIcon fontSize="small" />, href: "/main" },
      { label: t("accountMyPrograms.navigation.workouts"), icon: <FitnessCenterOutlinedIcon fontSize="small" />, href: "/main" },
      { label: t("accountMyPrograms.navigation.calendar"), icon: <CalendarMonthOutlinedIcon fontSize="small" />, href: "/main" },
      { label: t("accountMyPrograms.navigation.favorites"), icon: <FavoriteBorderOutlinedIcon fontSize="small" />, href: "/main" },
    ],
    [t, activeHref],
  );
}

export { useAccountNavItems };
