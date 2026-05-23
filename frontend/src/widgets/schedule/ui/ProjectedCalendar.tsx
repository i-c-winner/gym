"use client";

import { Box, Stack, Typography } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import type { EventInput } from "@fullcalendar/core";
import type { ClassType } from "@/shared/api/gym";
import type { PeriodInfo } from "@/shared/lib/schedulePeriods";

// ── Генерация проецируемых событий ───────────────────────────────────────────

export function generateProjectedEvents(
  classTypes: ClassType[],
  periodStart: Date,
  periodEnd: Date,
  highlightTypeId: string | null,
  selectedDays: Set<number>,  // 0=Пн … 6=Вс
  selectedTypeId: string,
): EventInput[] {
  const result: EventInput[] = [];
  const endExclusive = new Date(periodEnd);
  endExclusive.setDate(endExclusive.getDate() + 1);

  const cursor = new Date(periodStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < endExclusive) {
    const jsDay = cursor.getDay();
    const ourDay = jsDay === 0 ? 6 : jsDay - 1;

    for (const ct of classTypes) {
      for (const slot of ct.schedules) {
        if (slot.day_of_week !== ourDay) continue;
        const [hStr, mStr] = slot.start_time.split(":");
        const evStart = new Date(cursor);
        evStart.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
        const evEnd = new Date(evStart);
        evEnd.setMinutes(evEnd.getMinutes() + ct.duration_minutes);

        const dimmedByDay = ct.id === selectedTypeId && !selectedDays.has(ourDay);
        const isHighlighted =
          !dimmedByDay && (highlightTypeId === null || ct.id === highlightTypeId);
        const filterId = `${highlightTypeId ?? "all"}-${selectedTypeId}-${[...selectedDays].sort().join("")}`;

        result.push({
          id: `proj-${filterId}-${ct.id}-${evStart.getTime()}`,
          title: ct.title,
          start: evStart,
          end: evEnd,
          backgroundColor: dimmedByDay
            ? "rgba(80,80,80,0.1)"
            : (isHighlighted ? "#6a7b6a" : "rgba(160,160,160,0.28)"),
          borderColor: dimmedByDay
            ? "transparent"
            : (isHighlighted ? "#4a5f4a" : "rgba(160,160,160,0.4)"),
          textColor: dimmedByDay ? "#ccc" : (isHighlighted ? "#fff" : "#aaa"),
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

// ── Компонент ─────────────────────────────────────────────────────────────────

type ProjectedCalendarProps = {
  period: PeriodInfo;
  classTypes: ClassType[];
  effectiveTypeId: string;
  selectedDays: Set<number>;
  projectedEvents: EventInput[];
  allScheduledDays: Set<number>;
  isFullSelection: boolean;
  onToggleDay: (ourDay: number) => void;
  onResetDays: () => void;
};

export function ProjectedCalendar({
  period,
  classTypes,
  effectiveTypeId,
  selectedDays,
  projectedEvents,
  allScheduledDays,
  isFullSelection,
  onToggleDay,
  onResetDays,
}: ProjectedCalendarProps) {
  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}>
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
          Кликните на день недели в шапке календаря, что бы выбрать дни посещений.
        </Typography>
        {!isFullSelection && (
          <Typography
            onClick={onResetDays}
            sx={{
              fontSize: "0.75rem",
              color: "primary.main",
              cursor: "pointer",
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Сбросить
          </Typography>
        )}
      </Stack>

      <Box
        sx={(t) => ({
          border: `1px solid ${t.palette.divider}`,
          borderRadius: 2,
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
        })}
      >
        <Box
          sx={(t) => ({
            minWidth: 560,
            "& .fc": { fontFamily: "inherit", fontSize: "0.8125rem" },
            "& .fc-toolbar-title": {
              fontFamily: "Georgia, serif",
              fontSize: "1rem !important",
              color: t.palette.text.primary,
            },
            "& .fc-button": {
              bgcolor: "#6a7b6a !important",
              border: "none !important",
              borderRadius: "8px !important",
              px: "8px !important",
              minHeight: "32px !important",
              fontFamily: "inherit !important",
              fontSize: "0.75rem !important",
            },
            "& .fc-button:hover": { bgcolor: "#5a6b5a !important" },
            "& .fc-col-header-cell": { color: t.palette.text.secondary, p: "0 !important" },
            "& .fc-col-header-cell-cushion": { p: "0 !important", display: "block" },
            "& .fc-event": { cursor: "default", borderRadius: "4px !important" },
            "& .fc-daygrid-event": { px: "2px" },
            ...(t.palette.mode === "dark" && {
              "& .fc": {
                "--fc-page-bg-color": t.palette.background.paper,
                "--fc-neutral-bg-color": "rgba(143,163,143,0.07)",
                "--fc-border-color": "rgba(143,163,143,0.18)",
                "--fc-today-bg-color": "rgba(143,163,143,0.10)",
              },
              "& .fc-daygrid-day": {
                background: `${t.palette.background.paper} !important`,
              },
              "& .fc-daygrid-day-number, & .fc-col-header-cell-cushion": {
                color: `${t.palette.text.primary} !important`,
              },
              "& .fc-scrollgrid, & .fc-theme-standard td, & .fc-theme-standard th": {
                borderColor: "rgba(143,163,143,0.18) !important",
              },
            }),
          })}
        >
          <FullCalendar
            key={`${effectiveTypeId}-${[...selectedDays].sort().join("")}`}
            plugins={[dayGridPlugin, interactionPlugin]}
            locale={ruLocale}
            initialView="dayGridMonth"
            initialDate={period.start}
            validRange={{
              start: period.start.toISOString().slice(0, 10),
              end: (() => {
                const d = new Date(period.end);
                d.setDate(d.getDate() + 1);
                return d.toISOString().slice(0, 10);
              })(),
            }}
            headerToolbar={{ left: "prev,next", center: "title", right: "" }}
            buttonText={{ today: "Сегодня" }}
            dayHeaderContent={(args) => {
              const ourDay = args.dow === 0 ? 6 : args.dow - 1;
              const ct = classTypes.find((c) => c.id === effectiveTypeId);
              const hasSlot = ct?.schedules.some((s) => s.day_of_week === ourDay) ?? false;
              const isOn = selectedDays.has(ourDay);
              return (
                <Box
                  onClick={hasSlot ? () => onToggleDay(ourDay) : undefined}
                  title={hasSlot ? (isOn ? "Нажмите, чтобы исключить день" : "Нажмите, чтобы включить день") : undefined}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    py: 0.75,
                    cursor: hasSlot ? "pointer" : "default",
                    userSelect: "none",
                    fontWeight: isOn && hasSlot ? 700 : 400,
                    fontSize: "0.8125rem",
                    color: hasSlot ? (isOn ? "#fff" : "text.secondary") : "text.disabled",
                    bgcolor: hasSlot ? (isOn ? "#6a7b6a" : "rgba(80,80,80,0.12)") : "transparent",
                    transition: "all 0.15s",
                    "&:hover": hasSlot
                      ? { bgcolor: isOn ? "#5a6b5a" : "rgba(80,80,80,0.22)" }
                      : {},
                  }}
                >
                  {args.text}
                </Box>
              );
            }}
            events={projectedEvents}
            height="auto"
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
            noEventsContent={
              <Typography sx={{ py: 4, textAlign: "center", color: "text.secondary", fontSize: "0.875rem" }}>
                Нет занятий в выбранном периоде
              </Typography>
            }
          />
        </Box>
      </Box>
    </Box>
  );
}
