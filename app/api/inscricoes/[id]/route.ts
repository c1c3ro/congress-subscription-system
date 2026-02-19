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

    const updateData: any = {};
    if (data.status_pagamento !== undefined) updateData.status_pagamento = data.status_pagamento;
    if (data.participa_noite_solene !== undefined) updateData.participa_noite_solene = data.participa_noite_solene;
    if (data.workshops_adicionais !== undefined) updateData.workshops_adicionais = data.workshops_adicionais;

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // 1. Buscar dados do inscrito
    const { data: inscrito, error: fetchError } = await supabase
      .from("inscricoes")
      .select("participa_noite_solene")
      .eq("id", id)
      .single();

    if (fetchError || !inscrito) {
      return NextResponse.json({ error: "Inscrito não encontrado no banco" }, { status: 404 });
    }

    // 2. Se participava, decrementa ANTES de deletar
    if (inscrito.participa_noite_solene === true) {
      const { data: counters, error: cFetchError } = await supabase
        .from("noite_solene_counter")
        .select("*")
        .limit(1);

      if (cFetchError || !counters || counters.length === 0) {
        return NextResponse.json({ error: "Erro ao localizar tabela de contador" }, { status: 500 });
      }

      const counter = counters[0];
      const novoTotal = Math.max(0, (counter.total_confirmados || 0) - 1);

      const { error: updError } = await supabase
        .from("noite_solene_counter")
        .update({ total_confirmados: novoTotal })
        .eq("id", counter.id);

      if (updError) {
        return NextResponse.json({ error: "Falha ao decrementar contador", details: updError }, { status: 500 });
      }
    }

    // 3. Só deleta se o passo anterior deu certo (ou se não precisava decrementar)
    const { error: deleteError } = await supabase
      .from("inscricoes")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ 
      success: true, 
      info: "Inscrito removido e contador atualizado com sucesso" 
    });

  } catch (error: any) {
    console.error("Erro na API DELETE:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
