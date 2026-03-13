import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Buscar todas as inscrições
    const { data: inscritos, error: insritosError } = await supabase
      .from("inscricoes")
      .select("*")
      .order("created_at", { ascending: false })

    if (insritosError) throw insritosError

    // Buscar escolhas de workshops para cada inscrito
    const { data: escolhas, error: escolhasError } = await supabase
      .from("escolhas_inscrito")
      .select("inscrito_id, workshop_id, workshops(id, titulo, congresso)")

    if (escolhasError) throw escolhasError

    // Mapear escolhas por inscrito
    const escolhasMap = new Map()
    ;(escolhas || []).forEach((e: any) => {
      if (!escolhasMap.has(e.inscrito_id)) {
        escolhasMap.set(e.inscrito_id, [])
      }
      escolhasMap.get(e.inscrito_id).push({
        id: e.workshops.id,
        titulo: e.workshops.titulo,
        congresso: e.workshops.congresso,
      })
    })

    // Adicionar escolhas aos inscritos
    const inscritosComEscolhas = (inscritos || []).map((inscrito) => ({
      ...inscrito,
      workshops: escolhasMap.get(inscrito.id) || [],
    }))

    return NextResponse.json({
      inscritos: inscritosComEscolhas,
    })
  } catch (error) {
    console.error("Error fetching inscritos data:", error)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}
