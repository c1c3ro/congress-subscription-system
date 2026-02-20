import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Buscar inscrito por CPF e congresso e retornar workshops disponíveis
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cpf = searchParams.get("cpf");
  const congresso = searchParams.get("congresso");

  if (!cpf) {
    return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
  }

  if (!congresso || !["uti", "utipedneo"].includes(congresso)) {
    return NextResponse.json({ error: "Congresso inválido" }, { status: 400 });
  }

  const supabase = await createClient();

  // Buscar inscrito pelo CPF e congresso específico
  const { data: inscrito, error: inscritoError } = await supabase
    .from("inscricoes")
    .select("*")
    .eq("cpf", cpf.replace(/\D/g, ""))
    .eq("congresso", congresso)
    .maybeSingle();

  if (inscritoError) {
    return NextResponse.json({ error: inscritoError.message }, { status: 500 });
  }

  if (!inscrito) {
    return NextResponse.json(
      { error: "CPF não encontrado neste congresso. Verifique se você está inscrito." },
      { status: 404 }
    );
  }

  // Verificar se já fez escolhas
  const { data: escolhasExistentes } = await supabase
    .from("escolhas_inscrito")
    .select("*, workshops(*)")
    .eq("inscrito_id", inscrito.id);

  if (escolhasExistentes && escolhasExistentes.length > 0) {
    return NextResponse.json({
      inscrito,
      escolhaExistente: {
        id: inscrito.id,
        workshop_ids: escolhasExistentes.map((e) => e.workshop_id).filter(Boolean),
        workshops: escolhasExistentes
          .filter((e) => e.workshops)
          .map((e) => ({
            id: e.workshops?.id,
            titulo: e.workshops?.titulo,
          })),
      },
      jaEscolheu: true,
    });
  }

  // Buscar workshops do congresso do inscrito
  const { data: workshops, error: workshopsError } = await supabase
    .from("workshops")
    .select("*")
    .eq("congresso", inscrito.congresso)
    .order("order", { ascending: true });

  if (workshopsError) {
    return NextResponse.json(
      { error: workshopsError.message },
      { status: 500 }
    );
  }

  // Filtrar workshops conforme seleção de adicionais
  // Sempre mostra workshops inclusos, mas mostra adicionais apenas se o usuário tem direito
  let workshopsFiltrados = workshops;
  if (inscrito.quantidade_workshops === 1) {
    // Se quantidade_workshops = 1, mostra apenas workshops inclusos
    workshopsFiltrados = workshops.filter((w) => w.tipo === 'inclusos');
  }
  // Se quantidade_workshops > 1, mostra todos

  // Contar vagas ocupadas por workshop
  const workshopsComVagas = await Promise.all(
    workshopsFiltrados.map(async (workshop) => {
      const { count } = await supabase
        .from("escolhas_inscrito")
        .select("*", { count: "exact", head: true })
        .eq("workshop_id", workshop.id);

      return {
        ...workshop,
        vagas_ocupadas: count || 0,
        vagas_disponiveis: workshop.vagas_total - (count || 0),
      };
    })
  );

  return NextResponse.json({
    inscrito,
    workshops: workshopsComVagas,
    jaEscolheu: false,
  });
}

// POST - Salvar escolhas do inscrito
export async function POST(request: Request) {
  const body = await request.json();
  const { inscrito_id, workshop_ids } = body;

  if (!inscrito_id) {
    return NextResponse.json(
      { error: "ID do inscrito é obrigatório" },
      { status: 400 }
    );
  }

  if (!workshop_ids || !Array.isArray(workshop_ids) || workshop_ids.length === 0) {
    return NextResponse.json(
      { error: "Pelo menos 1 workshop deve ser selecionado" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verificar se já existe escolha
  const { data: escolhasExistentes } = await supabase
    .from("escolhas_inscrito")
    .select("*")
    .eq("inscrito_id", inscrito_id);

  if (escolhasExistentes && escolhasExistentes.length > 0) {
    return NextResponse.json(
      { error: "Você já fez suas escolhas anteriormente." },
      { status: 400 }
    );
  }

  // Buscar dados do inscrito para validações
  const { data: inscrito } = await supabase
    .from("inscricoes")
    .select("*")
    .eq("id", inscrito_id)
    .single();

  if (!inscrito) {
    return NextResponse.json(
      { error: "Inscrito não encontrado" },
      { status: 404 }
    );
  }

  // Buscar todos os workshops selecionados
  const { data: workshopsData, error: workshopsError } = await supabase
    .from("workshops")
    .select("*")
    .in("id", workshop_ids);

  if (workshopsError) {
    return NextResponse.json(
      { error: "Erro ao buscar workshops" },
      { status: 500 }
    );
  }

  if (!workshopsData || workshopsData.length !== workshop_ids.length) {
    return NextResponse.json(
      { error: "Um ou mais workshops não foram encontrados" },
      { status: 404 }
    );
  }

  // Validar seleções
  const selecionadosInclusos = workshopsData.filter((w) => w.tipo === 'inclusos').length;
  const selecionadosAdicionais = workshopsData.filter((w) => w.tipo === 'adicionais').length;

  if (selecionadosInclusos !== 1) {
    return NextResponse.json(
      { error: "Você deve selecionar exatamente 1 workshop inclusos" },
      { status: 400 }
    );
  }

  const maxAdicionais = inscrito.quantidade_workshops - 1;
  if (selecionadosAdicionais > maxAdicionais) {
    return NextResponse.json(
      { error: `Você só pode selecionar até ${maxAdicionais} workshop(s) adicional(is)` },
      { status: 400 }
    );
  }

  // Validar conflitos de horário - não pode ter múltiplos workshops no mesmo slot (independente do tipo)
  const slots: Record<string, string> = {}; // formato: "slot" => workshop_id
  for (const workshop of workshopsData) {
    const slot = Math.floor(workshop.order / 3);
    const key = `${slot}`;
    if (slots[key]) {
      return NextResponse.json(
        { error: "Você não pode selecionar múltiplos workshops no mesmo horário" },
        { status: 400 }
      );
    }
    slots[key] = workshop.id;
  }

  // Validar vagas para cada workshop
  for (const workshop of workshopsData) {
    const { count: vagasOcupadas } = await supabase
      .from("escolhas_inscrito")
      .select("*", { count: "exact", head: true })
      .eq("workshop_id", workshop.id);

    if ((vagasOcupadas || 0) >= workshop.vagas_total) {
      return NextResponse.json(
        { error: `O workshop "${workshop.titulo}" não possui mais vagas disponíveis` },
        { status: 400 }
      );
    }
  }

  // Criar registros para cada workshop selecionado
  const escolhasArray = workshop_ids.map((wid) => ({
    inscrito_id,
    workshop_id: wid,
  }));

  const { error: insertError } = await supabase
    .from("escolhas_inscrito")
    .insert(escolhasArray);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Buscar as escolhas criadas com os dados dos workshops
  const { data: novasEscolhas, error: selectError } = await supabase
    .from("escolhas_inscrito")
    .select("*, workshops(*)")
    .eq("inscrito_id", inscrito_id);

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    escolha: {
      id: inscrito_id,
      workshop_ids: workshop_ids,
      workshops: novasEscolhas?.map((e) => ({
        id: e.workshops?.id,
        titulo: e.workshops?.titulo,
      })) || [],
    },
  });
}
