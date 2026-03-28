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
  const isApiRoute = pathname.startsWith("/api/");

  // Allow auth API and public endpoints through
  if (isAuthApi || isPublicApi) return withRequestId(request, NextResponse.next());

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
