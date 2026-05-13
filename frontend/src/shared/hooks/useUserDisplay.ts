import { useMemo } from "react";
import { useAuth } from "@/features/auth/model/auth-context";

type UseUserDisplayOptions = {
  fallbackName?: string;
  fallbackPlan?: string;
};

function useUserDisplay({
  fallbackName = "Пользователь",
  fallbackPlan = "Базовый план",
}: UseUserDisplayOptions = {}) {
  const { user } = useAuth();

  const displayName = useMemo(() => {
    const parts = [user?.first_name, user?.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    if (user?.telegram_id) return `Telegram ${user.telegram_id}`;
    if (user?.telephone) return user.telephone;
    return fallbackName;
  }, [user, fallbackName]);

  const profileSubtitle = useMemo(() => {
    if (user?.telephone) return user.telephone;
    if (user?.telegram_id) return `Telegram ID: ${user.telegram_id}`;
    return fallbackPlan;
  }, [user, fallbackPlan]);

  return { displayName, profileSubtitle };
}

export { useUserDisplay };