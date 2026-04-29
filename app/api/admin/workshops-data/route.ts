import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = await createClient();

    const [workshopsResult, inscricoesResult, escolhasResult] = await Promise.all([
      supabase.from("workshops").select("*").order("congresso", { ascending: true }).order("order", { ascending: true }),
      supabase.from("inscricoes").select("*").order("created_at", { ascending: false }),
      supabase
        .from("escolhas_inscrito")
        .select("inscrito_id, workshop_id, workshops(id, titulo, congresso)")
        .not("workshop_id", "is", null),
    ]);

    if (workshopsResult.error) {
      return NextResponse.json({ error: workshopsResult.error.message }, { status: 500 });
    }

    if (inscricoesResult.error) {
      return NextResponse.json({ error: inscricoesResult.error.message }, { status: 500 });
    }

    if (escolhasResult.error) {
      return NextResponse.json({ error: escolhasResult.error.message }, { status: 500 });
    }

    const inscricoes = inscricoesResult.data || [];
    const workshops = workshopsResult.data || [];
    const escolhas = escolhasResult.data || [];

    const inscricoesMap = new Map(
      inscricoes.map((inscricao: any) => [
        inscricao.id,
        {
          id: inscricao.id,
          nome_completo: inscricao.nome_completo,
          cpf: inscricao.cpf,
          email: inscricao.email,
          telefone: inscricao.telefone,
          congresso: inscricao.congresso,
          area: inscricao.area,
          modalidade: inscricao.modalidade,
          quantidade_workshops: inscricao.quantidade_workshops,
          created_at: inscricao.created_at,
        },
      ]),
    );

    const workshopInscritosMap = new Map<string, Map<string, any>>();
    const vagasOcupadas = new Map<string, number>();

    for (const escolha of escolhas) {
      const workshopId = escolha.workshop_id;
      const inscritoId = escolha.inscrito_id;
      const inscrito = inscricoesMap.get(inscritoId);

      if (!workshopId || !inscrito) continue;

      if (!workshopInscritosMap.has(workshopId)) {
        workshopInscritosMap.set(workshopId, new Map());
      }

      const workshopMap = workshopInscritosMap.get(workshopId)!;
      if (!workshopMap.has(inscritoId)) {
        workshopMap.set(inscritoId, inscrito);
      }

      vagasOcupadas.set(workshopId, (vagasOcupadas.get(workshopId) || 0) + 1);
    }

    const workshopsWithAttendees = workshops.map((workshop: any) => ({
      id: workshop.id,
      titulo: workshop.titulo,
      congresso: workshop.congresso,
      vagas_total: workshop.vagas_total,
      vagas_ocupadas: vagasOcupadas.get(workshop.id) || 0,
      inscritos: Array.from(workshopInscritosMap.get(workshop.id)?.values() || []),
    }));

    return NextResponse.json({ workshops: workshopsWithAttendees });
  } catch (error) {
    console.error("[v0] Error fetching workshops data:", error);
    return NextResponse.json({ error: "Erro ao buscar dados de workshops" }, { status: 500 });
  }
}
