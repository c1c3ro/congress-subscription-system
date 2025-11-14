import { NextResponse } from "next/server";
import { ADMIN_PASSWORD } from "@/lib/guests";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  } catch (error) {
    console.error("[v0] Login error:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
