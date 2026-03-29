import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@supabase/supabase-js";

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

// Cache for iframe domains to avoid DB queries on every request
let iframeDomainCache: string[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getIframeDomains(): Promise<string[]> {
  const now = Date.now();

  // Return cached domains if cache is still valid
  if (iframeDomainCache.length > 0 && now - lastCacheUpdate < CACHE_DURATION) {
    return iframeDomainCache;
  }

  try {
    // Create Supabase client for server-side use
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('iframe_whitelist')
      .select('domain')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching iframe whitelist:', error);
      return iframeDomainCache; // Return cached domains on error
    }

    // Update cache
    iframeDomainCache = data?.map(row => row.domain) || [];
    lastCacheUpdate = now;

    return iframeDomainCache;
  } catch (error) {
    console.error('Error in getIframeDomains:', error);
    return iframeDomainCache; // Return cached domains on error
  }
}

function buildCSPHeader(iframeDomains: string[]): string {
  // Base CSP policy from next.config.ts
  const basePolicy = {
    "default-src": "'self'",
    "script-src": "'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app",
    "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src": "'self' https://fonts.gstatic.com data:",
    "img-src": "'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://avatars.githubusercontent.com https://*.vercel.app",
    "connect-src": "'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://generativelanguage.googleapis.com https://api.resend.com https://*.sentry.io https://*.vercel.app https://vercel.live",
    "frame-src": "'self' https://vercel.live",
    "object-src": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "frame-ancestors": "'self'",
  };

  // Add dynamic iframe domains to frame-src
  if (iframeDomains.length > 0) {
    basePolicy["frame-src"] += " " + iframeDomains.join(" ");
  }

  // Convert to CSP header format
  return Object.entries(basePolicy)
    .map(([key, value]) => `${key} ${value}`)
    .join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block honeypot/attack paths — return 404 (not 403, to avoid fingerprinting)
  if (BLOCKED_PATHS.some((p) => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  // Get dynamic iframe domains and build CSP header
  const iframeDomains = await getIframeDomains();
  const cspHeader = buildCSPHeader(iframeDomains);

  // Skip auth check for public-only routes
  if (
    pathname.startsWith("/landing") ||
    pathname.startsWith("/designs") ||
    pathname.startsWith("/sign/") ||
    pathname.startsWith("/verify/") ||
    pathname.startsWith("/watch/") ||
    pathname.startsWith("/shared/") ||
    pathname.startsWith("/api/")
  ) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  }

  // Update session and add CSP header
  const response = await updateSession(request);
  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
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
