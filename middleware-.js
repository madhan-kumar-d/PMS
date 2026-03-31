import { NextResponse } from "next/server";
import { verifyToken, getBearerToken } from "@/lib/auth";

export async function middleware(req) {
  const path = req.nextUrl.pathname;

  // Skip middleware for public routes
  const publicRoutes = ["/api/auth/login", "/api/register"];
  if (publicRoutes.includes(path) || path.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // For protected API routes, verify bearer token
  if (path.startsWith("/api/")) {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json(
        { message: "Missing bearer token" },
        { status: 401 },
      );
    }

    let user;
    try {
      user = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Attach user to request headers for route handlers to access
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", String(user.id));
    requestHeaders.set("x-user-role", user.role);
    requestHeaders.set("x-user", JSON.stringify(user));

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

// Middleware will run on all routes matching this pattern
export const config = {
  matcher: ["/api/:path*"],
};
