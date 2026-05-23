// ── Period helpers for Schedule view ─────────────────────────────────────────

export const MONTHS_RU = [
  "январь","февраль","март","апрель","май","июнь",
  "июль","август","сентябрь","октябрь","ноябрь","декабрь",
];
export const MONTHS_RU_GEN = [
  "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря",
];
export const MONTHS_RU_CAP = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(1);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function lastDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export type PeriodInfo = {
  type: string;
  label: string;       // короткий лейбл для кнопки
  rangeLabel: string;  // например "1–31 мая"
  start: Date;
  end: Date;
};

export function getPeriods(today: Date): PeriodInfo[] {
  const nextFirst = addMonths(today, 1);
  const endNextMonth = lastDay(nextFirst);
  const end3 = lastDay(addMonths(today, 3));
  const end6 = lastDay(addMonths(today, 6));
  const endCurrent = lastDay(today);

  const fmt = (d: Date) => `${d.getDate()} ${MONTHS_RU_GEN[d.getMonth()]}`;
  const monthYear = (d: Date) => `${MONTHS_RU_CAP[d.getMonth()]} ${d.getFullYear()}`;
  const rangeMonths = (a: Date, b: Date) =>
    a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
      ? monthYear(a)
      : a.getFullYear() === b.getFullYear()
      ? `${MONTHS_RU_CAP[a.getMonth()]} – ${MONTHS_RU[b.getMonth()]} ${b.getFullYear()}`
      : `${MONTHS_RU_CAP[a.getMonth()]} ${a.getFullYear()} – ${MONTHS_RU[b.getMonth()]} ${b.getFullYear()}`;

  return [
    {
      type: "current_month_rest",
      label: `до конца ${MONTHS_RU_GEN[today.getMonth()]}`,
      rangeLabel: `${fmt(today)} – ${fmt(endCurrent)} ${today.getFullYear()}`,
      start: today,
      end: endCurrent,
    },
    {
      type: "next_month",
      label: monthYear(nextFirst),
      rangeLabel: `1 – ${endNextMonth.getDate()} ${MONTHS_RU_GEN[nextFirst.getMonth()]} ${nextFirst.getFullYear()}`,
      start: nextFirst,
      end: endNextMonth,
    },
    {
      type: "next_3_months",
      label: rangeMonths(nextFirst, end3),
      rangeLabel: `1 ${MONTHS_RU_GEN[nextFirst.getMonth()]} – ${end3.getDate()} ${MONTHS_RU_GEN[end3.getMonth()]} ${end3.getFullYear()}`,
      start: nextFirst,
      end: end3,
    },
    {
      type: "next_6_months",
      label: rangeMonths(nextFirst, end6),
      rangeLabel: `1 ${MONTHS_RU_GEN[nextFirst.getMonth()]} – ${end6.getDate()} ${MONTHS_RU_GEN[end6.getMonth()]} ${end6.getFullYear()}`,
      start: nextFirst,
      end: end6,
    },
  ];
}
