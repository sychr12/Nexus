// frontend/app/carteira/components/FormularioCarteira.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlignLeft, Building2, Calendar, FileText, Hash, Image as ImageIcon, MapPin, User } from "lucide-react";
import UnlocSelect from "@/app/_components/UnlocSelect";
import { formatBytes, UPLOAD_LIMITS, validateCarteiraPhoto } from "@/app/_lib/uploadLimits";
import { CarteiraRequest } from "../types/carteira";

const COLORS = {
  primary: "#1F3A2E",
  accent: "#6B8E23",
  danger: "#DC2626",
  card: "#FAFAF7",
  border: "#D8DDD4",
  borderFocus: "#6B8E23",
  text: "#1E2A22",
  textLight: "#6E786F",
  inputBg: "#FDFDFC",
  hoverBg: "#F0F4EE",
};

interface FormularioCarteiraProps {
  onSubmit: (data: CarteiraRequest) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<CarteiraRequest>;
  onFormChange?: (data: CarteiraRequest) => void;
}

export default function FormularioCarteira({
  onSubmit,
  isLoading = false,
  initialData,
  onFormChange,
}: FormularioCarteiraProps) {
  const [form, setForm] = useState<CarteiraRequest>({
    registro: initialData?.registro || "",
    cpf: initialData?.cpf || "",
    nome: initialData?.nome || "",
    propriedade: initialData?.propriedade || "",
    unloc: initialData?.unloc || "",
    inicio: initialData?.inicio || "",
    validade: initialData?.validade || "",
    endereco: initialData?.endereco || "",
    atividade1: initialData?.atividade1 || "",
    atividade2: initialData?.atividade2 || "",
    georef: initialData?.georef || "",
    fotos: [],
  });

  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (onFormChange) {
      onFormChange(form);
    }
  }, [form, onFormChange]);

  const handleChange = (field: keyof CarteiraRequest, value: string) => {
    setForm({ ...form, [field]: value });
    setError(null);
  };

  const handleFotoChange = (index: number, file: File | null) => {
    const novasFotos = [...(form.fotos || [])];
    const novosPreviews = [...fotosPreview];

    if (file) {
      try {
        validateCarteiraPhoto(file);
        novasFotos[index] = file;
        const reader = new FileReader();
        reader.onloadend = () => {
          novosPreviews[index] = reader.result as string;
          setFotosPreview(novosPreviews);
        };
        reader.readAsDataURL(file);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Foto invalida");
        return;
      }
    } else {
      delete novasFotos[index];
      delete novosPreviews[index];
    }

    setForm({ ...form, fotos: novasFotos.filter(Boolean) });
    setFotosPreview(novosPreviews.filter(Boolean));
  };

  const formatarCpf = (value: string) => {
    const numeros = value.replace(/\D/g, "");
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.registro || !form.cpf || !form.nome || !form.propriedade || !form.unloc) {
      setError("Preencha todos os campos obrigatórios (*)");
      return;
    }

    const cpfNumeros = form.cpf.replace(/\D/g, "");
    if (cpfNumeros.length !== 11) {
      setError("CPF inválido. Deve conter 11 dígitos");
      return;
    }

    try {
      await onSubmit(form);
      setForm({
        registro: "",
        cpf: "",
        nome: "",
        propriedade: "",
        unloc: "",
        inicio: "",
        validade: "",
        endereco: "",
        atividade1: "",
        atividade2: "",
        georef: "",
        fotos: [],
      });
      setFotosPreview([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
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
              Nova Carteira Digital
            </h2>
            <p className="text-xs" style={{ color: COLORS.textLight }}>
              Preencha os dados do produtor rural
            </p>
          </div>
        </div>

        {error && (
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: "#FEF2F2", color: COLORS.danger, border: "1px solid #FECACA" }}
          >
            <AlertCircleText />
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Registro Estadual *" icon={<Hash size={12} />} focused={focusedField === "registro"}>
            <input
              type="text"
              value={form.registro}
              onChange={(e) => handleChange("registro", e.target.value)}
              placeholder="Ex: 001/2025"
              onFocus={() => setFocusedField("registro")}
              onBlur={() => setFocusedField(null)}
              className="w-full rounded-xl px-4 py-3 border text-sm"
              style={fieldStyle("registro")}
              required
            />
          </InputField>

          <InputField label="CPF *" icon={<User size={12} />} focused={focusedField === "cpf"}>
            <input
              type="text"
              value={form.cpf}
              onChange={(e) => handleChange("cpf", formatarCpf(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              onFocus={() => setFocusedField("cpf")}
              onBlur={() => setFocusedField(null)}
              className="w-full rounded-xl px-4 py-3 border text-sm"
              style={fieldStyle("cpf")}
              required
            />
          </InputField>
        </div>

        <InputField label="Nome do Produtor *" icon={<User size={12} />} focused={focusedField === "nome"}>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            placeholder="Nome completo do produtor"
            onFocus={() => setFocusedField("nome")}
            onBlur={() => setFocusedField(null)}
            className="w-full rounded-xl px-4 py-3 border text-sm"
            style={fieldStyle("nome")}
            required
          />
        </InputField>

        <InputField label="Propriedade *" icon={<Building2 size={12} />} focused={focusedField === "propriedade"}>
          <input
            type="text"
            value={form.propriedade}
            onChange={(e) => handleChange("propriedade", e.target.value)}
            placeholder="Nome da propriedade rural"
            onFocus={() => setFocusedField("propriedade")}
            onBlur={() => setFocusedField(null)}
            className="w-full rounded-xl px-4 py-3 border text-sm"
            style={fieldStyle("propriedade")}
            required
          />
        </InputField>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Unidade Local *" icon={<MapPin size={12} />} focused={focusedField === "unloc"}>
            <UnlocSelect
              value={form.unloc}
              onChange={(value) => handleChange("unloc", value)}
              placeholder="Selecione a Unidade Local"
              error={!!error && !form.unloc}
              colors={COLORS}
            />
          </InputField>

          <InputField label="Endereço" icon={<MapPin size={12} />} focused={focusedField === "endereco"}>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => handleChange("endereco", e.target.value)}
              placeholder="Endereço completo"
              onFocus={() => setFocusedField("endereco")}
              onBlur={() => setFocusedField(null)}
              className="w-full rounded-xl px-4 py-3 border text-sm"
              style={fieldStyle("endereco")}
            />
          </InputField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Data de Início" icon={<Calendar size={12} />} focused={focusedField === "inicio"}>
            <input
              type="date"
              value={form.inicio}
              onChange={(e) => handleChange("inicio", e.target.value)}
              onFocus={() => setFocusedField("inicio")}
              onBlur={() => setFocusedField(null)}
              className="w-full rounded-xl px-4 py-3 border text-sm"
              style={fieldStyle("inicio")}
            />
          </InputField>

          <InputField label="Data de Validade" icon={<Calendar size={12} />} focused={focusedField === "validade"}>
            <input
              type="date"
              value={form.validade}
              onChange={(e) => handleChange("validade", e.target.value)}
              onFocus={() => setFocusedField("validade")}
              onBlur={() => setFocusedField(null)}
              className="w-full rounded-xl px-4 py-3 border text-sm"
              style={fieldStyle("validade")}
            />
          </InputField>
        </div>

        <InputField label="Atividade Principal" icon={<AlignLeft size={12} />} focused={focusedField === "atividade1"}>
          <textarea
            value={form.atividade1}
            onChange={(e) => handleChange("atividade1", e.target.value)}
            rows={2}
            placeholder="Descreva a atividade principal"
            onFocus={() => setFocusedField("atividade1")}
            onBlur={() => setFocusedField(null)}
            className="w-full rounded-xl px-4 py-3 border text-sm resize-none"
            style={fieldStyle("atividade1")}
          />
        </InputField>

        <InputField label="Atividade Secundária" icon={<AlignLeft size={12} />} focused={focusedField === "atividade2"}>
          <textarea
            value={form.atividade2}
            onChange={(e) => handleChange("atividade2", e.target.value)}
            rows={2}
            placeholder="Descreva a atividade secundária (opcional)"
            onFocus={() => setFocusedField("atividade2")}
            onBlur={() => setFocusedField(null)}
            className="w-full rounded-xl px-4 py-3 border text-sm resize-none"
            style={fieldStyle("atividade2")}
          />
        </InputField>

        <InputField label="Georreferenciamento" icon={<MapPin size={12} />} focused={focusedField === "georef"}>
          <input
            type="text"
            value={form.georef}
            onChange={(e) => handleChange("georef", e.target.value)}
            placeholder="Coordenadas (latitude, longitude)"
            onFocus={() => setFocusedField("georef")}
            onBlur={() => setFocusedField(null)}
            className="w-full rounded-xl px-4 py-3 border text-sm"
            style={fieldStyle("georef")}
          />
        </InputField>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>
            <ImageIcon size={12} style={{ color: COLORS.accent }} />
            Fotos (até 3)
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-2">
                {fotosPreview[index] ? (
                  <div className="relative">
                    <img
                      src={fotosPreview[index]}
                      alt={`Preview ${index + 1}`}
                      className="h-32 w-full rounded-lg border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleFotoChange(index, null)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="mt-1 text-xs text-gray-500">Foto {index + 1}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFotoChange(index, e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Formatos: JPG, PNG (max. {formatBytes(UPLOAD_LIMITS.carteiraPhotoMaxBytes)} cada)</p>
        </div>

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
          {isLoading ? "Salvando carteira..." : "Salvar Carteira Digital"}
        </button>
      </div>
    </form>
  );
}

function InputField({
  label,
  icon,
  focused,
  children,
}: {
  label: string;
  icon: ReactNode;
  focused: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>
        <span style={{ color: focused ? COLORS.primary : COLORS.accent }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function AlertCircleText() {
  return <span style={{ color: COLORS.danger }}>!</span>;
}
