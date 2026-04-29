import { NextResponse } from "next/server"
import {
  createAdminSessionToken,
  getAdminCredentials,
  getAdminSessionCookieName,
  getAdminSessionTtlSeconds,
} from "@/lib/admin-auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const expected = getAdminCredentials()

    if (email === expected.email && password === expected.password) {
      const ttlSeconds = getAdminSessionTtlSeconds()
      const exp = Math.floor(Date.now() / 1000) + ttlSeconds
      const token = createAdminSessionToken({ email, exp })

      const response = NextResponse.json({ success: true })
      response.cookies.set(getAdminSessionCookieName(), token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: ttlSeconds,
      })
      return response
    }

    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}
