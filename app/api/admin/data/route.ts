import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: guestsData, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: true });

    if (guestsError) throw guestsError;

    const { data: confirmationsData, error: confirmationsError } = await supabase
      .from("confirmations")
      .select("*")
      .order("created_at", { ascending: false });

    if (confirmationsError) throw confirmationsError;

    // Converter para o formato esperado pelo frontend
    const confirmations = (confirmationsData || []).map((c) => ({
      guestId: c.guest_id,
      confirmed: c.status === "confirmed",
      timestamp: c.confirmed_at || c.created_at,
    }));

    return NextResponse.json({ guests: guestsData || [], confirmations });
  } catch (error) {
    console.error("[v0] Error fetching data:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
