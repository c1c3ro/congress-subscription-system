import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { guestId, confirmed } = body

    const supabase = await createClient()

    const { data: guest } = await supabase.from("test_guests").select("*").eq("id", guestId).maybeSingle()

    if (!guest) {
      return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from("test_confirmations")
      .select("*")
      .eq("guest_id", guestId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from("test_confirmations")
        .update({
          status: confirmed ? "confirmed" : "declined",
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("guest_id", guestId)

      if (error) throw error
    } else {
      const { error } = await supabase.from("test_confirmations").insert({
        guest_id: guestId,
        guest_name: guest.name,
        status: confirmed ? "confirmed" : "declined",
        confirmed_at: new Date().toISOString(),
      })

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      confirmation: {
        guestId,
        confirmed,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Error in confirm API:", error)
    return NextResponse.json({ error: "Erro ao processar confirmação" }, { status: 500 })
  }
}
