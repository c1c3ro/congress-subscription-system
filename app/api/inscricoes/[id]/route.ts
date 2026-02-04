import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  // 1. Atualize a tipagem aqui para indicar que params é uma Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 2. Adicione o 'await' antes de ler o params
    const { id } = await params;
    
    const data = await request.json();
    
    // Usar cliente admin para bypass RLS em operações administrativas
    const supabase = createAdminClient();

    // Preparar objeto de atualização apenas com campos fornecidos
    const updateData: any = {};
    if (data.status_pagamento !== undefined) {
      updateData.status_pagamento = data.status_pagamento;
    }
    if (data.participa_noite_solene !== undefined) {
      updateData.participa_noite_solene = data.participa_noite_solene;
    }

    const { data: result, error } = await supabase
      .from("inscricoes")
      .update(updateData)
      .eq("id", id) // Agora 'id' terá o valor correto (UUID)
      .select();

    if (error) {
      console.error("[v0] Erro ao atualizar inscrito:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar inscrito", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[v0] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}
