import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
  maxAge: 360, // Turnstileの有効期限（5分）より、少しだけ長くする（6分）
  path: "/",
};

export async function createSessionCookie(value, sessionSecret) {
  const token = await new SignJWT(value)
    .setProtectedHeader({ alg: "HS256" })
    // Turnstileの有効期限（5分）より、少しだけ長くする（6分）
    .setExpirationTime("6m")
    .sign(sessionSecret);

  const cookieAttributes = [
    `Path=${COOKIE_OPTIONS.path}`,
    `HttpOnly=${COOKIE_OPTIONS.httpOnly ? "true" : ""}`,
    `Secure=${COOKIE_OPTIONS.secure ? "true" : ""}`,
    `SameSite=${COOKIE_OPTIONS.sameSite}`,
    `Max-Age=${COOKIE_OPTIONS.maxAge}`,
  ]
    .filter(Boolean) // 無効なプロパティを削除
    .join("; ");

  return `${COOKIE_NAME}=${token}; ${cookieAttributes}`;
}

async function validateSessionCookie(request, sessionSecret) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return false;

  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const token = match[1];
  try {
    const { payload } = await jwtVerify(token, sessionSecret);
    return payload.authenticated === true;
  } catch (e) {
    console.error('jwtVerify', e);
    return false;
  }
}

export async function verifySession(request, env) {
  const sessionSecret = new TextEncoder().encode(env.JWT_SECRET);
  return await validateSessionCookie(request, sessionSecret);
}