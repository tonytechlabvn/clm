// POST /api/cma/settings/zalo/login — trigger openzca QR login on server
// GET  /api/cma/settings/zalo/login — check openzca auth status + restart listener

import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/cma/services/org-auth";

// Execute command on the openzca container via Docker exec
async function dockerExec(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    exec(`docker exec clm-openzca ${cmd}`, { timeout: 30000 }, (err, stdout, stderr) => {
      resolve({ stdout: stdout || "", stderr: stderr || "", code: err?.code || 0 });
    });
  });
}

// GET — check if openzca is logged in
export async function GET(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const result = await dockerExec("openzca auth status");
  const loggedIn = result.stdout.toLowerCase().includes("logged in") || result.code === 0;

  return NextResponse.json({
    loggedIn,
    status: result.stdout.trim() || result.stderr.trim() || "Unknown",
  });
}

// POST — start QR login process or restart listener
export async function POST(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const action = (body as { action?: string }).action || "login";

  if (action === "restart") {
    // Restart the openzca container to pick up new credentials
    const { exec } = await import("child_process");
    return new Promise<NextResponse>((resolve) => {
      exec("docker restart clm-openzca", { timeout: 30000 }, (err, stdout, stderr) => {
        if (err) {
          resolve(NextResponse.json({ success: false, error: stderr || err.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ success: true, message: "OpenZCA listener restarted" }));
        }
      });
    });
  }

  // Start interactive login — generate QR code URL
  // openzca auth login outputs a QR code to terminal, which doesn't work via API
  // Instead, use login-cred or provide instructions
  // For now: check status and provide SSH command if not logged in
  const status = await dockerExec("openzca auth status");
  const loggedIn = status.stdout.toLowerCase().includes("logged in");

  if (loggedIn) {
    return NextResponse.json({
      success: true,
      loggedIn: true,
      message: "Already logged in. Click 'Restart Listener' to apply.",
    });
  }

  return NextResponse.json({
    success: false,
    loggedIn: false,
    message: "QR login requires terminal access. Use the SSH command shown below.",
    sshCommand: "ssh root@72.60.211.23 \"cd /opt/tonytechlab/clm && docker compose exec openzca openzca auth login\"",
  });
}
