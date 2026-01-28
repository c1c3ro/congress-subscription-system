import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: guestsData, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: true })

    if (guestsError) throw guestsError

    const { data: confirmationsData, error: confirmationsError } = await supabase.from("confirmations").select("*")

    if (confirmationsError) throw confirmationsError

    const confirmed = confirmationsData?.filter((c) => c.status === "confirmed").length || 0
    const declined = confirmationsData?.filter((c) => c.status === "declined").length || 0
    const totalGuests = guestsData?.length || 0

    const attended = guestsData?.filter((g) => g.attended === true).length || 0

    // Pendentes = total de convidados - (confirmados + declinados)
    const pending = totalGuests - confirmed - declined

    const stats = {
      confirmed,
      declined,
      pending,
      attended,
    }

    const confirmations = (confirmationsData || []).map((c) => {
      const guest = guestsData?.find((g) => g.id === c.guest_id)
      return {
        guestId: c.guest_id,
        status: c.status,
        confirmed: c.status === "confirmed",
        timestamp: c.confirmed_at || c.created_at,
        attended: guest?.attended || false, // Add attended from guests table
      }
    })

    return NextResponse.json({
      guests: guestsData || [],
      confirmations,
      stats,
    })
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}
