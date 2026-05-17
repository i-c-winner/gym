"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import ruLocale from "@fullcalendar/core/locales/ru";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
};

type Props = {
  events: CalendarEvent[];
  onDatesSet: (start: string, end: string) => void;
  onEventClick: (eventId: string) => void;
};

function WorkoutsCalendar({ events, onDatesSet, onEventClick }: Props) {
  return (
    <FullCalendar
      plugins={[timeGridPlugin, dayGridPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      locale={ruLocale}
      events={events}
      selectable={false}
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
      eventClick={(info: EventClickArg) => onEventClick(info.event.id)}
    />
  );
}

export default WorkoutsCalendar;
