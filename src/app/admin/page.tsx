"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome{session?.wpUser?.name ? `, ${session.wpUser.name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Core Learning Management — Admin Dashboard
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">CLM Foundation</CardTitle>
              <CardDescription>Scaffold ready for module development</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The CLM foundation is set up. Modules like CMA (Content Marketing Automation)
            can now be built on top of this scaffold.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
