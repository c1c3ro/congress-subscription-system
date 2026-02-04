"use client"

import React from "react"

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type Congresso = "uti" | "utipedneo";

interface Inscricao {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  tipo_aluno: string;
  cidade_sao_camilo: string | null;
  area: string;
  area_outro: string | null;
  modalidade: string;
  hospital_parceiro: string | null;
  status_pagamento: string | null;
  participa_noite_solene: boolean;
  created_at: string;
  escolha: {
    workshop: string | null;
    participa_temas_livres: boolean;
  } | null;
}

interface Workshop {
  id: string;
  titulo: string;
  vagas_total: number;
  vagas_ocupadas: number;
}

interface Stats {
  total: number;
  estudantes: number;
  profissionais: number;
  parceiros: number;
  alunosNAD: number;
  alunosSaoCamilo: number;
}

const congressoNames: Record<Congresso, string> = {
  uti: "III Congresso de UTI",
  utipedneo: "III Congresso de UTI Pediátrica e Neonatal",
};

const congressoShortNames: Record<Congresso, string> = {
  uti: "UTI",
  utipedneo: "UTI Ped/Neo",
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedCongresso, setSelectedCongresso] = useState<Congresso | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [temasLivresTotal, setTemasLivresTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    estudantes: 0,
    profissionais: 0,
    parceiros: 0,
    alunosNAD: 0,
    alunosSaoCamilo: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [editingPaymentStatus, setEditingPaymentStatus] = useState<string | null>(null);
  const [editingInscricaoId, setEditingInscricaoId] = useState<string | null>(null);
  const [editingPaymentValue, setEditingPaymentValue] = useState<string>("");
  const [editingNoiteSoleneId, setEditingNoiteSoleneId] = useState<string | null>(null);
  const [noiteSoleneCounter, setNoiteSoleneCounter] = useState({ total_confirmados: 0, limite_vagas: 150 });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setError("Senha incorreta")
      }
    } catch (error) {
      setError("Erro ao autenticar")
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async (congresso: Congresso) => {
    try {
      const [inscricaoResponse, soleneResponse] = await Promise.all([
        fetch(`/api/inscricoes?congresso=${congresso}`),
        fetch(`/api/noite-solene`),
      ]);

      const inscricaoData = await inscricaoResponse.json();
      const soleneData = await soleneResponse.json();

      setInscricoes(inscricaoData.inscricoes || []);
      setWorkshops(inscricaoData.workshops || []);

      const qtdTemasLivres = (inscricaoData.inscricoes || []).filter(
        (inscrito: Inscricao) => inscrito.escolha?.participa_temas_livres === true
      ).length;
      
      setTemasLivresTotal(qtdTemasLivres);
      
      setNoiteSoleneCounter(soleneData);
      setStats(inscricaoData.stats || {
        total: 0,
        estudantes: 0,
        profissionais: 0,
        parceiros: 0,
        alunosNAD: 0,
        alunosSaoCamilo: 0,
      });
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleSelectCongresso = (congresso: Congresso) => {
    setSelectedCongresso(congresso);
    setFilter("all");
    loadData(congresso);
  };

  const handleSwitchCongresso = () => {
    const newCongresso = selectedCongresso === "uti" ? "utipedneo" : "uti";
    handleSelectCongresso(newCongresso);
  };

  const handleRemoveInscricao = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta inscrição?")) return;

    try {
      const response = await fetch(`/api/inscricoes?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok && selectedCongresso) {
        await loadData(selectedCongresso);
      } else {
        alert("Erro ao remover inscrição");
      }
    } catch (error) {
      console.error("Error removing inscription:", error);
      alert("Erro ao remover inscrição");
    }
  }

  const handleSavePaymentStatus = async (id: string) => {
    try {
      console.log("[v0] Salvando status de pagamento:", { id, status: editingPaymentValue });
      
      const response = await fetch(`/api/inscricoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_pagamento: editingPaymentValue }),
      });

      const responseData = await response.json();
      console.log("[v0] Resposta do servidor:", { status: response.status, data: responseData });

      if (response.ok && selectedCongresso) {
        console.log("[v0] Atualização bem-sucedida, recarregando dados");
        await loadData(selectedCongresso);
        setEditingInscricaoId(null);
        setEditingPaymentValue("");
      } else {
        console.error("[v0] Erro na resposta:", responseData);
        alert("Erro ao atualizar status de pagamento: " + (responseData.error || "desconhecido"));
      }
    } catch (error) {
      console.error("[v0] Erro na requisição:", error);
      alert("Erro ao atualizar status de pagamento: " + String(error));
    }
  }

  const startEditingPaymentStatus = (inscricao: Inscricao) => {
    setEditingInscricaoId(inscricao.id);
    setEditingPaymentValue(inscricao.status_pagamento || "");
  }

  const handleToggleNoiteSolene = async (inscricao: Inscricao) => {
    if (editingNoiteSoleneId === inscricao.id) return; // Evitar múltiplos cliques
    
    setEditingNoiteSoleneId(inscricao.id);
    
    try {
      const novoValor = !inscricao.participa_noite_solene;
      console.log("[v0] Alterando Noite Solene:", { id: inscricao.id, novoValor });
      
      const response = await fetch(`/api/inscricoes/${inscricao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participa_noite_solene: novoValor }),
      });

      const responseData = await response.json();
      console.log("[v0] Resposta do servidor:", { status: response.status, data: responseData });

      if (response.ok && selectedCongresso) {
        console.log("[v0] Atualização bem-sucedida, recarregando dados");
        await loadData(selectedCongresso);
      } else {
        console.error("[v0] Erro na resposta:", responseData);
        alert("Erro ao atualizar Noite Solene: " + (responseData.error || "desconhecido"));
      }
    } catch (error) {
      console.error("[v0] Erro na requisição:", error);
      alert("Erro ao atualizar Noite Solene: " + String(error));
    } finally {
      setEditingNoiteSoleneId(null);
    }
  }

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const getAreaLabel = (area: string, areaOutro: string | null) => {
    const areas: Record<string, string> = {
      enfermagem: "Enfermagem",
      fisioterapia: "Fisioterapia",
      medicina: "Medicina",
      nutricao: "Nutrição",
      outro: areaOutro || "Outro",
    };
    return areas[area] || area;
  };

  const getModalidadeLabel = (modalidade: string) => {
    const modalidades: Record<string, string> = {
      estudante: "Estudante",
      profissional: "Profissional",
      parceiro: "Parceiro",
    };
    return modalidades[modalidade] || modalidade;
  };

  const getTipoAlunoLabel = (tipo: string, cidade: string | null) => {
    if (tipo === "nao") return "Não";
    if (tipo === "nad") return "NAD";
    if (tipo === "sao_camilo") return `São Camilo${cidade ? ` - ${cidade}` : ""}`;
    return tipo;
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Tela de Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.webp"
              alt="Núcleo de Carreira em Saúde"
              width={300}
              height={90}
              className="w-full max-w-xs"
            />
          </div>

          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Painel Administrativo</h1>
            <p className="text-muted-foreground text-center mb-6 text-sm">Digite a senha para acessar</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Digite a senha"
                  required
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Seleção de Congresso
  if (!selectedCongresso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.webp"
              alt="Núcleo de Carreira em Saúde"
              width={300}
              height={90}
              className="w-full max-w-xs"
            />
          </div>

          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
              Selecione o Congresso
            </h1>
            <p className="text-muted-foreground text-center mb-8 text-sm">
              Escolha qual congresso você deseja gerenciar
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleSelectCongresso("uti")}
                className="p-6 rounded-xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all text-center group"
              >
                <div className="flex justify-center mb-4">
                  <Image
                    src="/logo-uti-adulto.webp"
                    alt="III Congresso de UTI"
                    width={200}
                    height={120}
                    className="w-full max-w-sm h-auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique para gerenciar inscrições
                </p>
              </button>

              <button
                onClick={() => handleSelectCongresso("utipedneo")}
                className="p-6 rounded-xl border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-all text-center group"
              >
                <div className="flex justify-center mb-4">
                  <Image
                    src="/logo-uti-ped-neo.webp"
                    alt="III Congresso de UTI Pediátrica e Neonatal"
                    width={200}
                    height={120}
                    className="w-full max-w-sm h-auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique para gerenciar inscrições
                </p>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <Button
                onClick={() => setIsAuthenticated(false)}
                variant="outline"
                className="w-full"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar inscrições
  const filteredInscricoes = inscricoes.filter((inscricao) => {
    if (filter === "all") return true;
    if (filter === "estudante") return inscricao.modalidade === "estudante";
    if (filter === "profissional") return inscricao.modalidade === "profissional";
    if (filter === "parceiro") return inscricao.modalidade === "parceiro";
    return true;
  });

  const copyToClipboard = (path: string) => {
  const url = `${window.location.origin}${path}`;
  navigator.clipboard.writeText(url);
  alert(`Link copiado: ${url}`); // Você pode substituir por um Toast se preferir
};

  // Dashboard do Congresso
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-muted">
      <div className="container mx-auto px-4 py-12 max-w-11/12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Image
              src={selectedCongresso === "uti" ? "/logo-uti-adulto.webp" : "/logo-uti-ped-neo.webp"}
              alt={congressoNames[selectedCongresso]}
              width={150}
              height={100}
              className="h-24 w-auto"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {congressoNames[selectedCongresso]}
              </h1>
              <p className="text-muted-foreground">
                Gerenciamento de inscrições
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-3">
            {/* Botão Copiar Inscrição */}
            <Button
              onClick={() => copyToClipboard(`/inscricao-${selectedCongresso}`)}
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copiar link de Inscrição
            </Button>

            {/* Botão Copiar Confirmação */}
            <Button
              onClick={() => copyToClipboard(`/confirmacao-${selectedCongresso}`)}
              variant="outline"
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Copiar link de Confirmação
            </Button>

            <Button
              onClick={handleSwitchCongresso}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Ir para {congressoShortNames[selectedCongresso === "uti" ? "utipedneo" : "uti"]}
            </Button>

            <Button
              onClick={() => setSelectedCongresso(null)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </Button>

            <Button
              onClick={() => {
                setIsAuthenticated(false);
                setSelectedCongresso(null);
              }}
              variant="outline"
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`bg-card rounded-xl p-4 border transition-all text-left ${
              filter === "all"
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
          >
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Inscritos</p>
          </button>

          <button
            onClick={() => setFilter("estudante")}
            className={`bg-card rounded-xl p-4 border transition-all text-left ${
              filter === "estudante"
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
          >
            <p className="text-2xl font-bold text-foreground">{stats.estudantes}</p>
            <p className="text-xs text-muted-foreground">Estudantes</p>
          </button>

          <button
            onClick={() => setFilter("profissional")}
            className={`bg-card rounded-xl p-4 border transition-all text-left ${
              filter === "profissional"
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
          >
            <p className="text-2xl font-bold text-foreground">{stats.profissionais}</p>
            <p className="text-xs text-muted-foreground">Profissionais</p>
          </button>

          <button
            onClick={() => setFilter("parceiro")}
            className={`bg-card rounded-xl p-4 border transition-all text-left ${
              filter === "parceiro"
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
          >
            <p className="text-2xl font-bold text-foreground">{stats.parceiros}</p>
            <p className="text-xs text-muted-foreground">Parceiros</p>
          </button>

          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{stats.alunosNAD}</p>
            <p className="text-xs text-muted-foreground">Alunos NAD</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{stats.alunosSaoCamilo}</p>
            <p className="text-xs text-muted-foreground">Alunos São Camilo</p>
          </div>
        </div>

        {/* Workshops e Temas Livres Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Workshops</h3>
            <div className="space-y-2">
              {workshops.map((workshop) => (
                <div key={workshop.id} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground truncate mr-2">{workshop.titulo}</span>
                  <span className="font-medium text-foreground whitespace-nowrap">
                    {workshop.vagas_ocupadas}/{workshop.vagas_total}
                  </span>
                </div>
              ))}
              {workshops.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum workshop cadastrado</p>
              )}
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Temas Livres</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">{temasLivresTotal}</p>
                <p className="text-xs text-muted-foreground">Participantes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Noite Solene Counter */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Noite Solene</h3>
              <p className="text-sm text-muted-foreground">Primeiras 150 inscrições confirmadas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{noiteSoleneCounter.total_confirmados}</p>
              <p className="text-sm text-muted-foreground">de {noiteSoleneCounter.limite_vagas} vagas</p>
              {noiteSoleneCounter.total_confirmados >= noiteSoleneCounter.limite_vagas && (
                <p className="text-xs text-pink-600 font-semibold mt-2">✓ COMPLETO</p>
              )}
            </div>
          </div>
          <div className="mt-4 bg-white rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (noiteSoleneCounter.total_confirmados / noiteSoleneCounter.limite_vagas) * 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Inscriptions Table */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Lista de Inscritos</h2>
                {filter !== "all" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Exibindo {filteredInscricoes.length} de {inscricoes.length} inscritos
                  </p>
                )}
              </div>
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpar filtro
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Inscrito</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Modalidade</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Pagamento</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Noite Solene</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInscricoes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhuma inscrição encontrada
                    </td>
                  </tr>
                ) : (
                  filteredInscricoes.map((inscrito) => (
                    <React.Fragment key={inscrito.id}>
                      <tr 
                        onClick={() => setExpandedId(expandedId === inscrito.id ? null : inscrito.id)}
                        className={`group cursor-pointer transition-colors hover:bg-muted/50 ${expandedId === inscrito.id ? 'bg-muted/30' : ''}`}
                      >
                        {/* Coluna Inscrito (Nome em destaque) */}
                        <td className="px-4 py-4">
                          <p className="font-bold text-primary text-sm leading-none">{inscrito.nome_completo}</p>
                          <p className="text-xs text-muted-foreground mt-1.5 font-medium">{formatCPF(inscrito.cpf)}</p>
                        </td>

                        {/* Coluna Modalidade (Cores por categoria) */}
                        <td className="px-4 py-4">
                          <span className={`text-sm font-semibold ${
                            inscrito.modalidade === 'profissional' ? 'bg-green-100 text-green-700' :
                            inscrito.modalidade === 'estudante' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {getModalidadeLabel(inscrito.modalidade)}
                            {inscrito.modalidade === "parceiro" && inscrito.hospital_parceiro && (
                              <span className="text-muted-foreground italic font-normal text-xs ml-1"> 
                                — {inscrito.hospital_parceiro}
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Coluna Status Pagamento (Clique para editar + Botão Cancelar) */}
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          {editingInscricaoId === inscrito.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                type="text"
                                value={editingPaymentValue}
                                onChange={(e) => setEditingPaymentValue(e.target.value)}
                                className="w-32 px-2 py-1 text-sm border border-primary rounded bg-background outline-none"
                              />
                              <button onClick={() => handleSavePaymentStatus(inscrito.id)} className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer" title="Salvar">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button onClick={() => setEditingInscricaoId(null)} className="p-1 text-destructive hover:bg-red-50 rounded cursor-pointer" title="Cancelar">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ) : (
                            <div 
                              onClick={() => { setEditingInscricaoId(inscrito.id); setEditingPaymentValue(inscrito.status_pagamento || ""); }}
                              className="inline-flex items-center gap-2 cursor-pointer hover:bg-muted px-2 py-1 -ml-2 rounded-md transition-colors group/edit"
                            >
                              <span className="text-sm text-foreground font-medium group-hover/edit:text-primary">
                                {inscrito.status_pagamento || "Pendente"}
                              </span>
                              <svg className="w-3 h-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </div>
                          )}
                        </td>

                        {/* Coluna Noite Solene */}
                        <td className="px-4 py-4 text-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleNoiteSolene(inscrito); }}
                            disabled={editingNoiteSoleneId === inscrito.id}
                            className={`p-2 rounded-full transition-all cursor-pointer hover:bg-muted inline-flex items-center justify-center ${inscrito.participa_noite_solene ? 'text-green-600' : 'text-muted-foreground/30'}`}
                          >
                            {inscrito.participa_noite_solene ? (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                          </button>
                        </td>

                        {/* Coluna Ações (Excluir) */}
                        <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleRemoveInscricao(inscrito.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>

                      {/* Área Detalhada */}
                      {expandedId === inscrito.id && (
                      <tr className="bg-muted/20">
                        <td colSpan={5} className="px-8 py-6 border-b border-border">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contato</h4>
                              <p className="text-sm text-foreground"><strong>E-mail:</strong> {inscrito.email}</p>
                              <p className="text-sm text-foreground"><strong>Telefone:</strong> {formatPhone(inscrito.telefone)}</p>
                              <p className="text-sm text-foreground"><strong>Inscrição:</strong> <p className="text-sm text-muted-foreground">
                          {new Date(inscricao.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inscricao.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p> </p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Acadêmico</h4>
                              <p className="text-sm text-foreground"><strong>Vínculo:</strong> {getTipoAlunoLabel(inscrito.tipo_aluno, inscrito.cidade_sao_camilo)}</p>
                              <p className="text-sm text-foreground"><strong>Área:</strong> {getAreaLabel(inscrito.area, inscrito.area_outro)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Preferências</h4>
                              <p className="text-sm text-foreground"><strong>Workshop:</strong> {inscrito.escolha?.workshop || "Nenhum"}</p>
                              <p className="text-sm text-foreground"><strong>Temas Livres:</strong> {inscrito.escolha?.participa_temas_livres ? "Sim" : "Não"}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
