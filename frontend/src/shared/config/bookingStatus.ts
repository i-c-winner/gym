// ── Booking status config (shared between Schedule and TrainerSessions) ───────

export const BOOKING_STATUS_COLOR: Record<string, string> = {
  confirmed:  "#6a7b6a",
  warned:     "#b89f74", // виртуальный статус: confirmed + ожидающий запрос на отсутствие
  absent:     "#9e9e9e",
  cancelled:  "#bdbdbd",
  no_show:    "#ef5350",
  attended:   "#43a047",
};

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  confirmed:  "Записан",
  warned:     "Предупреждение отправлено",
  absent:     "Отсутствовал",
  cancelled:  "Отменено",
  no_show:    "Не явился",
  attended:   "Посетил",
};
