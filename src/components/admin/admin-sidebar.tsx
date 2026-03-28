"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  User,
  PenSquare,
  FileText,
  CalendarDays,
  Plug,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/cma/composer", label: "Composer", icon: PenSquare },
  { href: "/admin/cma/posts", label: "Posts", icon: FileText },
  { href: "/admin/cma/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/cma/settings", label: "Connections", icon: Plug },
];

const settingsItems = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className={cn(
      "w-56 shrink-0 border-r bg-card flex flex-col",
      mobile ? "h-full" : "hidden lg:flex"
    )}>
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings section */}
      <div className="border-t">
        <div className="px-3 py-3 space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Settings className="h-3.5 w-3.5 shrink-0" />
            Settings
          </div>
          {settingsItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-[16px] w-[16px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {session?.wpUser && (
          <div className="px-4 py-3 border-t">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.wpUser.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.role || "admin"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
