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

interface Workshop {
  id: string;
  titulo: string;
  congresso: string;
  vagas_total: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
}

interface TemasLivres {
  id: string;
  congresso: string;
  vagas_total: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
}

interface Inscrito {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  congresso: string;
}

interface Escolha {
  id: string;
  workshop_id: string | null;
  participa_temas_livres: boolean;
  workshop?: {
    id: string;
    titulo: string;
  };
}

export default function ConfirmacaoUTIPage() {
  const [step, setStep] = useState<"cpf" | "escolha" | "confirmacao">("cpf");
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [inscrito, setInscrito] = useState<Inscrito | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [temasLivres, setTemasLivres] = useState<TemasLivres | null>(null);
  
  const [selectedWorkshop, setSelectedWorkshop] = useState<string | null>(null);
  const [participaTemasLivres, setParticipaTemasLivres] = useState(false);
  
  const [escolhaConfirmada, setEscolhaConfirmada] = useState<Escolha | null>(null);
  const [noiteSoleneInfo, setNoiteSoleneInfo] = useState<{
    pode_participar: boolean;
    total_confirmados: number;
    limite_vagas: number;
  } | null>(null);
  
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
        setWorkshops(data.workshops);
        setTemasLivres(data.temasLivres);
        setStep("escolha");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEscolhas = async () => {
    if (!inscrito) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inscrito_id: inscrito.id,
          workshop_id: selectedWorkshop,
          participa_temas_livres: participaTemasLivres,
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-2 border-green-200">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-6">
            <Image
              src={LOGO_URL || "/placeholder.svg"}
              alt={CONGRESSO_NOME}
              width={220}
              height={120}
              className="object-contain max-h-28"
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
                    className={`text-center text-lg ${cpfError ? "border-red-500" : ""}`}
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

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Escolha seu Workshop:
                </Label>
                
                {workshops.map((workshop) => {
                  const esgotado = workshop.vagas_disponiveis <= 0;
                  const selecionado = selectedWorkshop === workshop.id;

                  return (
                    <button
                      key={workshop.id}
                      onClick={() => !esgotado && setSelectedWorkshop(workshop.id)}
                      disabled={esgotado}
                      className={`
                        w-full p-4 rounded-lg border-2 text-left transition-all
                        ${esgotado 
                          ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60" 
                          : selecionado
                            ? "bg-[#7D1128]/10 border-[#7D1128]"
                            : "bg-white border-gray-200 hover:border-[#7D1128]/50"
                        }
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className={`font-medium ${esgotado ? "text-gray-500" : "text-foreground"}`}>
                            {workshop.titulo}
                          </p>
                          {esgotado && (
                            <p className="text-sm text-gray-400">VAGAS ENCERRADAS</p>
                          )}
                        </div>
                        {selecionado && !esgotado && (
                          <div className="w-5 h-5 rounded-full bg-[#7D1128] flex items-center justify-center">
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

              {temasLivres && (
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-base font-semibold">
                    Deseja participar dos Temas Livres?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Momento em que participantes apresentam seus trabalhos acadêmicos.
                  </p>

                  <div className="flex gap-3">
                    {temasLivres.vagas_disponiveis > 0 ? (
                      <>
                        <button
                          onClick={() => setParticipaTemasLivres(true)}
                          className={`
                            flex-1 p-3 rounded-lg border-2 transition-all
                            ${participaTemasLivres
                              ? "bg-[#7D1128]/10 border-[#7D1128]"
                              : "bg-white border-gray-200 hover:border-[#7D1128]/50"
                            }
                          `}
                        >
                          <p className="font-medium">Sim, quero participar</p>
                        </button>
                        <button
                          onClick={() => setParticipaTemasLivres(false)}
                          className={`
                            flex-1 p-3 rounded-lg border-2 transition-all
                            ${!participaTemasLivres
                              ? "bg-[#7D1128]/10 border-[#7D1128]"
                              : "bg-white border-gray-200 hover:border-[#7D1128]/50"
                            }
                          `}
                        >
                          <p className="font-medium">Não, obrigado</p>
                        </button>
                      </>
                    ) : (
                      <div className="w-full p-3 rounded-lg bg-gray-100 border-2 border-gray-200 opacity-60">
                        <p className="font-medium text-gray-500">Temas Livres</p>
                        <p className="text-xs text-gray-400">VAGAS ENCERRADAS</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <Button
                onClick={handleConfirmarEscolhas}
                disabled={loading || !selectedWorkshop}
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Workshop</p>
                  <p className="font-medium">
                    {escolhaConfirmada.workshop?.titulo || "Nenhum selecionado"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Temas Livres</p>
                  <p className="font-medium">
                    {escolhaConfirmada.participa_temas_livres ? "Participando" : "Não participando"}
                  </p>
                </div>
              </div>

              {noiteSoleneInfo && noiteSoleneInfo.pode_participar && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                  <div className="flex gap-3">
                    <div className="text-2xl">🎉</div>
                    <div className="text-left">
                      <p className="font-semibold text-purple-900 mb-1">
                        Parabéns!
                      </p>
                      <p className="text-sm text-purple-800">
                        Você é uma das <strong>primeiras 150 inscrições</strong> confirmadas e poderá participar da <strong>Noite Solene</strong> do congresso!
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
