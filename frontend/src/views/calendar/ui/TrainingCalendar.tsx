"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, DatesSetArg, EventClickArg } from "@fullcalendar/core";
import ruLocale from "@fullcalendar/core/locales/ru";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: Record<string, unknown>;
};

type Props = {
  events: CalendarEvent[];
  isAdmin: boolean;
  onDatesSet: (start: string, end: string) => void;
  onDateSelect: (start: string, end: string) => void;
  onEventClick: (eventId: string) => void;
};

function TrainingCalendar({ events, isAdmin, onDatesSet, onDateSelect, onEventClick }: Props) {
  return (
    <FullCalendar
      plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      locale={ruLocale}
      events={events}
      selectable={isAdmin}
      selectMirror
      editable={false}
      dayMaxEvents
      weekends
      nowIndicator
      allDaySlot={false}
      slotMinTime="06:00:00"
      slotMaxTime="22:00:00"
      height="auto"
      eventDisplay="block"
      datesSet={(info: DatesSetArg) => onDatesSet(info.startStr, info.endStr)}
      select={(info: DateSelectArg) => onDateSelect(info.startStr, info.endStr)}
      eventClick={(info: EventClickArg) => onEventClick(info.event.id)}
    />
  );
}

export default TrainingCalendar;
