// AI Settings API — GET current settings, PUT to update

import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/cma/services/org-auth";
import { getAiSettings, saveAiSettings, maskApiKey } from "@/lib/ai-settings-service";

// GET /api/settings/ai — returns settings with masked API keys
export async function GET() {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  // Only root users can view AI settings
  if (auth.userRole !== "root" && auth.userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getAiSettings();
  return NextResponse.json({
    activeProvider: settings.activeProvider,
    gemini: { model: settings.gemini.model, apiKey: maskApiKey(settings.gemini.apiKey), hasKey: !!settings.gemini.apiKey },
    openai: { model: settings.openai.model, apiKey: maskApiKey(settings.openai.apiKey), hasKey: !!settings.openai.apiKey },
    claude: { model: settings.claude.model, apiKey: maskApiKey(settings.claude.apiKey), hasKey: !!settings.claude.apiKey },
    local: { model: settings.local.model, baseUrl: settings.local.baseUrl, apiKey: maskApiKey(settings.local.apiKey), hasKey: !!settings.local.apiKey },
    maxTokensAnalysis: settings.maxTokensAnalysis,
    maxTokensRewrite: settings.maxTokensRewrite,
  });
}

// PUT /api/settings/ai — update settings (only non-empty API keys overwrite)
export async function PUT(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  if (auth.userRole !== "root") {
    return NextResponse.json({ error: "Only root users can modify AI settings" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { activeProvider, gemini, openai, claude, local, maxTokensAnalysis, maxTokensRewrite } = body;

    // Build partial update — only include fields that were actually changed
    const updates: Record<string, unknown> = {};
    if (activeProvider) updates.activeProvider = activeProvider;
    if (gemini) {
      updates.gemini = {
        model: gemini.model || undefined,
        apiKey: gemini.apiKey || undefined, // empty string = don't update
      };
    }
    if (openai) {
      updates.openai = {
        model: openai.model || undefined,
        apiKey: openai.apiKey || undefined,
      };
    }
    if (claude) {
      updates.claude = {
        model: claude.model || undefined,
        apiKey: claude.apiKey || undefined,
      };
    }
    if (local) {
      updates.local = {
        model: local.model || undefined,
        apiKey: local.apiKey || undefined,
        baseUrl: local.baseUrl || undefined,
      };
    }
    if (maxTokensAnalysis !== undefined) updates.maxTokensAnalysis = Math.max(1, parseInt(maxTokensAnalysis) || 4096);
    if (maxTokensRewrite !== undefined) updates.maxTokensRewrite = Math.max(1, parseInt(maxTokensRewrite) || 16384);

    await saveAiSettings(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
