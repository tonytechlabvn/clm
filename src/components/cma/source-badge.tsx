// Colored badge showing post content source (web, zalo_bot, mcp, scheduler)

const SOURCE_CONFIG: Record<string, { label: string; className: string }> = {
  web: { label: "Web", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  zalo_bot: { label: "Zalo Bot", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  mcp: { label: "MCP", className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  scheduler: { label: "Scheduler", className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
};

export function SourceBadge({ source }: { source?: string | null }) {
  const config = SOURCE_CONFIG[source || "web"] || SOURCE_CONFIG.web;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
