import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// --- FUNÇÃO PATCH (Mantida exatamente como você tinha, com logs) ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const supabase = createAdminClient();

    const updateData: any = {};
    if (data.status_pagamento !== undefined) updateData.status_pagamento = data.status_pagamento;
    if (data.participa_noite_solene !== undefined) updateData.participa_noite_solene = data.participa_noite_solene;

    const { data: result, error } = await supabase
      .from("inscricoes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (data.participa_noite_solene !== undefined) {
      const { data: counters } = await supabase.from("noite_solene_counter").select("*").limit(1);
      if (counters && counters.length > 0) {
        const counter = counters[0];
        const change = data.participa_noite_solene ? 1 : -1;
        const finalTotal = Math.max(0, (counter.total_confirmados || 0) + change);
        await supabase.from("noite_solene_counter").update({ total_confirmados: finalTotal }).eq("id", counter.id);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// --- FUNÇÃO DELETE CORRIGIDA E VERBOSA ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const debug = [];
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    debug.push(`Tentando excluir ID: ${id}`);

    // 1. Verificar status antes de deletar
    const { data: inscrito, error: fErr } = await supabase
      .from("inscricoes")
      .select("nome_completo, participa_noite_solene")
      .eq("id", id)
      .single();

    if (fErr || !inscrito) {
      return NextResponse.json({ error: "Inscrito não encontrado", debug }, { status: 404 });
    }

    debug.push(`Inscrito: ${inscrito.nome_completo}, Noite Solene: ${inscrito.participa_noite_solene}`);

    // 2. Decrementar contador se ele participava (comparação explícita com true)
    if (inscrito.participa_noite_solene === true) {
      const { data: counters } = await supabase.from("noite_solene_counter").select("*");
      
      if (counters && counters.length > 0) {
        const counter = counters[0];
        const novoTotal = Math.max(0, (counter.total_confirmados || 0) - 1);
        
        const { error: uErr } = await supabase
          .from("noite_solene_counter")
          .update({ total_confirmados: novoTotal })
          .eq("id", counter.id);

        if (uErr) debug.push(`Erro ao atualizar contador: ${uErr.message}`);
        else debug.push(`Contador decrementado de ${counter.total_confirmados} para ${novoTotal}`);
      } else {
        debug.push("Aviso: Registro de contador não encontrado na tabela");
      }
    }

    // 3. Deletar inscrito
    const { error: dErr } = await supabase.from("inscricoes").delete().eq("id", id);
    if (dErr) throw dErr;

    // Retorna explicitamente o status para você ver no Network
    return NextResponse.json({ 
      success: true, 
      message: "Excluído e contador ajustado",
      debug_info: debug 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, debug }, { status: 500 });
  }
}
