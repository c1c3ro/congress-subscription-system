import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get("id")

    if (!guestId) {
      return NextResponse.json({ error: "ID do convidado não fornecido" }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar informações do convidado
    const { data: guest, error: guestError } = await supabase.from("guests").select("*").eq("id", guestId).single()

    if (guestError || !guest) {
      return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 })
    }

    // Buscar confirmação do convidado
    const { data: confirmation } = await supabase
      .from("confirmations")
      .select("*")
      .eq("guest_id", guestId)
      .maybeSingle()

    return NextResponse.json({
      guest,
      confirmation: confirmation || null,
    })
  } catch (error) {
    console.error("[v0] Error fetching guest:", error)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}
