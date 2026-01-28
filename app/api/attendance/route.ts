import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { guestId, attended } = await request.json()

    if (!guestId || typeof attended !== "boolean") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.from("guests").update({ attended }).eq("id", guestId).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, guest: data })
  } catch (error) {
    console.error("Error updating attendance:", error)
    return NextResponse.json({ error: "Erro ao atualizar comparecimento" }, { status: 500 })
  }
}
