import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("noite_solene_counter")
      .select("*")
      .single();

    if (error) {
      console.error("[v0] Erro ao buscar contador:", error);
      return NextResponse.json(
        { error: "Erro ao buscar contador" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { inscrito_id } = await request.json();
    const supabase = await createClient();

    // Incrementar contador
    const { data: current } = await supabase
      .from("noite_solene_counter")
      .select("*")
      .single();

    if (!current) {
      return NextResponse.json(
        { error: "Contador não encontrado" },
        { status: 404 }
      );
    }

    const novoTotal = current.total_confirmados + 1;
    const pode_participar = novoTotal <= current.limite_vagas;

    // Atualizar contador
    const { error: counterError } = await supabase
      .from("noite_solene_counter")
      .update({ total_confirmados: novoTotal })
      .eq("id", current.id);

    if (counterError) {
      console.error("[v0] Erro ao atualizar contador:", counterError);
      return NextResponse.json(
        { error: "Erro ao atualizar contador" },
        { status: 500 }
      );
    }

    // Marcar inscrito como participante da Noite Solene se pode participar
    if (pode_participar && inscrito_id) {
      const { error: inscricaoError } = await supabase
        .from("inscricoes")
        .update({ participa_noite_solene: true })
        .eq("id", inscrito_id);

      if (inscricaoError) {
        console.error("[v0] Erro ao atualizar inscrito:", inscricaoError);
      }
    }

    return NextResponse.json({
      total_confirmados: novoTotal,
      limite_vagas: current.limite_vagas,
      pode_participar,
      vagas_restantes: Math.max(0, current.limite_vagas - novoTotal),
    });
  } catch (error) {
    console.error("[v0] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
