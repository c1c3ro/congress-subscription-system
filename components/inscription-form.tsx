"use client";

import React from "react"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCPF, validateCPF } from "@/lib/cpf";

interface InscriptionFormProps {
  congresso: "uti" | "utipedneo";
  congressoNome: string;
}

export function InscriptionForm({ congresso, congressoNome }: InscriptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [cpfError, setCpfError] = useState("");

  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    email: "",
    telefone: "",
    tipo_aluno: "",
    area: "",
    area_outro: "",
    modalidade: "",
    hospital_parceiro: "",
    quantidade_workshops: 1,
  });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let formattedValue: any = value;
    if (name === "cpf") {
      formattedValue = formatCPF(value);
      // Validar CPF quando completo
      if (formattedValue.replace(/\D/g, "").length === 11) {
        if (!validateCPF(formattedValue)) {
          setCpfError("CPF inválido");
        } else {
          setCpfError("");
        }
      } else {
        setCpfError("");
      }
    } else if (name === "telefone") {
      formattedValue = formatPhone(value);
    } else if (name === "quantidade_workshops") {
      formattedValue = Number(value);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar CPF antes de enviar
    if (!validateCPF(formData.cpf)) {
      setCpfError("CPF inválido");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          congresso,
          ...formData,
          cpf: formData.cpf.replace(/\D/g, ""),
          telefone: formData.telefone.replace(/\D/g, ""),
          cidade_sao_camilo: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao realizar inscrição");
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Inscrição Realizada!</h2>
        <p className="text-muted-foreground mb-6">
          Sua inscrição no {congressoNome} foi realizada com sucesso.
        </p>
        <p className="text-sm text-muted-foreground">
          Em breve você receberá mais informações da nossa equipe.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome Completo */}
      <div>
        <label htmlFor="nome_completo" className="block text-sm font-medium text-foreground mb-2">
          Nome Completo *
        </label>
        <input
          type="text"
          id="nome_completo"
          name="nome_completo"
          value={formData.nome_completo}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Digite seu nome completo"
          required
        />
      </div>

      {/* CPF */}
      <div>
        <label htmlFor="cpf" className="block text-sm font-medium text-foreground mb-2">
          CPF *
        </label>
        <input
          type="text"
          id="cpf"
          name="cpf"
          value={formData.cpf}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${cpfError ? "border-destructive" : "border-border"}`}
          placeholder="000.000.000-00"
          maxLength={14}
          required
        />
        {cpfError && (
          <p className="text-sm text-destructive mt-1">{cpfError}</p>
        )}
      </div>

      {/* E-mail */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          E-mail *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="seu@email.com"
          required
        />
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-foreground mb-2">
          Telefone *
        </label>
        <input
          type="text"
          id="telefone"
          name="telefone"
          value={formData.telefone}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="(00) 00000-0000"
          maxLength={15}
          required
        />
      </div>

      {/* Tipo de Aluno */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Você é aluno NAD? *
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="tipo_aluno"
              value="nad" // Mantivemos 'nad' para representar SIM
              checked={formData.tipo_aluno === "nad"}
              onChange={handleChange}
              className="w-4 h-4 text-primary focus:ring-primary/20"
              required
            />
            <span className="text-foreground">Sim</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="tipo_aluno"
              value="nao"
              checked={formData.tipo_aluno === "nao"}
              onChange={handleChange}
              className="w-4 h-4 text-primary focus:ring-primary/20"
              required
            />
            <span className="text-foreground">Não</span>
          </label>
        </div>
      </div>

      {/* Área */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Área *
        </label>
        <div className="space-y-2">
          {[
            { value: "enfermagem", label: "Enfermagem" },
            { value: "fisioterapia", label: "Fisioterapia" },
            { value: "medicina", label: "Medicina" },
            { value: "nutricao", label: "Nutrição" },
            { value: "outro", label: "Outro" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="area"
                value={option.value}
                checked={formData.area === option.value}
                onChange={handleChange}
                className="w-4 h-4 text-primary focus:ring-primary/20"
                required
              />
              <span className="text-foreground">{option.label}</span>
            </label>
          ))}
        </div>

        {formData.area === "outro" && (
          <div className="mt-4 pl-7">
            <label htmlFor="area_outro" className="block text-sm font-medium text-foreground mb-2">
              Qual sua área? *
            </label>
            <input
              type="text"
              id="area_outro"
              name="area_outro"
              value={formData.area_outro}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Digite sua área"
              required
            />
          </div>
        )}
      </div>

      {/* Modalidade */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Qual sua modalidade? *
        </label>
        <div className="space-y-2">
          {[
            { value: "estudante", label: "Estudante" },
            { value: "profissional", label: "Profissional" },
            { value: "parceiro", label: "Parceiro" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="modalidade"
                value={option.value}
                checked={formData.modalidade === option.value}
                onChange={handleChange}
                className="w-4 h-4 text-primary focus:ring-primary/20"
                required
              />
              <span className="text-foreground">{option.label}</span>
            </label>
          ))}
        </div>

        {formData.modalidade === "parceiro" && (
          <div className="mt-4 pl-7">
            <label htmlFor="hospital_parceiro" className="block text-sm font-medium text-foreground mb-2">
              Qual hospital parceiro você trabalha? *
            </label>
            <input
              type="text"
              id="hospital_parceiro"
              name="hospital_parceiro"
              value={formData.hospital_parceiro}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Digite o nome do hospital"
              required
            />
          </div>
        )}
      </div>

      {/* Quantidade de Workshops */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Quantos workshops você irá fazer? *
        </label>
        <div className="space-y-2">
          {[
            { value: 1, label: "1 Workshop (1 incluso)" },
            { value: 2, label: "2 Workshops (1 incluso + 1 adicional)" },
            { value: 3, label: "3 Workshops (1 incluso + 2 adicionais)" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="quantidade_workshops"
                value={option.value}
                checked={formData.quantidade_workshops === option.value}
                onChange={handleChange}
                className="w-4 h-4 text-primary focus:ring-primary/20"
                required
              />
              <span className="text-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting || !!cpfError}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg"
      >
        {isSubmitting ? "Realizando inscrição..." : "Confirmar Inscrição"}
      </Button>
    </form>
  );
}
