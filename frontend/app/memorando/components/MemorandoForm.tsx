"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, AlignLeft, CheckCircle2, FileText, Hash, MapPin } from "lucide-react";
import UnlocSelect from "../../components/UnlocSelect";
import { getUnlocByCode } from "../../lib/unlocs";
import { MemorandoForm as MemorandoFormType } from "../types/memorando";
import { criarMemorando } from "../services/memorando.service";

const KEYFRAMES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
`;

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
  error?: boolean;
  children: ReactNode;
}

function Field({ label, icon, required, error, children }: FieldProps) {
  return (
    <div className="space-y-2" style={{ animation: "fadeUp .4s ease" }}>
      <label
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: error ? COLORS.danger : COLORS.textLight }}
      >
        {icon}
        {label}
        {required && <span className="text-sm" style={{ color: COLORS.danger }}>*</span>}
      </label>
      {children}
    </div>
  );
}

interface MemorandoFormProps {
  form: MemorandoFormType;
  setForm: (form: MemorandoFormType) => void;
  onSuccess?: () => void;
}

export default function MemorandoForm({ form, setForm, onSuccess }: MemorandoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!document.getElementById("memo-keyframes")) {
      const style = document.createElement("style");
      style.id = "memo-keyframes";
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  const getMunicipioName = (code: string): string => {
    if (!code) return "";
    return getUnlocByCode(code)?.municipio || code;
  };

  const formatDateBR = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const validateForm = (): boolean => {
    if (!form.numero.trim()) {
      setError("Informe o número do memorando.");
      return false;
    }

    if (!form.unloc.trim()) {
      setError("Escolha um município no campo UNLOC.");
      return false;
    }

    return true;
  };

  const handleChange = (field: keyof MemorandoFormType, value: string) => {
    setError(null);
    setSuccess(false);
    setForm({ ...form, [field]: value });
  };

  const fieldStyle = (name: string, hasError = false) => ({
    backgroundColor: COLORS.inputBg,
    borderColor: hasError
      ? COLORS.danger
      : focusedField === name
        ? COLORS.borderFocus
        : COLORS.border,
    color: COLORS.text,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focusedField === name ? `0 0 0 3px ${COLORS.accent}18` : "none",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      ...form,
      data: formatDateBR(new Date()),
      municipio: getMunicipioName(form.unloc),
    };

    try {
      setIsLoading(true);
      await criarMemorando(payload);
      setSuccess(true);
      setError(null);
      setForm(initialForm);
      onSuccess?.();
    } catch {
      setError("Erro ao criar memorando. Tente novamente mais tarde.");
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const numeroError = !!error && !form.numero.trim();
  const unlocError = !!error && !form.unloc.trim();

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div
        className="rounded-3xl p-8 space-y-6 border overflow-visible relative"
        style={{
          background: COLORS.card,
          borderColor: COLORS.border,
          animation: error ? "shake .35s ease" : "fadeUp .4s ease both",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: COLORS.border }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
            <FileText size={18} color="white" />
          </div>
          <div>
            <p className="text-xl font-semibold" style={{ color: COLORS.text }}>
              Novo Memorando
            </p>
            <p className="text-sm mt-1" style={{ color: COLORS.textLight }}>
              Preencha as informações abaixo para gerar o documento.
            </p>
          </div>
        </div>

        {success && (
          <div
            className="rounded-2xl p-3 text-sm font-medium flex items-center gap-2"
            style={{
              backgroundColor: "#ECFDF5",
              color: COLORS.success,
              border: "1px solid #BBF7D0",
              animation: "fadeUp .35s ease both",
            }}
          >
            <CheckCircle2 size={16} />
            Memorando criado com sucesso!
          </div>
        )}

        {error && (
          <div
            className="rounded-2xl p-3 text-sm font-medium flex items-center gap-2"
            style={{
              backgroundColor: "#FEF2F2",
              color: COLORS.danger,
              border: "1px solid #FECACA",
              animation: "fadeUp .35s ease both",
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <Field label="Número" icon={<Hash size={12} />} required error={numeroError}>
            <input
              type="text"
              placeholder="Ex: 001/2026"
              value={form.numero}
              onChange={(event) => handleChange("numero", event.target.value)}
              onFocus={() => setFocusedField("numero")}
              onBlur={() => setFocusedField(null)}
              className="w-full rounded-xl px-4 py-3 border text-sm"
              style={fieldStyle("numero", numeroError)}
              disabled={isLoading}
            />
          </Field>

          <Field label="UNLOC" icon={<MapPin size={12} />} required error={unlocError}>
            <UnlocSelect
              value={form.unloc}
              onChange={(value) => handleChange("unloc", value)}
              placeholder="Selecione o município"
              error={unlocError}
              disabled={isLoading}
              colors={COLORS}
            />
          </Field>

          <Field label="Descrição" icon={<AlignLeft size={12} />}>
            <textarea
              placeholder="Descreva o objetivo do memorando..."
              value={form.descricao}
              onChange={(event) => handleChange("descricao", event.target.value)}
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
              onChange={(event) => handleChange("memoEntrada", event.target.value)}
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
              opacity: isLoading ? 0.75 : 1,
            }}
            onMouseEnter={(event) => {
              if (!isLoading) event.currentTarget.style.backgroundColor = COLORS.accent;
            }}
            onMouseLeave={(event) => {
              if (!isLoading) event.currentTarget.style.backgroundColor = COLORS.primary;
            }}
          >
            {isLoading ? "Criando memorando..." : "Criar Memorando"}
          </button>
        </div>
      </div>
    </form>
  );
}
