import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { inscritoId, attended } = await request.json()

    if (!inscritoId || typeof attended !== "boolean") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("inscricoes")
      .update({ attended })
      .eq("id", inscritoId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error updating attendance:", error)
    return NextResponse.json({ error: "Erro ao atualizar comparecimento" }, { status: 500 })
  }
}
