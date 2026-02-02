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
  const { data: escolhaExistente } = await supabase
    .from("escolhas_inscrito")
    .select("*, workshops(*)")
    .eq("inscrito_id", inscrito.id)
    .maybeSingle();

  if (escolhaExistente) {
    return NextResponse.json({
      inscrito,
      escolhaExistente: {
        ...escolhaExistente,
        workshop: escolhaExistente.workshops,
      },
      jaEscolheu: true,
    });
  }

  // Buscar workshops do congresso do inscrito
  const { data: workshops, error: workshopsError } = await supabase
    .from("workshops")
    .select("*")
    .eq("congresso", inscrito.congresso)
    .order("titulo");

  if (workshopsError) {
    return NextResponse.json(
      { error: workshopsError.message },
      { status: 500 }
    );
  }

  // Contar vagas ocupadas por workshop
  const workshopsComVagas = await Promise.all(
    workshops.map(async (workshop) => {
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

  // Buscar vagas de Temas Livres
  const { data: temasLivres } = await supabase
    .from("temas_livres")
    .select("*")
    .eq("congresso", inscrito.congresso)
    .single();

  // Contar participantes de Temas Livres
  const { data: inscritosDoCongressoComEscolha } = await supabase
    .from("escolhas_inscrito")
    .select("inscrito_id, participa_temas_livres, inscricoes!inner(congresso)")
    .eq("participa_temas_livres", true)
    .eq("inscricoes.congresso", inscrito.congresso);

  const temasLivresOcupadas = inscritosDoCongressoComEscolha?.length || 0;

  return NextResponse.json({
    inscrito,
    workshops: workshopsComVagas,
    temasLivres: {
      ...temasLivres,
      vagas_ocupadas: temasLivresOcupadas,
      vagas_disponiveis: (temasLivres?.vagas_total || 3) - temasLivresOcupadas,
    },
    jaEscolheu: false,
  });
}

// POST - Salvar escolhas do inscrito
export async function POST(request: Request) {
  const body = await request.json();
  const { inscrito_id, workshop_id, participa_temas_livres } = body;

  if (!inscrito_id) {
    return NextResponse.json(
      { error: "ID do inscrito é obrigatório" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verificar se já existe escolha
  const { data: escolhaExistente } = await supabase
    .from("escolhas_inscrito")
    .select("*")
    .eq("inscrito_id", inscrito_id)
    .maybeSingle();

  if (escolhaExistente) {
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

  // Validar vagas do workshop se selecionado
  if (workshop_id) {
    const { data: workshop } = await supabase
      .from("workshops")
      .select("*")
      .eq("id", workshop_id)
      .single();

    if (!workshop) {
      return NextResponse.json(
        { error: "Workshop não encontrado" },
        { status: 404 }
      );
    }

    const { count: vagasOcupadas } = await supabase
      .from("escolhas_inscrito")
      .select("*", { count: "exact", head: true })
      .eq("workshop_id", workshop_id);

    if ((vagasOcupadas || 0) >= workshop.vagas_total) {
      return NextResponse.json(
        { error: "Este workshop não possui mais vagas disponíveis" },
        { status: 400 }
      );
    }
  }

  // Validar vagas de Temas Livres se selecionado
  if (participa_temas_livres) {
    const { data: temasLivres } = await supabase
      .from("temas_livres")
      .select("*")
      .eq("congresso", inscrito.congresso)
      .single();

    const { data: participantesTemasLivres } = await supabase
      .from("escolhas_inscrito")
      .select("inscrito_id, participa_temas_livres, inscricoes!inner(congresso)")
      .eq("participa_temas_livres", true)
      .eq("inscricoes.congresso", inscrito.congresso);

    const vagasOcupadasTL = participantesTemasLivres?.length || 0;

    if (vagasOcupadasTL >= (temasLivres?.vagas_total || 3)) {
      return NextResponse.json(
        { error: "Não há mais vagas disponíveis para Temas Livres" },
        { status: 400 }
      );
    }
  }

  // Inserir escolha
  const { data: novaEscolha, error } = await supabase
    .from("escolhas_inscrito")
    .insert({
      inscrito_id,
      workshop_id: workshop_id || null,
      participa_temas_livres: participa_temas_livres || false,
    })
    .select("*, workshops(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    escolha: {
      ...novaEscolha,
      workshop: novaEscolha.workshops,
    },
  });
}
