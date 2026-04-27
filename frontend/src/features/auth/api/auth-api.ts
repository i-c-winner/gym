import { mapUser, type UserDto } from "@/entities/user";
import { apiRequest } from "@/shared/api";

import type {
  AuthResponseDto,
  AuthSession,
  LoginPayload,
  RegisterPayload,
} from "../model/types";

function mapAuthResponse(dto: AuthResponseDto): AuthSession {
  return {
    user: mapUser({
      id: dto.user_id,
      telephone: dto.telephone,
      telegram_id: dto.telegram_id,
      first_name: dto.first_name,
      last_name: dto.last_name,
      age: dto.age,
      gender: dto.gender,
    }),
    csrfToken: dto.csrf_token,
  };
}

export const authApi = {
  async me() {
    const user = await apiRequest<UserDto>("/me");

    return mapUser(user);
  },

  async login(payload: LoginPayload) {
    const session = await apiRequest<AuthResponseDto>("/auth/login", {
      method: "POST",
      body: payload,
    });

    return mapAuthResponse(session);
  },

  async register(payload: RegisterPayload) {
    const session = await apiRequest<AuthResponseDto>("/auth/register", {
      method: "POST",
      body: payload,
    });

    return mapAuthResponse(session);
  },

  async refresh(csrfToken: string) {
    const session = await apiRequest<AuthResponseDto>("/auth/refresh", {
      method: "POST",
      csrfToken,
    });

    return mapAuthResponse(session);
  },

  async logout(csrfToken: string) {
    await apiRequest<void>("/auth/logout", {
      method: "POST",
      csrfToken,
    });
  },
};
