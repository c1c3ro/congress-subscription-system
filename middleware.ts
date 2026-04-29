import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "admin_session"

function base64urlToUint8Array(input: string): Uint8Array {
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/")
  const padded = base64 + "===".slice((base64.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function base64urlToString(input: string): string {
  return new TextDecoder().decode(base64urlToUint8Array(input))
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  const bytes = new Uint8Array(sig)
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}

async function isValidAdminSessionToken(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!token || !secret) return false
  const [body, signature] = token.split(".")
  if (!body || !signature) return false

  const expected = await hmacSha256Base64Url(secret, body)
  if (expected !== signature) return false

  try {
    const payload = JSON.parse(base64urlToString(body)) as { exp?: number }
    if (typeof payload?.exp !== "number") return false
    const now = Math.floor(Date.now() / 1000)
    return payload.exp > now
  } catch {
    return false
  }
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(url)
}

function sanitizeNextPath(next: string | null): string {
  if (!next) return "/"
  // Aceita somente paths locais (evita open-redirect e valores inválidos)
  if (!next.startsWith("/")) return "/"
  // Se vier com querystring, separa corretamente
  const [path, search = ""] = next.split("?")
  if (!path) return "/"
  return search ? `${path}?${search}` : path
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isLoginPage = pathname === "/login"
  const isAdminLoginApi = pathname === "/api/admin/login"
  const isAdminLogoutApi = pathname === "/api/admin/logout"
  const isProtectedPage = pathname === "/" || pathname.startsWith("/workshops") || pathname.startsWith("/identificador")
  const isAdminApi = pathname.startsWith("/api/admin")

  // Protect mutation endpoints used by admin UI.
  const isInscricaoMutation =
    pathname.startsWith("/api/inscricoes/") && (request.method === "PATCH" || request.method === "DELETE")
  const isNoiteSoleneMutation = pathname.startsWith("/api/noite-solene") && request.method === "POST"

  // Não proteger a própria rota de login/logout; ela precisa rodar para setar/remover cookie.
  const shouldCheckAuth =
    isProtectedPage ||
    (isAdminApi && !isAdminLoginApi && !isAdminLogoutApi) ||
    isInscricaoMutation ||
    isNoiteSoleneMutation ||
    isLoginPage

  if (!shouldCheckAuth) return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value
  const secret = process.env.ADMIN_AUTH_SECRET
  const authed = await isValidAdminSessionToken(token, secret)

  if (isLoginPage) {
    if (!authed) return NextResponse.next()
    const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"))
    const url = request.nextUrl.clone()
    const [nextPathname, nextSearch = ""] = next.split("?")
    url.pathname = nextPathname
    url.search = nextSearch ? `?${nextSearch}` : ""
    return NextResponse.redirect(url)
  }

  if (!authed) return redirectToLogin(request)
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/workshops/:path*",
    "/identificador/:path*",
    "/login",
    "/api/admin/:path*",
    "/api/inscricoes/:path*",
    "/api/noite-solene",
  ],
}

