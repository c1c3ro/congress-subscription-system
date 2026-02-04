import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Correção para Next.js 15+ (await params)
    const { id } = await params;
    const data = await request.json();
    
    const supabase = createAdminClient();

    // 2. Preparar objeto de atualização do Inscrito
    const updateData: any = {};
    if (data.status_pagamento !== undefined) {
      updateData.status_pagamento = data.status_pagamento;
    }
    
    // Verificamos se houve mudança na noite solene
    const isUpdatingNoiteSolene = data.participa_noite_solene !== undefined;

    if (isUpdatingNoiteSolene) {
      updateData.participa_noite_solene = data.participa_noite_solene;
    }

    // 3. Atualizar o Inscrito
    const { data: result, error } = await supabase
      .from("inscricoes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[v0] Erro ao atualizar inscrito:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar inscrito", details: error },
        { status: 500 }
      );
    }

    // 4. Lógica para atualizar o CONTADOR (noite_solene_counter)
    // Se a noite solene foi alterada, precisamos atualizar o contador global
    if (isUpdatingNoiteSolene) {
      // Busca o contador atual (usando a mesma lógica do seu POST: pega o primeiro que encontrar)
      const { data: counters, error: fetchError } = await supabase
        .from("noite_solene_counter")
        .select("*")
        .limit(1);

      if (counters && counters.length > 0) {
        const counter = counters[0];
        
        // Se mudou para TRUE, soma 1. Se mudou para FALSE, subtrai 1.
        const change = data.participa_noite_solene ? 1 : -1;
        const novoTotal = (counter.total_confirmados || 0) + change;

        // Evita números negativos por segurança
        const finalTotal = novoTotal < 0 ? 0 : novoTotal;

        const { error: counterError } = await supabase
          .from("noite_solene_counter")
          .update({ total_confirmados: finalTotal })
          .eq("id", counter.id);

        if (counterError) {
          console.error("[v0] Erro ao atualizar contador da noite solene:", counterError);
          // Não retornamos erro 500 aqui para não "quebrar" a resposta se o aluno já foi atualizado
        } else {
          console.log("[v0] Contador atualizado para:", finalTotal);
        }
      }
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
