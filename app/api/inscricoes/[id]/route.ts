import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    
    console.log("[v0] Atualizando inscrito:", id, "com status:", data.status_pagamento);
    
    const supabase = await createClient();

    const { data: result, error } = await supabase
      .from("inscricoes")
      .update({
        status_pagamento: data.status_pagamento,
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("[v0] Erro ao atualizar status de pagamento:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar status de pagamento", details: error },
        { status: 500 }
      );
    }

    console.log("[v0] Atualização bem-sucedida:", result);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[v0] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}
