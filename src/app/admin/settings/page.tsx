"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, Shield, Bell } from "lucide-react";

export default function AdminSettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your admin preferences
        </p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{session?.wpUser?.name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{session?.wpUser?.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{session?.role || "admin"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder cards for future settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Security</CardTitle>
                <CardDescription>Password & authentication</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription>Email & alert preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
