import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Retrieve native JWT auth token from cookies
  const authToken =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("test_auth_session")?.value;

  const isAuthenticated = Boolean(authToken);
  const isAuthRoute = pathname.startsWith("/login");
  const isPublicStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api") ||
    pathname.includes(".");

  // 1. Unauthenticated access to protected management dashboard routes
  if (!isAuthenticated && !isAuthRoute && !isPublicStatic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user attempting to visit login page
  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
