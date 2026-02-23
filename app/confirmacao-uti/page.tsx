"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import QRCode from "qrcode";
import { formatCPF, validateCPF } from "@/lib/cpf";

const CONGRESSO = "uti";
const CONGRESSO_NOME = "III Congresso de Terapia Intensiva";
const LOGO_URL = "/logo-uti-adulto.webp";
const COLOR_THEME = "green";

// Horários fictícios para os slots
const HORARIOS = [
  { slot: 0, dia: "Dia 24/04", horario: "08:00 - 12:00" },
  { slot: 1, dia: "Dia 24/04", horario: "14:00 - 18:00" },
  { slot: 2, dia: "Dia 26/04", horario: "14:00 - 18:00" },
];

interface Workshop {
  id: string;
  titulo: string;
  congresso: string;
  vagas_total: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
  tipo: "inclusos" | "adicionais";
  order: number;
}

interface WorkshopPorHorario {
  slotIndex: number;
  horario: string;
  workshops: Workshop[];
}

interface Inscrito {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  congresso: string;
  participa_noite_solene: boolean;
  quantidade_workshops: number;
}

interface Escolha {
  id: string;
  workshop_ids: string[];
  workshops: Array<{ id: string; titulo: string }>;
}

export default function ConfirmacaoPage() {
  const [step, setStep] = useState<"cpf" | "escolha" | "confirmacao">("cpf");
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inscrito, setInscrito] = useState<Inscrito | null>(null);
  const [workshopsAgrupados, setWorkshopsAgrupados] = useState<WorkshopPorHorario[]>([]);
  const [selectedWorkshops, setSelectedWorkshops] = useState<Set<string>>(new Set());
  const [escolhaConfirmada, setEscolhaConfirmada] = useState<Escolha | null>(null);
  const [noiteSoleneInfo, setNoiteSoleneInfo] = useState<any>(null);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);
    
    if (formatted.replace(/\D/g, "").length === 11) {
      if (!validateCPF(formatted)) {
        setCpfError("CPF inválido");
      } else {
        setCpfError("");
      }
    } else {
      setCpfError("");
    }
  };

  useEffect(() => {
    if (step === "confirmacao" && inscrito && qrCodeRef.current) {
      QRCode.toCanvas(
        qrCodeRef.current,
        inscrito.id,
        {
          width: 200,
          margin: 2,
          color: {
            dark: "#7D1128",
            light: "#FFFFFF",
          },
        }
      );
    }
  }, [step, inscrito]);

  // Agrupar workshops por horário (slot)
  const agruparWorkshops = (workshops: Workshop[]): WorkshopPorHorario[] => {
    const agrupados: WorkshopPorHorario[] = [];
    
    for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
      const workshopsDoSlot = workshops.filter((w) => {
        const slot = Math.floor(w.order / 3);
        return slot === slotIndex;
      });
      
      if (workshopsDoSlot.length > 0) {
        const horarioInfo = HORARIOS[slotIndex];
        agrupados.push({
          slotIndex,
          horario: `${horarioInfo.dia} - ${horarioInfo.horario}`,
          workshops: workshopsDoSlot.sort((a, b) => a.order - b.order),
        });
      }
    }
    
    return agrupados;
  };

  const handleBuscarInscrito = async () => {
    const cpfLimpo = cpf.replace(/\D/g, "");
    
    if (cpfLimpo.length !== 11) {
      setCpfError("Digite os 11 dígitos do CPF");
      return;
    }

    if (!validateCPF(cpf)) {
      setCpfError("CPF inválido");
      return;
    }

    setLoading(true);
    setError("");
    setCpfError("");

    try {
      const response = await fetch(`/api/workshops?cpf=${cpfLimpo}&congresso=${CONGRESSO}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao buscar inscrito");
        setLoading(false);
        return;
      }

      setInscrito(data.inscrito);

      if (data.jaEscolheu) {
        setEscolhaConfirmada(data.escolhaExistente);
        setStep("confirmacao");
      } else {
        setWorkshopsAgrupados(agruparWorkshops(data.workshops));
        setStep("escolha");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  // Validar se pode selecionar um workshop
  const podeSelecionar = (workshop: Workshop): boolean => {
    if (selectedWorkshops.has(workshop.id)) return true; // Já selecionado

    const totalSelecionados = selectedWorkshops.size;
    const selecionadosInclusos = Array.from(selectedWorkshops).filter((id) => {
      const w = workshopsAgrupados
        .flatMap((g) => g.workshops)
        .find((w) => w.id === id);
      return w?.tipo === "inclusos";
    }).length;
    const selecionadosAdicionais = totalSelecionados - selecionadosInclusos;

    // Validar tipo e quantidade
    if (workshop.tipo === "inclusos") {
      // Podem ter no máximo 1 workshop inclusos
      return selecionadosInclusos < 1;
    } else {
      // Podem ter no máximo quantidade_workshops - 1 adicionais
      return selecionadosAdicionais < ((inscrito?.quantidade_workshops || 1) - 1);
    }
  };

  // Checar se pode selecionar pela restrição de horário
  const temConflitoPorHorario = (workshopParaSelecionado: Workshop): boolean => {
    const slotDoNovo = Math.floor(workshopParaSelecionado.order / 3);

    for (const id of selectedWorkshops) {
      const workshopSelecionado = workshopsAgrupados
        .flatMap((g) => g.workshops)
        .find((w) => w.id === id);

      if (workshopSelecionado) {
        const slotSelecionado = Math.floor(workshopSelecionado.order / 3);
        
        // Se estão no mesmo slot (horário), não pode (independente do tipo)
        if (slotSelecionado === slotDoNovo) {
          return true;
        }
      }
    }

    return false;
  };

  const handleToggleWorkshop = (workshopId: string) => {
    const workshop = workshopsAgrupados
      .flatMap((g) => g.workshops)
      .find((w) => w.id === workshopId);

    if (!workshop) return;

    const novasSelecoes = new Set(selectedWorkshops);

    if (novasSelecoes.has(workshopId)) {
      novasSelecoes.delete(workshopId);
    } else {
      // Validar se pode adicionar
      if (!podeSelecionar(workshop)) {
        setError(`Você já selecionou o máximo de workshops ${workshop.tipo}.`);
        setTimeout(() => setError(""), 3000);
        return;
      }

      if (temConflitoPorHorario(workshop)) {
        setError("Você não pode selecionar múltiplos workshops no mesmo horário.");
        setTimeout(() => setError(""), 3000);
        return;
      }

      novasSelecoes.add(workshopId);
    }

    setSelectedWorkshops(novasSelecoes);
  };

  const handleConfirmarEscolhas = async () => {
    if (!inscrito) return;

    // Validar que tem pelo menos 1 inclusos
    const selecionadosInclusos = Array.from(selectedWorkshops).filter((id) => {
      const w = workshopsAgrupados
        .flatMap((g) => g.workshops)
        .find((w) => w.id === id);
      return w?.tipo === "inclusos";
    }).length;

    if (selecionadosInclusos === 0) {
      setError("Você precisa selecionar pelo menos 1 workshop inclusos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inscrito_id: inscrito.id,
          workshop_ids: Array.from(selectedWorkshops),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao confirmar escolhas");
        setLoading(false);
        return;
      }

      setEscolhaConfirmada(data.escolha);

      // Incrementar contador de Noite Solene
      try {
        const soleneResponse = await fetch("/api/noite-solene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inscrito_id: inscrito.id }),
        });
        const soleneData = await soleneResponse.json();
        setNoiteSoleneInfo(soleneData);
        console.log("[v0] Noite Solene atualizada:", soleneData);
      } catch (err) {
        console.error("[v0] Erro ao atualizar Noite Solene:", err);
      }

      setStep("confirmacao");
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  // Calcular disponibilidade de seleções
  const usedSelections = () => {
    const inclusos = Array.from(selectedWorkshops).filter((id) => {
      const w = workshopsAgrupados
        .flatMap((g) => g.workshops)
        .find((w) => w.id === id);
      return w?.tipo === "inclusos";
    }).length;
    const adicionais = selectedWorkshops.size - inclusos;
    return { inclusos, adicionais };
  };

  const selections = usedSelections();
  const maxAdicionais = (inscrito?.quantidade_workshops || 1) - 1;

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-green-200">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-6">
            <Image
              src={LOGO_URL || "/placeholder.svg"}
              alt={CONGRESSO_NOME}
              width={220}
              height={120}
              className="w-auto object-contain max-h-28"
            />
          </div>

          {step === "cpf" && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-green-700 font-semibold mb-2">
                  Confirmação de Presença
                </p>
                <p className="text-muted-foreground">
                  Digite seu CPF para acessar suas opções de workshop
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    maxLength={14}
                    className={`mt-4 text-center text-lg ${cpfError ? "border-red-500" : ""}`}
                  />
                  {cpfError && (
                    <p className="text-sm text-red-600 text-center mt-1">{cpfError}</p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600 text-center">{error}</p>
                )}

                <Button
                  onClick={handleBuscarInscrito}
                  disabled={loading || cpf.replace(/\D/g, "").length !== 11 || !!cpfError}
                  className="w-full bg-[#7D1128] hover:bg-[#5D0D1E] text-white"
                >
                  {loading ? "Buscando..." : "Continuar"}
                </Button>
              </div>
            </div>
          )}

          {step === "escolha" && inscrito && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-xl font-bold text-[#7D1128] mb-1">
                  Olá, {inscrito.nome_completo.split(" ")[0]}!
                </h1>
                <p className="text-sm text-muted-foreground">
                  {CONGRESSO_NOME}
                </p>
              </div>

              {/* Resumo de seleções */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Suas opções:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>1 workshop incluso</strong> (obrigatório)</li>
                  <li>• <strong>Até {maxAdicionais} workshop(s) adicional(is)</strong></li>
                  <li className="text-xs text-blue-700 mt-2">
                    ✓ Selecionados: {selections.inclusos}/1 incluso, {selections.adicionais}/{maxAdicionais} adicionais
                  </li>
                </ul>
              </div>

              {/* Workshops agrupados por horário */}
              <div className="space-y-6">
                {workshopsAgrupados.map((grupo) => (
                  <div key={grupo.slotIndex} className="space-y-3">
                    <h3 className="font-bold text-base text-foreground">
                      {grupo.horario}
                    </h3>
                    
                    <div className="space-y-2">
                      {grupo.workshops.map((workshop) => {
                        const esgotado = workshop.vagas_disponiveis <= 0;
                        const selecionado = selectedWorkshops.has(workshop.id);
                        const podeAdicionar = podeSelecionar(workshop) && !temConflitoPorHorario(workshop);
                        const temConflito = selectedWorkshops.size > 0 && temConflitoPorHorario(workshop);

                        let titleAttr = "";
                        if (esgotado) {
                          titleAttr = "Este workshop não possui mais vagas disponíveis";
                        } else if (temConflito) {
                          titleAttr = "Você já selecionou um workshop neste horário";
                        } else if (!podeAdicionar && selectedWorkshops.size > 0) {
                          titleAttr = "Você atingiu o limite de workshops deste tipo";
                        }

                        return (
                          <button
                            key={workshop.id}
                            onClick={() => handleToggleWorkshop(workshop.id)}
                            disabled={esgotado || (!selecionado && !podeAdicionar)}
                            title={titleAttr}
                            className={`
                              w-full p-4 rounded-lg border-2 text-left transition-all
                              ${esgotado 
                                ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60" 
                                : selecionado
                                  ? "bg-[#7D1128]/10 border-[#7D1128]"
                                  : !podeAdicionar && selectedWorkshops.size > 0
                                    ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
                                    : "bg-white border-gray-200 hover:border-[#7D1128]/50"
                              }
                            `}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium ${esgotado ? "text-gray-500" : "text-foreground"}`}>
                                    {workshop.titulo}
                                  </p>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    workshop.tipo === "inclusos"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}>
                                    {workshop.tipo === "inclusos" ? "Incluso" : "Adicional"}
                                  </span>
                                </div>
                                {esgotado && (
                                  <p className="text-sm text-gray-400 mt-1">VAGAS ENCERRADAS</p>
                                )}
                                {!esgotado && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {workshop.vagas_disponiveis} vagas disponíveis
                                  </p>
                                )}
                              </div>
                              {selecionado && !esgotado && (
                                <div className="w-5 h-5 rounded-full bg-[#7D1128] flex items-center justify-center shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded">{error}</p>
              )}

              <Button
                onClick={handleConfirmarEscolhas}
                disabled={loading || selections.inclusos === 0}
                className="w-full bg-[#7D1128] hover:bg-[#5D0D1E] text-white"
              >
                {loading ? "Confirmando..." : "Confirmar Escolhas"}
              </Button>
            </div>
          )}

          {step === "confirmacao" && inscrito && escolhaConfirmada && (
            <div className="space-y-6 text-center">
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-[#7D1128] mb-1">
                  Escolhas Confirmadas!
                </h1>
                <p className="text-sm text-muted-foreground">
                  {inscrito.nome_completo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {CONGRESSO_NOME}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-left">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Workshops Selecionados</p>
                  {escolhaConfirmada.workshops && escolhaConfirmada.workshops.length > 0 ? (
                    <ul className="space-y-2 mt-2">
                      {escolhaConfirmada.workshops.map((w) => (
                        <li key={w.id} className="font-medium text-foreground">
                          • {w.titulo}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-medium">Nenhum selecionado</p>
                  )}
                </div>
              </div>

              {noiteSoleneInfo && noiteSoleneInfo.pode_participar && (
                <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                  <div className="flex gap-3">
                    <div className="text-2xl">🎉</div>
                    <div className="text-left">
                      <p className="font-semibold text-purple-900 mb-1">
                        Parabéns!
                      </p>
                      <p className="text-sm text-purple-800">
                        Você é uma das <strong>primeiras 50 inscrições</strong> confirmadas e poderá participar da <strong>Noite Solene</strong> do congresso!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {inscrito.participa_noite_solene && (
                <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                  <div className="flex gap-3">
                    <div className="text-2xl">🎉</div>
                    <div className="text-left">
                      <p className="font-semibold text-purple-900 mb-1">
                        Parabéns!
                      </p>
                      <p className="text-sm text-purple-800">
                        Você é uma das <strong>primeiras 50 inscrições</strong> confirmadas e poderá participar da <strong>Noite Solene</strong> do congresso!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Apresente este QR Code na entrada do evento:
                </p>
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg shadow-sm border">
                    <canvas ref={qrCodeRef} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Guarde este link! Você pode acessá-lo novamente para ver suas escolhas e QR Code.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
