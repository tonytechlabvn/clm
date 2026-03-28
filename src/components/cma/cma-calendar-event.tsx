"use client";

// Calendar event card — renders inside FullCalendar cells with platform color + status

import { Badge } from "@/components/ui/badge";

interface CalendarEventProps {
  title: string;
  status: string;
  platform: string;
  platformLabel: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-amber-100 text-amber-700" },
  publishing: { label: "Publishing", className: "bg-yellow-100 text-yellow-700" },
  published: { label: "Published", className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
};

const PLATFORM_ICONS: Record<string, string> = {
  wordpress: "WP",
  facebook: "FB",
  linkedin: "LI",
};

export function CmaCalendarEvent({ title, status, platform, platformLabel }: CalendarEventProps) {
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.draft;
  const platformIcon = PLATFORM_ICONS[platform] || "??";

  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs overflow-hidden">
      <span className="shrink-0 font-bold text-[10px] opacity-80" title={platformLabel}>
        {platformIcon}
      </span>
      <span className="truncate font-medium">{title}</span>
      <Badge variant="secondary" className={`shrink-0 text-[9px] px-1 py-0 ${statusInfo.className}`}>
        {statusInfo.label}
      </Badge>
    </div>
  );
}
