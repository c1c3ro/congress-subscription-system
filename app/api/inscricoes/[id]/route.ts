import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const supabase = createAdminClient();
    const logs: string[] = [];

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

    if (isUpdatingNoiteSolene) {
      logs.push(`Alteração manual: Noite Solene mudou para ${data.participa_noite_solene}`);
      const { data: counters } = await supabase.from("noite_solene_counter").select("*").limit(1);
      
      if (counters && counters.length > 0) {
        const counter = counters[0];
        const change = data.participa_noite_solene ? 1 : -1;
        const finalTotal = Math.max(0, (counter.total_confirmados || 0) + change);

        const { error: updError } = await supabase
          .from("noite_solene_counter")
          .update({ total_confirmados: finalTotal })
          .eq("id", counter.id);

        if (!updError) logs.push(`Contador atualizado: ${counter.total_confirmados} -> ${finalTotal}`);
      }
    }

    return NextResponse.json({ success: true, data: result, debug_logs: logs });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logs: string[] = [];
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    logs.push(`Iniciando exclusão do ID: ${id}`);

    // 1. Buscar o inscrito para checar o status da Noite Solene
    const { data: inscrito, error: fetchError } = await supabase
      .from("inscricoes")
      .select("nome_completo, participa_noite_solene")
      .eq("id", id)
      .single();

    if (fetchError || !inscrito) {
      logs.push("ERRO: Inscrito não encontrado no banco antes da exclusão.");
      return NextResponse.json({ error: "Inscrito não encontrado", debug_logs: logs }, { status: 404 });
    }

    logs.push(`Inscrito encontrado: ${inscrito.nome_completo}`);
    logs.push(`Status participa_noite_solene: ${inscrito.participa_noite_solene}`);

    // 2. Decrementar contador se necessário
    if (inscrito.participa_noite_solene === true) {
      logs.push("Inscrito participa da Noite Solene. Buscando contador global...");
      
      const { data: counters, error: counterFetchErr } = await supabase
        .from("noite_solene_counter")
        .select("*")
        .limit(1);

      if (counterFetchErr) {
        logs.push(`ERRO ao buscar contador: ${counterFetchErr.message}`);
      } else if (counters && counters.length > 0) {
        const counter = counters[0];
        const novoTotal = Math.max(0, (counter.total_confirmados || 0) - 1);
        
        logs.push(`Contador atual encontrado. Total atual: ${counter.total_confirmados}. Novo total calculado: ${novoTotal}`);

        const { error: updateErr } = await supabase
          .from("noite_solene_counter")
          .update({ total_confirmados: novoTotal })
          .eq("id", counter.id);

        if (updateErr) {
          logs.push(`ERRO ao atualizar novo total: ${updateErr.message}`);
        } else {
          logs.push("Sucesso: Contador decrementado no banco.");
        }
      } else {
        logs.push("AVISO: Tabela noite_solene_counter está vazia.");
      }
    } else {
      logs.push("Inscrito NÃO participava da Noite Solene. Pulando decremento.");
    }

    // 3. Deletar o registro
    logs.push("Executando DELETE na tabela inscricoes...");
    const { error: deleteError } = await supabase
      .from("inscricoes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logs.push(`ERRO na exclusão final: ${deleteError.message}`);
      throw deleteError;
    }

    logs.push("Inscrito excluído com sucesso.");
    return NextResponse.json({ success: true, debug_logs: logs });

  } catch (error: any) {
    console.error("[v0] Erro completo:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error.message, debug_logs: logs },
      { status: 500 }
    );
  }
}
