import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const congresso = searchParams.get("congresso");

    const supabase = createAdminClient();

    if (!congresso) {
      return NextResponse.json(
        { error: "Congresso não fornecido" },
        { status: 400 }
      );
    }

    // Buscar o contador do congresso específico
    const { data: counter, error } = await supabase
      .from("noite_solene_counter")
      .select("*")
      .eq("congresso", congresso)
      .single();

    if (error || !counter) {
      console.error("[v0] Erro ao buscar contador:", error);
      return NextResponse.json(
        { error: "Contador não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      total_confirmados: counter.total_confirmados || 0,
      limite_vagas: counter.limite_vagas || 75,
      congresso: counter.congresso,
    });
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
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { inscrito_id, congresso } = await request.json();
    const supabase = createAdminClient();

    if (!congresso) {
      return NextResponse.json(
        { error: "Congresso não fornecido" },
        { status: 400 }
      );
    }

    // Buscar o contador do congresso específico
    const { data: current, error: fetchError } = await supabase
      .from("noite_solene_counter")
      .select("*")
      .eq("congresso", congresso)
      .single();

    if (fetchError || !current) {
      console.error("[v0] Erro ao buscar contador:", fetchError);
      return NextResponse.json(
        { error: "Contador não encontrado" },
        { status: 404 }
      );
    }

    const novoTotal = current.total_confirmados + 1;
    const limiteVagas = current.limite_vagas || 75;
    const pode_participar = novoTotal <= limiteVagas;

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
      limite_vagas: limiteVagas,
      pode_participar,
      vagas_restantes: Math.max(0, limiteVagas - novoTotal),
      congresso,
    });
  } catch (error) {
    console.error("[v0] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
