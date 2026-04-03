// POST /api/cma/settings/zalo/login — trigger openzca QR login, return QR as base64 image
// GET  /api/cma/settings/zalo/login — check openzca auth status

import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/cma/services/org-auth";
import { execSync, exec } from "child_process";

const CMD_PREFIX = "docker exec -u node clm-openzca npx --yes openzca@latest";

function dockerExecSync(cmd: string, timeout = 30000): { stdout: string; code: number } {
  try {
    const stdout = execSync(`${CMD_PREFIX} ${cmd}`, { timeout, encoding: "utf8" });
    return { stdout, code: 0 };
  } catch (err: any) {
    return { stdout: err.stdout || err.stderr || err.message || "", code: err.status || 1 };
  }
}

// GET — check if openzca is logged in
export async function GET(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const result = dockerExecSync("auth status", 15000);
  const output = result.stdout;
  const loggedIn = output.includes("loggedIn: true");
  const idMatch = output.match(/userId[:\s]*'?(\d{10,})'?/);

  return NextResponse.json({
    loggedIn,
    zaloId: idMatch?.[1] || "",
    status: output.trim() || "Not connected",
  });
}

// POST — login (generate QR), restart, or check
export async function POST(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const action = (body as { action?: string }).action || "login";

  if (action === "restart") {
    try {
      execSync("docker restart clm-openzca", { timeout: 30000 });
      return NextResponse.json({ success: true, message: "Bot restarted successfully" });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  if (action === "login") {
    // Clear stale files
    try {
      execSync("docker exec clm-openzca rm -f /tmp/qr.png /home/node/.openzca/profiles/default/listener-owner.json", { timeout: 5000 });
    } catch {}

    // Start login as BACKGROUND process (non-blocking) so QR stays valid
    exec(`docker exec -d -u node clm-openzca sh -c 'npx --yes openzca@latest auth login --qr-path /tmp/qr.png > /tmp/login.log 2>&1'`);

    // Poll for QR file to appear (max 15s)
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const qrBase64 = execSync("docker exec clm-openzca base64 -w0 /tmp/qr.png", {
          timeout: 5000, encoding: "utf8",
        });
        if (qrBase64 && qrBase64.length > 100) {
          return NextResponse.json({
            success: true,
            qrDataUrl: `data:image/png;base64,${qrBase64.trim()}`,
            message: "Scan this QR code with your Zalo app — expires in ~60 seconds",
          });
        }
      } catch {}
    }

    // Check if already logged in
    const status = dockerExecSync("auth status", 10000);
    if (status.stdout.includes("loggedIn: true")) {
      return NextResponse.json({ success: true, loggedIn: true, message: "Already logged in" });
    }

    return NextResponse.json({
      success: false,
      message: "Failed to generate QR code — try again",
    }, { status: 500 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
