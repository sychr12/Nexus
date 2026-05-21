"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle, AlignLeft, CheckCircle2, FileText, Hash, MapPin } from "lucide-react";
import UnlocSelect from "../../components/UnlocSelect";
import { MemorandoForm as MemorandoFormType } from "../types/memorando";
import { criarMemorando } from "../services/memorando.service";

const COLORS = {
  primary: "#1F3A2E",
  accent: "#6B8E23",
  success: "#10B981",
  danger: "#DC2626",
  card: "#FAFAF7",
  border: "#D8DDD4",
  borderFocus: "#6B8E23",
  text: "#1E2A22",
  textLight: "#6E786F",
  inputBg: "#FDFDFC",
  hoverBg: "#F0F4EE",
};

interface Props {
  form: MemorandoFormType;
  setForm: (form: MemorandoFormType) => void;
  onSuccess?: () => void;
}

const initialForm: MemorandoFormType = {
  numero: "",
  descricao: "",
  unloc: "",
  memoEntrada: "",
};

interface FieldProps {
  label: string;
  icon: ReactNode;
  required?: boolean;
  children: ReactNode;
  error?: boolean;
}

function Field({ label, icon, required, children, error }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
        style={{ color: error ? COLORS.danger : COLORS.textLight }}
      >
        <span style={{ color: error ? COLORS.danger : COLORS.accent }}>{icon}</span>
        {label}
        {required && <span style={{ color: COLORS.danger }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function MemorandoForm({ form, setForm, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (field: keyof MemorandoFormType, value: string) => {
    setForm({ ...form, [field]: value });
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.numero.trim()) {
      setError("O campo Número é obrigatório");
      return false;
    }
    if (!form.unloc.trim()) {
      setError("O campo UNLOC é obrigatório");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError(null);
    try {
      await criarMemorando(form);
      setSuccess(true);
      setForm(initialForm);
      onSuccess?.();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar memorando");
    } finally {
      setIsLoading(false);
    }
  };

  const fieldStyle = (name: string) => ({
    backgroundColor: COLORS.inputBg,
    borderColor: focusedField === name ? COLORS.borderFocus : COLORS.border,
    color: COLORS.text,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focusedField === name ? `0 0 0 3px ${COLORS.accent}18` : "none",
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div
        className="rounded-3xl p-8 space-y-6 border"
        style={{
          backgroundColor: COLORS.card,
          borderColor: COLORS.border,
          boxShadow: "0 4px 24px rgba(31,58,46,0.08)",
        }}
      >
        <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: COLORS.border }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
            <FileText size={18} color="white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>
              Criar Memorando
            </h2>
            <p className="text-xs" style={{ color: COLORS.textLight }}>
              Preencha os campos abaixo
            </p>
          </div>
        </div>

        {error && (
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: "#FEF2F2", color: COLORS.danger, border: "1px solid #FECACA" }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}
          >
            <CheckCircle2 size={16} />
            Memorando criado com sucesso!
          </div>
        )}

        <Field label="Número" icon={<Hash size={12} />} required error={!!error && !form.numero.trim()}>
          <input
            type="text"
            placeholder="Ex: 001/2025"
            value={form.numero}
            onChange={(e) => handleChange("numero", e.target.value)}
            onFocus={() => setFocusedField("numero")}
            onBlur={() => setFocusedField(null)}
            className="w-full rounded-xl px-4 py-3 border text-sm"
            style={fieldStyle("numero")}
            disabled={isLoading}
          />
        </Field>

        <Field label="UNLOC" icon={<MapPin size={12} />} required error={!!error && !form.unloc.trim()}>
          <UnlocSelect
            value={form.unloc}
            onChange={(value) => handleChange("unloc", value)}
            placeholder="Selecione o município"
            error={!!error && !form.unloc.trim()}
            disabled={isLoading}
            colors={COLORS}
          />
        </Field>

        <Field label="Descrição" icon={<AlignLeft size={12} />}>
          <textarea
            placeholder="Descreva o objetivo do memorando..."
            value={form.descricao}
            onChange={(e) => handleChange("descricao", e.target.value)}
            onFocus={() => setFocusedField("descricao")}
            onBlur={() => setFocusedField(null)}
            rows={3}
            className="w-full rounded-xl px-4 py-3 border text-sm resize-none"
            style={fieldStyle("descricao")}
            disabled={isLoading}
          />
        </Field>

        <Field label="Memo Entrada" icon={<FileText size={12} />}>
          <textarea
            placeholder="Conteúdo do memo de entrada..."
            value={form.memoEntrada}
            onChange={(e) => handleChange("memoEntrada", e.target.value)}
            onFocus={() => setFocusedField("memoEntrada")}
            onBlur={() => setFocusedField(null)}
            rows={6}
            className="w-full rounded-xl px-4 py-3 border text-sm resize-none"
            style={fieldStyle("memoEntrada")}
            disabled={isLoading}
          />
        </Field>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200"
          style={{
            backgroundColor: isLoading ? COLORS.textLight : COLORS.primary,
            cursor: isLoading ? "not-allowed" : "pointer",
            letterSpacing: "0.03em",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.backgroundColor = COLORS.accent;
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.currentTarget.style.backgroundColor = COLORS.primary;
          }}
        >
          {isLoading ? "Criando memorando..." : "Criar Memorando"}
        </button>
      </div>
    </form>
  );
}
