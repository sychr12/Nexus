"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown, FileText, MapPin, Hash, AlignLeft, CheckCircle2, AlertCircle } from "lucide-react";
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

const UNLOC_CODES: Record<string, string> = {
  "Alvarães": "ALV", "Amaturá": "AMT", "Anamã": "ANA", "Anori": "ANO",
  "Apuí": "APU", "Atalaia do Norte": "ATN", "Autazes": "AUT", "Barcelos": "BAR",
  "Barreirinha": "BRR", "Benjamin Constant": "BCT", "Beruri": "BER",
  "Boa Vista do Ramos": "BVR", "Boca do Acre": "BAC", "Borba": "BOR",
  "Caapiranga": "CAP", "Canutama": "CAN", "Carauari": "CAR", "Careiro": "CAI",
  "Careiro da Várzea": "CAV", "Coari": "COA", "Codajás": "COD",
  "Eirunepé": "EIR", "Envira": "ENV", "Fonte Boa": "FBO", "Guajará": "GUA",
  "Humaitá": "HUM", "Ipixuna": "IPI", "Iranduba": "IRA", "Itacoatiara": "ITA",
  "Itamarati": "ITM", "Itapiranga": "ITP", "Japurá": "JAP", "Juruá": "JUR",
  "Jutaí": "JUT", "Lábrea": "LAB", "Manacapuru": "MAN", "Manaquiri": "MAQ",
  "Manaus": "MAO", "Manicoré": "MCO", "Maraã": "MAR", "Maués": "MAU",
  "Nhamundá": "NHA", "Nova Olinda do Norte": "NON", "Novo Airão": "NAI",
  "Novo Aripuanã": "NAR", "Parintins": "PAR", "Pauini": "PAU",
  "Presidente Figueiredo": "PFIG", "Rio Preto da Eva": "RPE",
  "Santa Isabel do Rio Negro": "SIRN", "Santo Antônio do Içá": "SAI",
  "São Gabriel da Cachoeira": "SGC", "São Paulo de Olivença": "SPOL",
  "São Sebastião do Uatumã": "SSU", "Silves": "SIL", "Tabatinga": "TAB",
  "Tapauá": "TAP", "Tefé": "TEF", "Tonantins": "TON", "Uarini": "UAR",
  "Urucará": "URC", "Urucurituba": "URU",
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
  const [isUnlocOpen, setIsUnlocOpen] = useState(false);
  const [unlocSearch, setUnlocSearch] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUnlocOpen(false);
        setUnlocSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const unlocOptions = Object.entries(UNLOC_CODES)
    .map(([municipio, sigla]) => ({ label: `${sigla} — ${municipio}`, value: sigla, municipio }))
    .filter(opt =>
      unlocSearch === "" ||
      opt.municipio.toLowerCase().includes(unlocSearch.toLowerCase()) ||
      opt.value.toLowerCase().includes(unlocSearch.toLowerCase())
    );

  const selectedLabel = form.unloc
    ? Object.entries(UNLOC_CODES)
        .map(([m, s]) => ({ label: `${s} — ${m}`, value: s }))
        .find(o => o.value === form.unloc)?.label
    : null;

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
        {/* Header */}
        <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: COLORS.border }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: COLORS.primary }}
          >
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

        {/* Alerts */}
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

        {/* Número */}
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

        {/* UNLOC Dropdown */}
        <Field label="UNLOC" icon={<MapPin size={12} />} required error={!!error && !form.unloc.trim()}>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => { setIsUnlocOpen(!isUnlocOpen); setUnlocSearch(""); }}
              className="w-full rounded-xl px-4 py-3 border text-sm flex items-center justify-between"
              style={{
                ...fieldStyle("unloc"),
                boxShadow: isUnlocOpen ? `0 0 0 3px ${COLORS.accent}18` : "none",
                borderColor: isUnlocOpen ? COLORS.borderFocus : COLORS.border,
              }}
              disabled={isLoading}
            >
              <span style={{ color: selectedLabel ? COLORS.text : COLORS.textLight }}>
                {selectedLabel || "Selecione o município"}
              </span>
              <ChevronDown
                size={15}
                style={{
                  color: COLORS.textLight,
                  transform: isUnlocOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {isUnlocOpen && (
              <div
                className="absolute z-20 w-full mt-1.5 rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: COLORS.inputBg,
                  borderColor: COLORS.borderFocus,
                  boxShadow: "0 8px 32px rgba(31,58,46,0.14)",
                }}
              >
                {/* Search inside dropdown */}
                <div className="p-2 border-b" style={{ borderColor: COLORS.border }}>
                  <input
                    type="text"
                    placeholder="Buscar município..."
                    value={unlocSearch}
                    onChange={(e) => setUnlocSearch(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm border"
                    style={{
                      backgroundColor: "#F5F7F3",
                      borderColor: COLORS.border,
                      color: COLORS.text,
                      outline: "none",
                    }}
                    autoFocus
                  />
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {unlocOptions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-center" style={{ color: COLORS.textLight }}>
                      Nenhum resultado encontrado
                    </div>
                  ) : (
                    unlocOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleChange("unloc", option.value);
                          setIsUnlocOpen(false);
                          setUnlocSearch("");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                        style={{
                          color: COLORS.text,
                          backgroundColor: form.unloc === option.value ? `${COLORS.accent}14` : "transparent",
                          fontWeight: form.unloc === option.value ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (form.unloc !== option.value)
                            (e.currentTarget as HTMLElement).style.backgroundColor = COLORS.hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          if (form.unloc !== option.value)
                            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                        }}
                      >
                        <span style={{ color: COLORS.accent, fontWeight: 700, marginRight: 6 }}>
                          {option.value}
                        </span>
                        {option.municipio}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </Field>

        {/* Descrição */}
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

        {/* Memo Entrada */}
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

        {/* Submit */}
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
            if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = COLORS.accent;
          }}
          onMouseLeave={(e) => {
            if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = COLORS.primary;
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
              </svg>
              Criando memorando...
            </span>
          ) : (
            "Criar Memorando"
          )}
        </button>
      </div>
    </form>
  );
}