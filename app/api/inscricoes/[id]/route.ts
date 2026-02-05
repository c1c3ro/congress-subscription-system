import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// --- FUNÇÃO PATCH (Para atualizações: Pagamento e Noite Solene) ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const supabase = createAdminClient();

    const updateData: any = {};
    if (data.status_pagamento !== undefined) {
      updateData.status_pagamento = data.status_pagamento;
    }
    
    const isUpdatingNoiteSolene = data.participa_noite_solene !== undefined;
    if (isUpdatingNoiteSolene) {
      updateData.participa_noite_solene = data.participa_noite_solene;
    }

    const { data: result, error } = await supabase
      .from("inscricoes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Atualiza contador na alteração manual
    if (isUpdatingNoiteSolene) {
      const { data: counters } = await supabase.from("noite_solene_counter").select("*").limit(1);
      if (counters && counters.length > 0) {
        const counter = counters[0];
        const change = data.participa_noite_solene ? 1 : -1;
        const finalTotal = Math.max(0, (counter.total_confirmados || 0) + change);

        await supabase
          .from("noite_solene_counter")
          .update({ total_confirmados: finalTotal })
          .eq("id", counter.id);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[v0] Erro no PATCH:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// --- NOVA FUNÇÃO DELETE (Para exclusão e ajuste do contador) ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // 1. Buscamos o inscrito ANTES de deletar para saber se ele contava na Noite Solene
    const { data: inscrito, error: fetchError } = await supabase
      .from("inscricoes")
      .select("participa_noite_solene")
      .eq("id", id)
      .single();

    if (fetchError || !inscrito) {
      return NextResponse.json({ error: "Inscrito não encontrado" }, { status: 404 });
    }

    // 2. Se o inscrito participava da Noite Solene, precisamos diminuir o contador global
    if (inscrito.participa_noite_solene) {
      const { data: counters } = await supabase
        .from("noite_solene_counter")
        .select("*")
        .limit(1);

      if (counters && counters.length > 0) {
        const counter = counters[0];
        // Diminuímos 1, garantindo que nunca fique menor que 0
        const novoTotal = Math.max(0, (counter.total_confirmados || 0) - 1);

        await supabase
          .from("noite_solene_counter")
          .update({ total_confirmados: novoTotal })
          .eq("id", counter.id);
          
        console.log("[API] Contador decrementado devido a exclusão. Novo total:", novoTotal);
      }
    }

    // 3. Agora sim, excluímos o registro do banco de dados
    const { error: deleteError } = await supabase
      .from("inscricoes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Erro ao excluir inscrito:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}
