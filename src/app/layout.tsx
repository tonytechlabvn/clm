import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLM - Core Learning Management",
  description: "Core Learning Management platform by Tony Tech Lab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("antialiased min-h-screen bg-background")}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
