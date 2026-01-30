import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    const supabase = await createClient();

    const { error } = await supabase
      .from("inscricoes")
      .update({
        status_pagamento: data.status_pagamento,
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar status de pagamento:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar status de pagamento" },
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
