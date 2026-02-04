"use client"

import React from "react"
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// ... (Interfaces e Constantes permanecem as mesmas)
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
  
  // NOVOS ESTADOS PARA MELHORIA VISUAL
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [editingInscricaoId, setEditingInscricaoId] = useState<string | null>(null);
  const [editingPaymentValue, setEditingPaymentValue] = useState<string>("");
  const [editingNoiteSoleneId, setEditingNoiteSoleneId] = useState<string | null>(null);
  const [noiteSoleneCounter, setNoiteSoleneCounter] = useState({ total_confirmados: 0, limite_vagas: 150 });

  // Funções de carregamento (mantidas do seu código original)
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
      setStats(inscricaoData.stats || { total: 0, estudantes: 0, profissionais: 0, parceiros: 0, alunosNAD: 0, alunosSaoCamilo: 0 });
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setIsLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (response.ok) setIsAuthenticated(true);
      else setError("Senha incorreta");
    } catch (error) { setError("Erro ao autenticar"); }
    finally { setIsLoading(false); }
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

  const handleSavePaymentStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/inscricoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_pagamento: editingPaymentValue }),
      });
      if (response.ok && selectedCongresso) {
        await loadData(selectedCongresso);
        setEditingInscricaoId(null);
      }
    } catch (error) { alert("Erro ao atualizar"); }
  }

  const handleToggleNoiteSolene = async (inscricao: Inscricao) => {
    if (editingNoiteSoleneId === inscricao.id) return;
    setEditingNoiteSoleneId(inscricao.id);
    try {
      const response = await fetch(`/api/inscricoes/${inscricao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participa_noite_solene: !inscricao.participa_noite_solene }),
      });
      if (response.ok && selectedCongresso) await loadData(selectedCongresso);
    } finally { setEditingNoiteSoleneId(null); }
  }

  const handleRemoveInscricao = async (id: string) => {
    if (!confirm("Remover inscrição?")) return;
    const response = await fetch(`/api/inscricoes?id=${id}`, { method: "DELETE" });
    if (response.ok && selectedCongresso) await loadData(selectedCongresso);
  }

  // Helpers de formatação
  const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  const formatPhone = (phone: string) => phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  const getAreaLabel = (area: string, areaOutro: string | null) => {
    const areas: Record<string, string> = { enfermagem: "Enfermagem", fisioterapia: "Fisioterapia", medicina: "Medicina", nutricao: "Nutrição", outro: areaOutro || "Outro" };
    return areas[area] || area;
  };
  const getTipoAlunoLabel = (tipo: string, cidade: string | null) => {
    if (tipo === "nao") return "Não";
    if (tipo === "nad") return "NAD";
    if (tipo === "sao_camilo") return `São Camilo${cidade ? ` - ${cidade}` : ""}`;
    return tipo;
  };

  const copyToClipboard = (path: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    alert(`Link copiado: ${url}`);
  };

  if (!isAuthenticated) return (
     <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Image src="/logo.webp" alt="Logo" width={300} height={90} className="w-full max-w-xs" />
          </div>
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            <h1 className="text-2xl font-bold text-center mb-6">Painel Administrativo</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border bg-background" placeholder="Senha" required />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" disabled={isLoading} className="w-full bg-secondary text-secondary-foreground">{isLoading ? "Entrando..." : "Entrar"}</Button>
            </form>
          </div>
        </div>
      </div>
  );

  if (!selectedCongresso) return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="flex justify-center mb-8"><Image src="/logo.webp" alt="Logo" width={300} height={90} className="w-full max-w-xs" /></div>
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            <h1 className="text-2xl font-bold text-center mb-8">Selecione o Congresso</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => handleSelectCongresso("uti")} className="p-6 rounded-xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all"><Image src="/logo-uti-adulto.webp" alt="UTI" width={200} height={120} className="w-full h-auto mb-4" /><p className="text-xs text-muted-foreground">Gerenciar UTI Adulto</p></button>
              <button onClick={() => handleSelectCongresso("utipedneo")} className="p-6 rounded-xl border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-all"><Image src="/logo-uti-ped-neo.webp" alt="PedNeo" width={200} height={120} className="w-full h-auto mb-4" /><p className="text-xs text-muted-foreground">Gerenciar UTI Ped/Neo</p></button>
            </div>
            <div className="mt-6 pt-6 border-t"><Button onClick={() => setIsAuthenticated(false)} variant="outline" className="w-full">Sair</Button></div>
          </div>
        </div>
      </div>
  );

  const filteredInscricoes = inscricoes.filter((i) => filter === "all" || i.modalidade === filter);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header Dinâmico */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Image src={selectedCongresso === "uti" ? "/logo-uti-adulto.webp" : "/logo-uti-ped-neo.webp"} alt="Logo" width={120} height={80} className="h-20 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{congressoNames[selectedCongresso]}</h1>
              <p className="text-slate-500 text-sm">Painel de Controle de Inscritos</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => copyToClipboard(`/inscricao-${selectedCongresso}`)} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
              Link Inscrição
            </Button>
            <Button onClick={() => copyToClipboard(`/confirmacao-${selectedCongresso}`)} variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
              Link Confirmação
            </Button>
            <Button onClick={handleSwitchCongresso} variant="outline" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              {congressoShortNames[selectedCongresso === "uti" ? "utipedneo" : "uti"]}
            </Button>
            <Button onClick={() => setSelectedCongresso(null)} variant="ghost">Menu</Button>
          </div>
        </div>

        {/* Stats Grid - Mantida */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
           <button onClick={() => setFilter("all")} className={`p-4 rounded-xl border bg-white transition-all text-left ${filter === "all" ? "ring-2 ring-primary border-primary" : "border-slate-200"}`}>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Total</p>
          </button>
          <button onClick={() => setFilter("estudante")} className={`p-4 rounded-xl border bg-white transition-all text-left ${filter === "estudante" ? "ring-2 ring-primary border-primary" : "border-slate-200"}`}>
            <p className="text-2xl font-bold text-blue-600">{stats.estudantes}</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Estudantes</p>
          </button>
          <button onClick={() => setFilter("profissional")} className={`p-4 rounded-xl border bg-white transition-all text-left ${filter === "profissional" ? "ring-2 ring-primary border-primary" : "border-slate-200"}`}>
            <p className="text-2xl font-bold text-green-600">{stats.profissionais}</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Profissionais</p>
          </button>
          <button onClick={() => setFilter("parceiro")} className={`p-4 rounded-xl border bg-white transition-all text-left ${filter === "parceiro" ? "ring-2 ring-primary border-primary" : "border-slate-200"}`}>
            <p className="text-2xl font-bold text-purple-600">{stats.parceiros}</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Parceiros</p>
          </button>
          <div className="p-4 rounded-xl border bg-white border-slate-200">
            <p className="text-2xl font-bold text-slate-700">{stats.alunosNAD}</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">NAD</p>
          </div>
          <div className="p-4 rounded-xl border bg-white border-slate-200">
            <p className="text-2xl font-bold text-slate-700">{stats.alunosSaoCamilo}</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">S. Camilo</p>
          </div>
        </div>

        {/* TABELA OTIMIZADA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Inscrito</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Modalidade</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Pagamento</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Solene</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInscricoes.map((inscrito) => (
                  <React.Fragment key={inscrito.id}>
                    {/* Linha Principal */}
                    <tr 
                      onClick={() => setExpandedId(expandedId === inscrito.id ? null : inscrito.id)}
                      className={`group cursor-pointer transition-colors hover:bg-slate-50/80 ${expandedId === inscrito.id ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${expandedId === inscrito.id ? 'bg-primary' : 'bg-slate-300'}`} />
                          <div>
                            <p className="font-semibold text-slate-800 leading-none">{inscrito.nome_completo}</p>
                            <p className="text-xs text-slate-400 mt-1">{formatCPF(inscrito.cpf)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          inscrito.modalidade === 'estudante' ? 'bg-blue-100 text-blue-700' :
                          inscrito.modalidade === 'profissional' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {inscrito.modalidade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {editingInscricaoId === inscrito.id ? (
                          <div className="flex items-center gap-1 justify-center" onClick={e => e.stopPropagation()}>
                            <input 
                              autoFocus
                              className="w-24 px-2 py-1 text-xs border rounded"
                              value={editingPaymentValue}
                              onChange={e => setEditingPaymentValue(e.target.value)}
                            />
                            <button onClick={() => handleSavePaymentStatus(inscrito.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">✓</button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingInscricaoId(inscrito.id); setEditingPaymentValue(inscrito.status_pagamento || ""); }}
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              inscrito.status_pagamento?.toLowerCase().includes("pago") 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {inscrito.status_pagamento || "Pendente"}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleNoiteSolene(inscrito); }}
                          disabled={editingNoiteSoleneId === inscrito.id}
                          className={`p-2 rounded-lg transition-colors ${inscrito.participa_noite_solene ? 'text-purple-600 bg-purple-50' : 'text-slate-300 hover:bg-slate-100'}`}
                        >
                          {inscrito.participa_noite_solene ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveInscricao(inscrito.id); }}
                          className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>

                    {/* Linha Detalhada (Expansível) */}
                    {expandedId === inscrito.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="px-12 py-6 border-b border-slate-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contato e Identificação</h4>
                              <p className="text-sm text-slate-600"><strong>E-mail:</strong> {inscrito.email}</p>
                              <p className="text-sm text-slate-600"><strong>Telefone:</strong> {formatPhone(inscrito.telefone)}</p>
                              <p className="text-sm text-slate-600"><strong>Inscrição em:</strong> {new Date(inscrito.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Formação Acadêmica</h4>
                              <p className="text-sm text-slate-600"><strong>Vínculo:</strong> {getTipoAlunoLabel(inscrito.tipo_aluno, inscrito.cidade_sao_camilo)}</p>
                              <p className="text-sm text-slate-600"><strong>Área:</strong> {getAreaLabel(inscrito.area, inscrito.area_outro)}</p>
                              <p className="text-sm text-slate-600"><strong>Hospital:</strong> {inscrito.hospital_parceiro || "N/A"}</p>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escolhas do Evento</h4>
                              <p className="text-sm text-slate-600">
                                <strong>Workshop:</strong> 
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                  {inscrito.escolha?.workshop || "Nenhum"}
                                </span>
                              </p>
                              <p className="text-sm text-slate-600">
                                <strong>Temas Livres:</strong> 
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${inscrito.escolha?.participa_temas_livres ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                  {inscrito.escolha?.participa_temas_livres ? "Sim" : "Não"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
