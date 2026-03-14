import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Honeypot paths — bots/scanners probe these, real users never hit them
const BLOCKED_PATHS = [
  "/.env", "/.git", "/.aws", "/.ssh",
  "/wp-admin", "/wp-login", "/wp-content", "/wordpress",
  "/phpMyAdmin", "/phpmyadmin", "/pma",
  "/admin.php", "/xmlrpc.php", "/wp-cron.php",
  "/cgi-bin", "/config.php", "/setup.php",
  "/.htaccess", "/.htpasswd", "/server-status",
  "/actuator", "/solr", "/console",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block honeypot/attack paths — return 404 (not 403, to avoid fingerprinting)
  if (BLOCKED_PATHS.some((p) => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - images/assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|swe-worker.*\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
