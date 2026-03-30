export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = async (
  err: { digest: string } & Error,
  _request: {
    path: string;
    method: string;
    _headers: { [key: string]: string };
  },
  _context: { routerKind: string; routePath: string; routeType: string; renderSource: string },
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, _request, _context);
};
