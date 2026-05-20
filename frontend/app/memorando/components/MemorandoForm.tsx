"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  ChevronDown,
  FileText,
  MapPin,
  Hash,
  AlignLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { MemorandoForm as MemorandoFormType } from "../types/memorando";
import { criarMemorando } from "../services/memorando.service";

// ============================================
// CONSTANTES E ESTILOS GLOBAIS
// ============================================

const KEYFRAMES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px) scaleY(0.95); }
  to { opacity: 1; transform: translateY(0) scaleY(1); }
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
  hoverBg: "#F0F4EE"
};

const UNLOC_CODES: Record<string, string> = {
  "Alvarães": "ALV",
  "Amaturá": "AMT",
  "Anamã": "ANA",
  "Anori": "ANO",
  "Apuí": "APU",
  "Atalaia do Norte": "ATN",
  "Autazes": "AUT",
  "Barcelos": "BAR",
  "Barreirinha": "BRR",
  "Benjamin Constant": "BCT",
  "Beruri": "BER",
  "Boa Vista do Ramos": "BVR",
  "Boca do Acre": "BAC",
  "Borba": "BOR",
  "Caapiranga": "CAP",
  "Canutama": "CAN",
  "Carauari": "CAR",
  "Careiro": "CAI",
  "Careiro da Várzea": "CAV",
  "Coari": "COA",
  "Codajás": "COD",
  "Eirunepé": "EIR",
  "Envira": "ENV",
  "Fonte Boa": "FBO",
  "Guajará": "GUA",
  "Humaitá": "HUM",
  "Ipixuna": "IPI",
  "Iranduba": "IRA",
  "Itacoatiara": "ITA",
  "Itamarati": "ITM",
  "Itapiranga": "ITP",
  "Japurá": "JAP",
  "Juruá": "JUR",
  "Jutaí": "JUT",
  "Lábrea": "LAB",
  "Manacapuru": "MAN",
  "Manaquiri": "MAQ",
  "Manaus": "MAO",
  "Manicoré": "MCO",
  "Maraã": "MAR",
  "Maués": "MAU",
  "Nhamundá": "NHA",
  "Nova Olinda do Norte": "NON",
  "Novo Airão": "NAI",
  "Novo Aripuanã": "NAR",
  "Parintins": "PAR",
  "Pauini": "PAU",
  "Presidente Figueiredo": "PFIG",
  "Rio Preto da Eva": "RPE",
  "Santa Isabel do Rio Negro": "SIRN",
  "Santo Antônio do Içá": "SAI",
  "São Gabriel da Cachoeira": "SGC",
  "São Paulo de Olivença": "SPOL",
  "São Sebastião do Uatumã": "SSU",
  "Silves": "SIL",
  "Tabatinga": "TAB",
  "Tapauá": "TAP",
  "Tefé": "TEF",
  "Tonantins": "TON",
  "Uarini": "UAR",
  "Urucará": "URC",
  "Urucurituba": "URU"
};

const initialForm = {
  numero: "",
  descricao: "",
  unloc: "",
  memoEntrada: ""
};

// ============================================
// COMPONENTES
// ============================================

interface FieldProps {
  label: string;
  icon: ReactNode;
  required?: boolean;
  children: ReactNode;
}

function Field({ label, icon, required, children }: FieldProps) {
  return (
    <div className="space-y-2" style={{ animation: "fadeUp .4s ease" }}>
      <label
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: COLORS.textLight }}
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
  const [isUnlocOpen, setIsUnlocOpen] = useState(false);
  const [unlocSearch, setUnlocSearch] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ============================================
  // EFECTOS
  // ============================================

  useEffect(() => {
    if (!document.getElementById("memo-keyframes")) {
      const style = document.createElement("style");
      style.id = "memo-keyframes";
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUnlocOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  const getMunicipioName = (code: string): string => {
    if (!code) return "";
    const entry = Object.entries(UNLOC_CODES).find(([, sigla]) => sigla === code);
    return entry ? entry[0] : code;
  };

  const getMunicipioLabel = (code: string): string => {
    const municipio = getMunicipioName(code);
    return municipio ? `${municipio} (${code})` : "";
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

  const fieldStyle = (name: string) => ({
    background: COLORS.inputBg,
    borderColor: focusedField === name ? COLORS.borderFocus : COLORS.border,
    boxShadow: focusedField === name ? `0 0 0 3px ${COLORS.accent}22` : "none",
    color: COLORS.text,
    transition: ".25s"
  });

  const filteredOptions = Object.entries(UNLOC_CODES)
    .map(([municipio, sigla]) => ({ municipio, value: sigla }))
    .filter(option => 
      option.municipio.toLowerCase().includes(unlocSearch.toLowerCase())
    );

  // ============================================
  // HANDLERS
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

  const selectedMunicipio = getMunicipioLabel(form.unloc);

  // ============================================
  // RENDER
  // ============================================

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold" style={{ color: COLORS.text }}>
              Novo Memorando
            </p>
            <p className="text-sm mt-1" style={{ color: COLORS.textLight }}>
              Preencha as informações abaixo para gerar o documento.
            </p>
          </div>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={{
            }}
          >
          </span>
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
          <Field label="Número" icon={<Hash size={13} />} required>
            <input
              value={form.numero}
              onChange={(e) => handleChange("numero", e.target.value)}
              onFocus={() => setFocusedField("numero")}
              onBlur={() => setFocusedField(null)}
              className="w-full px-4 py-3 rounded-2xl border"
              style={fieldStyle("numero")}
              placeholder="Ex: 045/2026"
            />
          </Field>

          {/* Campo UNLOC */}
          <Field label="UNLOC" required icon={<MapPin size={13} />}>
            <div className="relative z-50" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsUnlocOpen(!isUnlocOpen);
                  setUnlocSearch("");
                }}
                className="w-full rounded-2xl px-4 py-3 border flex justify-between items-center"
                style={{
                  ...fieldStyle("unloc"),
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <span className={selectedMunicipio ? "text-base" : "text-sm text-[#94A08D]"}>
                  {selectedMunicipio || "Selecione município"}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    transform: isUnlocOpen ? "rotate(180deg)" : "",
                    transition: ".3s",
                  }}
                />
              </button>

              {/* Dropdown de Municípios */}
              {isUnlocOpen && (
                <div
                  className="absolute top-full left-0 z-50 w-full mt-2 rounded-2xl border"
                  style={{
                    background: "#fff",
                    borderColor: COLORS.border,
                    boxShadow: "0 20px 48px rgba(15, 23, 42, 0.12)",
                    overflow: "hidden",
                    animation: "slideDown .2s ease",
                  }}
                >
                  <div className="p-3 border-b" style={{ borderColor: COLORS.border }}>
                    <input
                      value={unlocSearch}
                      onChange={(e) => setUnlocSearch(e.target.value)}
                      placeholder="Buscar município..."
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                      style={{ borderColor: COLORS.border }}
                    />
                  </div>

                  <div style={{ maxHeight: 240, overflowY: "auto" }}>
                    {filteredOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleChange("unloc", option.value);
                          setIsUnlocOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 transition-colors"
                        style={{ color: COLORS.text, backgroundColor: "transparent" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold"
                            style={{
                              color: COLORS.accent,
                              backgroundColor: `${COLORS.accent}20`,
                            }}
                          >
                            {option.value}
                          </span>
                          <span>{option.municipio}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Field>

          {/* Campo Descrição */}
          <Field label="Descrição" icon={<AlignLeft size={13} />}>
            <textarea
              rows={3}
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border resize-none"
              style={fieldStyle("descricao")}
            />
          </Field>

          {/* Campo Memo Entrada */}
          <Field label="Memo Entrada" icon={<FileText size={13} />}>
            <textarea
              rows={5}
              value={form.memoEntrada}
              onChange={(e) => handleChange("memoEntrada", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border resize-none"
              style={fieldStyle("memoEntrada")}
            />
          </Field>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-white font-bold transition-transform duration-200"
            style={{
              background: isLoading ? "#7B8B72" : COLORS.primary,
              opacity: isLoading ? 0.75 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
              transform: isLoading ? "none" : "translateY(0)",
            }}
          >
            {isLoading ? "Criando..." : "Criar Memorando"}
          </button>
        </div>
      </div>
    </form>
  );
}