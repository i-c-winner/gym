export type User = {
  id: string;
  telephone: string | null;
  telegramId: string | null;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  gender: string | null;
  createdAt?: string;
};

export type UserDto = {
  id: string;
  telephone: string | null;
  telegram_id: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  created_at?: string;
};

export function mapUser(dto: UserDto): User {
  return {
    id: dto.id,
    telephone: dto.telephone,
    telegramId: dto.telegram_id,
    firstName: dto.first_name,
    lastName: dto.last_name,
    age: dto.age,
    gender: dto.gender,
    createdAt: dto.created_at,
  };
}
