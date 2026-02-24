import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { guestId, attended, type = "guest" } = await request.json()

    if (!guestId || typeof attended !== "boolean") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const supabase = await createClient()

    // Determine which table to update based on type
    const table = type === "inscrito" ? "inscricoes" : "guests"

    const { data, error } = await supabase.from(table).update({ attended }).eq("id", guestId).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error updating attendance:", error)
    return NextResponse.json({ error: "Erro ao atualizar comparecimento" }, { status: 500 })
  }
}
