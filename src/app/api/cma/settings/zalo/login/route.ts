// POST /api/cma/settings/zalo/login — trigger openzca QR login, return QR as base64 image
// GET  /api/cma/settings/zalo/login — check openzca auth status

import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/cma/services/org-auth";

// Execute command on the openzca container
function dockerExec(cmd: string, timeout = 30000): Promise<{ stdout: string; stderr: string; code: number }> {
  const { execSync } = require("child_process");
  try {
    const stdout = execSync(`docker exec clm-openzca npx openzca ${cmd}`, { timeout, encoding: "utf8" });
    return Promise.resolve({ stdout, stderr: "", code: 0 });
  } catch (err: any) {
    return Promise.resolve({ stdout: err.stdout || "", stderr: err.stderr || "", code: err.status || 1 });
  }
}

// GET — check if openzca is logged in
export async function GET(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const result = await dockerExec("auth status");
  const output = (result.stdout + result.stderr).toLowerCase();
  const loggedIn = output.includes("logged in") || output.includes("authenticated");

  return NextResponse.json({
    loggedIn,
    status: result.stdout.trim() || result.stderr.trim() || "Not connected",
  });
}

// POST — start QR login or restart listener
export async function POST(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const action = (body as { action?: string }).action || "login";

  // Restart the openzca container
  if (action === "restart") {
    const { execSync } = require("child_process");
    try {
      execSync("docker restart clm-openzca", { timeout: 30000 });
      return NextResponse.json({ success: true, message: "Bot restarted successfully" });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // Generate QR code as base64 data URL for web display
  if (action === "login") {
    const result = await dockerExec("auth login --qr-base64", 60000);
    const output = result.stdout + result.stderr;

    // Extract data URL from output (format: data:image/png;base64,...)
    const dataUrlMatch = output.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (dataUrlMatch) {
      return NextResponse.json({
        success: true,
        qrDataUrl: dataUrlMatch[0],
        message: "Scan this QR code with your Zalo app",
      });
    }

    // Check if already logged in
    if (output.toLowerCase().includes("logged in") || output.toLowerCase().includes("authenticated")) {
      return NextResponse.json({
        success: true,
        loggedIn: true,
        message: "Already logged in. Click 'Restart Listener' to start the bot.",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Failed to generate QR code. " + (result.stderr || result.stdout).substring(0, 200),
    }, { status: 500 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
