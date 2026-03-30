import { createHmac } from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID not configured");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET not configured");
  return secret;
}

function getRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/callback";
}

function getStateSecret(): string {
  // Reuse the encryption key as HMAC secret
  const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY not configured");
  return key;
}

// ─── State CSRF Protection ─────────────────────────────────

interface StatePayload {
  userId: string;
  ts: number;
}

export function createSignedState(userId: string): string {
  const payload: StatePayload = { userId, ts: Date.now() };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = createHmac("sha256", getStateSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifySignedState(state: string): StatePayload | null {
  const parts = state.split(".");
  if (parts.length !== 2) return null;

  const [b64, sig] = parts;
  const expectedSig = createHmac("sha256", getStateSecret()).update(b64).digest("base64url");
  if (sig !== expectedSig) return null;

  const json = Buffer.from(b64, "base64url").toString("utf8");
  const payload = JSON.parse(json) as StatePayload;

  // Expire after 10 minutes
  if (Date.now() - payload.ts > 10 * 60 * 1000) return null;

  return payload;
}

// ─── Auth URL ──────────────────────────────────────────────

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// ─── Token Exchange ────────────────────────────────────────

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    _headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  return res.json() as Promise<GoogleTokens>;
}

export async function refreshAccessToken(refreshToken: string): Promise<Omit<GoogleTokens, "refresh_token">> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    _headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }

  return res.json();
}

// ─── Userinfo ──────────────────────────────────────────────

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    _headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google _user info");
  }

  return res.json() as Promise<GoogleUserInfo>;
}
