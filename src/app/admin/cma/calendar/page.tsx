"use client";

// CMA Content Calendar — month/week views with drag-and-drop rescheduling

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventDropArg, EventClickArg, DatesSetArg } from "@fullcalendar/core";
import { Button } from "@/components/ui/button";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { cmaFetch } from "@/lib/cma/use-cma-api";
import { CmaCalendarEvent } from "@/components/cma/cma-calendar-event";
import { CalendarDays, RefreshCw } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  status: string;
  platform: string;
  platformLabel: string;
  color: string;
}

// Common timezones relevant for this app
const TIMEZONES = [
  "Asia/Saigon",
  "Asia/Tokyo",
  "Asia/Singapore",
  "UTC",
  "America/New_York",
  "Europe/London",
];

export default function CmaCalendarPage() {
  const router = useRouter();
  const { org, loading: orgLoading } = useCmaOrg();
  const calendarRef = useRef<FullCalendar>(null);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Saigon");
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const fetchEvents = useCallback(async (start: string, end: string) => {
    if (!org) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ orgId: org.id, start, end });
      const res = await fetch(`/api/cma/calendar?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } finally {
      setLoading(false);
    }
  }, [org]);

  // Called when FullCalendar changes the visible date range
  const handleDatesSet = useCallback((info: DatesSetArg) => {
    const start = info.startStr;
    const end = info.endStr;
    setDateRange({ start, end });
    fetchEvents(start, end);
  }, [fetchEvents]);

  // Click event → navigate to post detail
  const handleEventClick = useCallback((info: EventClickArg) => {
    router.push(`/admin/cma/posts/${info.event.id}`);
  }, [router]);

  // Drag-and-drop reschedule
  const handleEventDrop = useCallback(async (info: EventDropArg) => {
    if (!org || !info.event.start) {
      info.revert();
      return;
    }

    const postId = info.event.id;
    const extendedProps = info.event.extendedProps;

    // Only scheduled posts can be rescheduled via drag
    if (extendedProps.status !== "scheduled") {
      info.revert();
      return;
    }

    try {
      await cmaFetch(`/api/cma/posts/${postId}/schedule`, {
        method: "PATCH",
        body: JSON.stringify({
          orgId: org.id,
          scheduledAt: info.event.start.toISOString(),
        }),
      });
    } catch {
      info.revert();
    }
  }, [org]);

  if (orgLoading) {
    return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!org) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No organization found. Create one in Settings first.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Content Calendar</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Timezone selector */}
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 bg-background"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dateRange && fetchEvents(dateRange.start, dateRange.end)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card border rounded-lg p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          events={events.map((e) => ({
            id: e.id,
            title: e.title,
            start: e.start,
            backgroundColor: e.color,
            borderColor: e.color,
            editable: e.status === "scheduled", // only scheduled posts can be drag-rescheduled
            extendedProps: {
              status: e.status,
              platform: e.platform,
              platformLabel: e.platformLabel,
            },
          }))}
          editable={false}
          droppable={false}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          datesSet={handleDatesSet}
          timeZone={timezone}
          height="auto"
          dayMaxEvents={4}
          eventContent={(arg) => (
            <CmaCalendarEvent
              title={arg.event.title}
              status={arg.event.extendedProps.status}
              platform={arg.event.extendedProps.platform}
              platformLabel={arg.event.extendedProps.platformLabel}
            />
          )}
        />
      </div>
    </div>
  );
}
