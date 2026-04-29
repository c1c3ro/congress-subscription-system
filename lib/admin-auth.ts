import crypto from "node:crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "admin_session"

type AdminSessionPayload = {
  email: string
  exp: number // unix seconds
}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function base64urlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
}

function base64urlDecodeToString(input: string): string {
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/")
  const padded = base64 + "===".slice((base64.length + 3) % 4)
  return Buffer.from(padded, "base64").toString("utf8")
}

function sign(data: string, secret: string): string {
  return base64urlEncode(crypto.createHmac("sha256", secret).update(data).digest())
}

export function createAdminSessionToken(payload: AdminSessionPayload): string {
  const secret = getEnv("ADMIN_AUTH_SECRET")
  const body = base64urlEncode(JSON.stringify(payload))
  const signature = sign(body, secret)
  return `${body}.${signature}`
}

export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
  const secret = process.env.ADMIN_AUTH_SECRET
  if (!secret) return null

  const [body, signature] = token.split(".")
  if (!body || !signature) return null

  const expected = sign(body, secret)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  if (!crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(base64urlDecodeToString(body)) as AdminSessionPayload
    if (!payload?.email || typeof payload.exp !== "number") return null
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) return null
    return payload
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyAdminSessionToken(token)
}

export function getAdminSessionCookieName(): string {
  return COOKIE_NAME
}

export function getAdminSessionTtlSeconds(): number {
  const raw = process.env.ADMIN_SESSION_TTL_SECONDS || "86400"
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return 86400
  return Math.floor(parsed)
}

export function getAdminCredentials(): { email: string; password: string } {
  return {
    email: getEnv("ADMIN_EMAIL"),
    password: getEnv("ADMIN_PASSWORD"),
  }
}

