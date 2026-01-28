"use client";

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setError("Senha incorreta");
      }
    } catch (error) {
      setError("Erro ao autenticar");
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async (congresso: Congresso) => {
    try {
      const response = await fetch(`/api/inscricoes?congresso=${congresso}`);
      const data = await response.json();
      setInscricoes(data.inscricoes || []);
      setWorkshops(data.workshops || []);
      setTemasLivresTotal(data.temasLivres?.total || 0);
      setStats(data.stats || {
        total: 0,
        estudantes: 0,
        profissionais: 0,
        parceiros: 0,
        alunosNAD: 0,
        alunosSaoCamilo: 0,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

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
      });

      if (response.ok && selectedCongresso) {
        await loadData(selectedCongresso);
      } else {
        alert("Erro ao remover inscrição");
      }
    } catch (error) {
      console.error("Error removing inscription:", error);
      alert("Erro ao remover inscrição");
    }
  };

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
            <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground text-center mb-6 text-sm">
              Digite a senha para acessar
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-2"
                >
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
    );
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectCongresso("uti")}
                className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  III Congresso de UTI
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gerenciar inscrições do Congresso de UTI
                </p>
              </button>

              <button
                onClick={() => handleSelectCongresso("utipedneo")}
                className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  III Congresso de UTI Pediátrica e Neonatal
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gerenciar inscrições do Congresso de UTI Pediátrica e Neonatal
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

  // Dashboard do Congresso
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-muted">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {congressoNames[selectedCongresso]}
            </h1>
            <p className="text-muted-foreground">
              Gerenciamento de inscrições
            </p>
          </div>
          <div className="flex items-center gap-3">
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
              className="flex items-center gap-2"
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

        {/* Inscriptions Table */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Lista de Inscritos
                </h2>
                {filter !== "all" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Exibindo {filteredInscricoes.length} de {inscricoes.length} inscritos
                  </p>
                )}
              </div>
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
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
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Aluno NAD/SC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Área
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Modalidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Workshop
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Temas Livres
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInscricoes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhuma inscrição encontrada
                    </td>
                  </tr>
                ) : (
                  filteredInscricoes.map((inscricao) => (
                    <tr key={inscricao.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground text-sm">{inscricao.nome_completo}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-muted-foreground">{formatCPF(inscricao.cpf)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-foreground">{inscricao.email}</p>
                        <p className="text-xs text-muted-foreground">{formatPhone(inscricao.telefone)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          {getTipoAlunoLabel(inscricao.tipo_aluno, inscricao.cidade_sao_camilo)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          {getAreaLabel(inscricao.area, inscricao.area_outro)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inscricao.modalidade === "estudante"
                            ? "bg-blue-100 text-blue-800"
                            : inscricao.modalidade === "profissional"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {getModalidadeLabel(inscricao.modalidade)}
                        </span>
                        {inscricao.hospital_parceiro && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {inscricao.hospital_parceiro}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {inscricao.escolha?.workshop ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {inscricao.escolha.workshop}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {inscricao.escolha?.participa_temas_livres ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Sim
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          {new Date(inscricao.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inscricao.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleRemoveInscricao(inscricao.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                          title="Remover inscrição"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
