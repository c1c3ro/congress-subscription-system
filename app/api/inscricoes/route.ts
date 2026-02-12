import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const supabase = await createClient();

    // Validar campos obrigatórios
    const requiredFields = [
      "congresso",
      "nome_completo",
      "cpf",
      "email",
      "telefone",
      "tipo_aluno",
      "area",
      "modalidade",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validar campos condicionais
    if (data.tipo_aluno === "sao_camilo" && !data.cidade_sao_camilo) {
      return NextResponse.json(
        { error: "Informe a cidade da São Camilo" },
        { status: 400 }
      );
    }

    if (data.area === "outro" && !data.area_outro) {
      return NextResponse.json(
        { error: "Informe sua área de atuação" },
        { status: 400 }
      );
    }

    if (data.modalidade === "parceiro" && !data.hospital_parceiro) {
      return NextResponse.json(
        { error: "Informe o hospital parceiro" },
        { status: 400 }
      );
    }

    // Inserir inscrição
    const { data: inscricao, error } = await supabase
      .from("inscricoes")
      .insert({
        congresso: data.congresso,
        nome_completo: data.nome_completo,
        cpf: data.cpf,
        email: data.email,
        telefone: data.telefone,
        tipo_aluno: data.tipo_aluno,
        cidade_sao_camilo: data.cidade_sao_camilo || null,
        area: data.area,
        area_outro: data.area_outro || null,
        modalidade: data.modalidade,
        hospital_parceiro: data.hospital_parceiro || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "CPF já cadastrado neste congresso" },
          { status: 409 }
        );
      }
      console.error("Erro ao inserir inscrição:", error);
      return NextResponse.json(
        { error: "Erro ao realizar inscrição" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, inscricao });
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const congresso = searchParams.get("congresso");

    if (!congresso || !["uti", "utipedneo"].includes(congresso)) {
      return NextResponse.json(
        { error: "Congresso inválido" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: inscricoes, error } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("congresso", congresso)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[v0] Erro ao buscar inscrições:", error);
      return NextResponse.json(
        { error: "Erro ao buscar inscrições", details: String(error) },
        { status: 500 }
      );
    }

    // Buscar escolhas com informações de workshops em uma única query
    const { data: escolhas } = await supabase
      .from("escolhas_inscrito")
      .select("inscrito_id, workshop_id, workshops(id, titulo)");

    const escolhasMap = new Map();
    (escolhas || []).forEach((e: any) => {
      escolhasMap.set(e.inscrito_id, {
        workshop: e.workshops?.titulo || null,
      });
    });

    const inscricoesComEscolhas = (inscricoes || []).map((inscricao) => ({
      ...inscricao,
      escolha: escolhasMap.get(inscricao.id) || null,
    }));

    // Buscar workshops com contagem de vagas
    const { data: workshops } = await supabase
      .from("workshops")
      .select("*")
      .eq("congresso", congresso);

    const { data: todasEscolhas } = await supabase
      .from("escolhas_inscrito")
      .select("workshop_id");

    const vagas_map = new Map();
    (todasEscolhas || []).forEach((e: any) => {
      vagas_map.set(e.workshop_id, (vagas_map.get(e.workshop_id) || 0) + 1);
    });

    const workshopsComVagas = (workshops || []).map((workshop) => ({
      ...workshop,
      vagas_ocupadas: vagas_map.get(workshop.id) || 0,
    }));

    // Calcular estatísticas
    const stats = {
      total: inscricoes?.length || 0,
      estudantes: inscricoes?.filter((i) => i.modalidade === "estudante").length || 0,
      profissionais: inscricoes?.filter((i) => i.modalidade === "profissional").length || 0,
      parceiros: inscricoes?.filter((i) => i.modalidade === "parceiro").length || 0,
      alunosNAD: inscricoes?.filter((i) => i.tipo_aluno === "nad").length || 0,
      alunosSaoCamilo: inscricoes?.filter((i) => i.tipo_aluno === "sao_camilo").length || 0,
    };

    return NextResponse.json({
      inscricoes: inscricoesComEscolhas,
      stats,
      workshops: workshopsComVagas,
    });
  } catch (error) {
    console.error("[v0] Erro na API GET inscrições:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
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
        { error: "ID não fornecido" },
        { status: 400 }
      );
    }

    // Usar cliente admin para operações administrativas
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("inscricoes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar inscrição:", error);
      return NextResponse.json(
        { error: "Erro ao deletar inscrição" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
