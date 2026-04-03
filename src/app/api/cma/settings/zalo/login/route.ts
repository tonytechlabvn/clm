// POST /api/cma/settings/zalo/login — trigger openzca QR login, return QR as base64 image
// GET  /api/cma/settings/zalo/login — check openzca auth status

import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/cma/services/org-auth";

// Execute openzca command in the sidecar container (as node user for proper file permissions)
function dockerExec(cmd: string, timeout = 30000): Promise<{ stdout: string; stderr: string; code: number }> {
  const { execSync } = require("child_process");
  try {
    const stdout = execSync(`docker exec -u node clm-openzca npx openzca@latest ${cmd}`, { timeout, encoding: "utf8" });
    return Promise.resolve({ stdout, stderr: "", code: 0 });
  } catch (err: any) {
    return Promise.resolve({ stdout: err.stdout || "", stderr: err.stderr || "", code: err.status || 1 });
  }
}

// GET — check if openzca is logged in, return account ID if available
export async function GET(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const result = await dockerExec("auth status");
  const output = result.stdout + result.stderr;
  const loggedIn = output.includes("loggedIn: true") || output.includes("loggedIn:true") || output.toLowerCase().includes("logged in");

  // Extract userId from output like: userId: '6137585649103333359'
  const idMatch = output.match(/userId[:\s]*'?(\d{10,})'?/);
  const zaloId = idMatch?.[1] || "";

  return NextResponse.json({
    loggedIn,
    zaloId,
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

  // Generate QR code: use --qr-path to save file, then read as base64
  if (action === "login") {
    // Clear stale credentials + lock files for fresh login
    const { execSync } = require("child_process");
    try {
      execSync("docker exec clm-openzca rm -f /home/node/.openzca/profiles/default/listener-owner.json", { timeout: 5000 });
    } catch {}

    const result = await dockerExec("auth login --qr-path /tmp/qr.png", 60000);
    const output = result.stdout + result.stderr;

    // Check if already logged in
    if (output.toLowerCase().includes("logged in") || output.toLowerCase().includes("authenticated")) {
      return NextResponse.json({
        success: true,
        loggedIn: true,
        message: "Already logged in. Click 'Start Listener' to start the bot.",
      });
    }

    // Read QR image file as base64
    try {
      const qrBase64 = execSync("docker exec clm-openzca cat /tmp/qr.png | base64 -w0", {
        timeout: 10000, encoding: "utf8", maxBuffer: 1024 * 1024,
      });
      if (qrBase64 && qrBase64.length > 100) {
        return NextResponse.json({
          success: true,
          qrDataUrl: `data:image/png;base64,${qrBase64}`,
          message: "Scan this QR code with your Zalo app",
        });
      }
    } catch {}

    return NextResponse.json({
      success: false,
      message: "Failed to generate QR code. " + (result.stderr || result.stdout).substring(0, 200),
    }, { status: 500 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
