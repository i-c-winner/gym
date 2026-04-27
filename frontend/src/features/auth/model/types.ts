import type { User, UserDto } from "@/entities/user";

export type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

export type LoginPayload = {
  telephone?: string;
  telegram_auth?: TelegramAuthPayload;
};

export type RegisterPayload = LoginPayload & {
  first_name?: string;
  last_name?: string;
  age?: number;
  gender?: string;
};

export type TelegramAuthPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export type AuthResponseDto = Omit<UserDto, "id" | "created_at"> & {
  user_id: string;
  csrf_token: string;
};

export type AuthSession = {
  user: User;
  csrfToken: string;
};
