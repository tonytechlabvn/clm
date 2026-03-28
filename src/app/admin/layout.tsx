"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import Link from "next/link";
import {
  User,
  LogOut,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top navbar */}
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm h-14 shrink-0">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">CLM</span>
              <span className="text-xs font-medium text-muted-foreground border rounded px-1.5 py-0.5">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {session?.wpUser && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={`${session.wpUser.name} - Sign out`}
              >
                <User className="h-4 w-4" />
              </button>
            )}
            {!session?.wpUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />

        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-14 bottom-0 z-40 w-56 bg-card border-r lg:hidden overflow-y-auto">
              <AdminSidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </>
        )}

        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
