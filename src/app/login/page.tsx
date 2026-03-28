"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">CLM</CardTitle>
            <CardDescription>Core Learning Management</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error === "AccountDeactivated" && (
            <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-lg">
              Your account has been deactivated. Contact admin.
            </div>
          )}
          {error && error !== "AccountDeactivated" && (
            <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-lg">
              Sign in failed. Please try again.
            </div>
          )}

          <Button
            onClick={() => signIn("wordpress", { callbackUrl: "/admin" })}
            className="w-full cursor-pointer"
            size="lg"
          >
            Sign in with TonyTechLab
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            onClick={() => signIn("google", { callbackUrl: "/admin" })}
            variant="outline"
            className="w-full cursor-pointer"
            size="lg"
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
