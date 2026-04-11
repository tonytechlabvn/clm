import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/** Add X-Request-ID header for request tracing */
function withRequestId(request: NextRequest, response: NextResponse): NextResponse {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  response.headers.set("x-request-id", requestId);
  return response;
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth");
  const isPublicApi = pathname === "/api/health" || pathname === "/api/ready";
  const isPublicPage = pathname === "/privacy-policy";
  const isWebhook = pathname.startsWith("/api/webhooks/");
  const isApiRoute = pathname.startsWith("/api/");
  const isCmaApi = pathname.startsWith("/api/cma/");
  // Image template Direct URLs are authCode-gated (public like og:image endpoints)
  // Pattern: /api/cma/image-templates/[id]/image
  const isImageTemplateDirectUrl =
    /^\/api\/cma\/image-templates\/[^/]+\/image$/.test(pathname);

  // Image template asset GET (editor-uploaded images used inside templates)
  // Public-by-obscurity: UUID filenames + orgId prefix. Same security model as
  // the Direct URL endpoint. POST uploads still go through the session-auth
  // branch below because the POST pattern has /assets with no extra segment
  // trailing it beyond that, but any GET requesting a file under assets/* is
  // public so Puppeteer can reach it during render without session cookies.
  const isImageTemplateAssetGet =
    request.method === "GET" &&
    /^\/api\/cma\/image-templates\/assets\/[^/]+\/[^/]+$/.test(pathname);

  // Allow auth API, public endpoints, public pages, webhooks, direct-URL images,
  // and public asset GETs through.
  if (
    isAuthApi ||
    isPublicApi ||
    isPublicPage ||
    isWebhook ||
    isImageTemplateDirectUrl ||
    isImageTemplateAssetGet
  )
    return withRequestId(request, NextResponse.next());

  // API key auth bypass — gated behind feature flag
  if (
    process.env.ENABLE_API_KEY_AUTH === "true" &&
    isCmaApi &&
    request.headers.get("authorization")?.startsWith("Bearer clm_")
  ) {
    const headers = new Headers(request.headers);
    // Anti-spoofing: strip any client-supplied x-auth-method before setting our own
    headers.delete("x-auth-method");
    headers.set("x-auth-method", "api-key");
    return withRequestId(
      request,
      NextResponse.next({ request: { headers } })
    );
  }

  // Not logged in via WordPress
  if (!token?.wpUser) {
    if (isLoginPage) return withRequestId(request, NextResponse.next());
    if (isApiRoute) {
      return withRequestId(request, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }
    const loginUrl = new URL("/login", request.url);
    return withRequestId(request, NextResponse.redirect(loginUrl));
  }

  // Deactivated user
  if (token.isActive === false) {
    if (isLoginPage) return withRequestId(request, NextResponse.next());
    if (isApiRoute) {
      return withRequestId(request, NextResponse.json({ error: "Account deactivated" }, { status: 403 }));
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "AccountDeactivated");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    return withRequestId(request, response);
  }

  // Logged in but on login page — redirect to admin
  if (isLoginPage) {
    return withRequestId(request, NextResponse.redirect(new URL("/admin", request.url)));
  }

  // Admin route protection — only "root" or "admin" roles
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (token?.role !== "admin" && token?.role !== "root") {
      if (pathname.startsWith("/api/admin")) {
        return withRequestId(request, NextResponse.json({ error: "Forbidden" }, { status: 403 }));
      }
      return withRequestId(request, NextResponse.redirect(new URL("/login", request.url)));
    }
  }

  return withRequestId(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|uploads).*)"],
};
