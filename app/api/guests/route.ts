import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ guests: data || [] });
  } catch (error) {
    console.error("[v0] Error fetching guests:", error);
    return NextResponse.json({ error: "Erro ao buscar convidados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, companion } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("guests")
      .insert({ name, companion: companion || null })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ guest: data });
  } catch (error) {
    console.error("[v0] Error creating guest:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar convidado" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Remover confirmação associada se existir
    await supabase
      .from("confirmations")
      .delete()
      .eq("guest_id", id);

    // Remover convidado
    const { error } = await supabase
      .from("guests")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error deleting guest:", error);
    return NextResponse.json(
      { error: "Erro ao remover convidado" },
      { status: 500 }
    );
  }
}
