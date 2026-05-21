"use client";

import { ClipboardEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  Search,
  UserPlus,
} from "lucide-react";
import UnlocSelect from "../components/UnlocSelect";
import { getUnlocByMunicipio } from "../lib/unlocs";
import TopBar from "../sidebar/page";

const API_URL = "http://localhost:8080/api";

const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  light: "#CFE2CE",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  borderFocus: "#6B9D4A",
  danger: "#B42318",
  inputBg: "#FAFBF9",
  hoverBg: "#F0F4EE",
};

const MOTIVOS_DEVOLUCAO = [
  { value: "ENDEREÇO", label: "Endereço" },
  { value: "DOCUMENTOS", label: "Documentação" },
  { value: "CADASTRO", label: "Cadastro" },
  { value: "PESCA", label: "Pesca" },
  { value: "SIMPLES NACIONAL", label: "Simples Nacional" },
  { value: "ANIMAIS", label: "Animais" },
];

type Operacao = "INSCRICAO_RENOVACAO" | "DEVOLUCAO";

interface FormState {
  nome: string;
  cpf: string;
  municipio: string;
  memorando: string;
  latitudeDirecao: "N" | "S";
  latitudeValor: string;
  longitudeDirecao: "E" | "W";
  longitudeValor: string;
  tipo: Operacao;
  motivoDevolucao: string;
  detalhesDevolucao: string;
}

interface FormErrors {
  nome?: string;
  cpf?: string;
  municipio?: string;
  memorando?: string;
  latitude?: string;
  longitude?: string;
  motivoDevolucao?: string;
  detalhesDevolucao?: string;
}

const INITIAL_FORM: FormState = {
  nome: "",
  cpf: "",
  municipio: "",
  memorando: "",
  latitudeDirecao: "S",
  latitudeValor: "",
  longitudeDirecao: "W",
  longitudeValor: "",
  tipo: "INSCRICAO_RENOVACAO",
  motivoDevolucao: "",
  detalhesDevolucao: "",
};

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeDmsSymbols(value: string) {
  return value
    .trim()
    .replace(/º/g, "°")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'");
}

function formatDmsValue(value: string, degreeDigits: 2 | 3) {
  const digits = value.replace(/\D/g, "").slice(0, degreeDigits + 6);
  const degrees = digits.slice(0, degreeDigits);
  const minutes = digits.slice(degreeDigits, degreeDigits + 2);
  const seconds = digits.slice(degreeDigits + 2, degreeDigits + 4);
  const decimals = digits.slice(degreeDigits + 4, degreeDigits + 6);

  let formatted = degrees;
  if (degrees.length === degreeDigits) formatted += "°";
  formatted += minutes;
  if (minutes.length === 2) formatted += "'";
  formatted += seconds;
  if (seconds.length === 2) formatted += ",";
  formatted += decimals;
  if (decimals.length === 2) formatted += "\"";

  return formatted;
}

function composeCoordinate(direction: string, value: string) {
  return `(${direction}) ${normalizeDmsSymbols(value)}`;
}

function parseDmsToDecimal(coordinate: string) {
  const normalized = normalizeDmsSymbols(coordinate).replace(/,/g, ".");
  const pattern = /^\(([NSEW])\) ([0-9]{2,3})°([0-9]{2})'([0-9]{2})(?:\.([0-9]{1,}))?"$/;
  const match = normalized.match(pattern);
  if (!match) return null;

  const direction = match[1] as "N" | "S" | "E" | "W";
  const degrees = Number(match[2]);
  const minutes = Number(match[3]);
  const seconds = Number(match[4]);
  const fraction = match[5] ? Number(`0.${match[5]}`) : 0;

  const decimal = degrees + minutes / 60 + (seconds + fraction) / 3600;
  return direction === "S" || direction === "W" ? -decimal : decimal;
}

function buildGoogleMapsUrl(lat: number, lng: number) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(lat.toString())},${encodeURIComponent(lng.toString())}&t=m&z=15&output=embed`;
}

function parseCoordinatePaste(value: string, type: "latitude" | "longitude") {
  const normalized = normalizeDmsSymbols(value);
  const pattern = type === "latitude"
    ? /^\(([NS])\) ([0-9]{2}°[0-9]{2}'[0-9]{2},[0-9]{2}")$/
    : /^\(([EW])\) ([0-9]{3}°[0-9]{2}'[0-9]{2},[0-9]{2}")$/;
  const match = normalized.match(pattern);

  if (!match) return null;

  return {
    direction: match[1],
    value: match[2],
  };
}

function validateDmsCoordinate(coordinate: string, type: "latitude" | "longitude") {
  const pattern = type === "latitude"
    ? /^\(([NS])\) ([0-9]{2})°([0-9]{2})'([0-9]{2}),([0-9]{2})"$/
    : /^\(([EW])\) ([0-9]{3})°([0-9]{2})'([0-9]{2}),([0-9]{2})"$/;
  const label = type === "latitude" ? "latitude" : "longitude";
  const limit = type === "latitude" ? 90 : 180;
  const normalized = normalizeDmsSymbols(coordinate);

  if (!normalized.trim()) return `Informe a ${label}.`;
  if (/[\u0009\u000A\u000D\u00A0\u200B\u200C\u200D\uFEFF]/.test(normalized)) {
    return `A ${label} não pode conter espaços ocultos ou caracteres invisíveis.`;
  }

  const match = normalized.match(pattern);
  if (!match) return `A ${label} deve seguir o formato oficial DMS.`;

  const degrees = Number(match[2]);
  const minutes = Number(match[3]);
  const seconds = Number(match[4]);

  if (degrees > limit) return `A ${label} possui graus fora do intervalo permitido.`;
  if (minutes > 59) return `A ${label} possui minutos fora do intervalo permitido.`;
  if (seconds > 59) return `A ${label} possui segundos fora do intervalo permitido.`;

  if (degrees === limit && (minutes !== 0 || seconds !== 0 || match[5] !== "00")) {
    return `A ${label} no limite máximo deve ter minutos e segundos zerados.`;
  }

  return "";
}

function findMunicipio(value: string) {
  return getUnlocByMunicipio(value)?.municipio;
}

function findMotivoDevolucao(value: string) {
  const normalized = normalizeText(value);
  return MOTIVOS_DEVOLUCAO.find((motivo) => normalizeText(motivo.label) === normalized);
}

function validateDetalhesDevolucao(value: string) {
  const text = value.trim();
  const normalized = normalizeText(text);
  const cleaned = normalized.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const meaningfulWords = text
    .split(/\s+/)
    .filter((word) => word.replace(/[^A-Za-zÀ-ÿ]/g, "").length >= 3);
  const genericReasons = new Set([
    "teste",
    "testando",
    "ok",
    "na",
    "n/a",
    "sem motivo",
    "erro",
    "errado",
    "devolver",
    "devolucao",
    "aaa",
    "aaaa",
    "xxx",
  ]);

  if (text.length < 20) return "Descreva o motivo com pelo menos 20 caracteres.";
  if (meaningfulWords.length < 3) return "Informe pelo menos 3 palavras descritivas.";
  if (genericReasons.has(cleaned)) return "Informe um motivo mais específico.";
  if (/^(.)\1{5,}$/.test(cleaned.replace(/\s/g, ""))) {
    return "Evite repetir caracteres sem descrição real.";
  }
  if (!/[A-Za-zÀ-ÿ]{3,}/.test(text)) return "O detalhe precisa conter uma descrição textual.";

  return "";
}

export default function AdicionarPage() {
  const router = useRouter();
  const motivoRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [motivoOpen, setMotivoOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!motivoRef.current?.contains(event.target as Node)) {
        setMotivoOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredMotivosDevolucao = useMemo(() => {
    const term = normalizeText(form.motivoDevolucao);
    if (!term) return MOTIVOS_DEVOLUCAO;
    return MOTIVOS_DEVOLUCAO.filter((motivo) => normalizeText(motivo.label).includes(term));
  }, [form.motivoDevolucao]);

  const username = typeof window !== "undefined" ? localStorage.getItem("username") || "Usuário" : "Usuário";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  function showMessage(text: string, type: "success" | "error") {
    setMessage(text);
    setMessageType(type);
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: field === "cpf" ? formatCpf(value) : value,
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  }

  function updateCoordinateValue(field: "latitudeValor" | "longitudeValor", value: string) {
    const type = field === "latitudeValor" ? "latitude" : "longitude";
    const degreeDigits = type === "latitude" ? 2 : 3;
    const pastedCoordinate = parseCoordinatePaste(value, type);

    setForm((current) => ({
      ...current,
      ...(pastedCoordinate
        ? {
            [type === "latitude" ? "latitudeDirecao" : "longitudeDirecao"]: pastedCoordinate.direction,
            [field]: pastedCoordinate.value,
          }
        : {
            [field]: formatDmsValue(value, degreeDigits),
          }),
    }));

    setErrors((current) => ({ ...current, [type]: undefined }));
    setMessage("");
  }

  function handleCoordinatePaste(
    field: "latitudeValor" | "longitudeValor",
    event: ClipboardEvent<HTMLInputElement>
  ) {
    const type = field === "latitudeValor" ? "latitude" : "longitude";
    const pastedText = event.clipboardData.getData("text");
    const pastedCoordinate = parseCoordinatePaste(pastedText, type);

    if (pastedCoordinate || pastedText.replace(/\D/g, "").length > 0) {
      event.preventDefault();
      updateCoordinateValue(field, pastedText);
    }
  }

  function updateCoordinateDirection(field: "latitudeDirecao" | "longitudeDirecao", value: "N" | "S" | "E" | "W") {
    const errorField = field === "latitudeDirecao" ? "latitude" : "longitude";

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({ ...current, [errorField]: undefined }));
    setMessage("");
  }

  function validateForm() {
    const nextErrors: FormErrors = {};
    const cpfDigits = form.cpf.replace(/\D/g, "");
    const municipioSelecionado = findMunicipio(form.municipio);

    if (!form.nome.trim()) nextErrors.nome = "Informe o nome do produtor.";
    if (cpfDigits.length !== 11) nextErrors.cpf = "Informe um CPF válido com 11 dígitos.";
    if (!form.municipio.trim()) {
      nextErrors.municipio = "Informe a localidade.";
    } else if (!municipioSelecionado) {
      nextErrors.municipio = "Selecione uma localidade da lista de UNLOCs.";
    }
    if (!form.memorando.trim()) nextErrors.memorando = "Informe o memorando.";

    const latitude = composeCoordinate(form.latitudeDirecao, form.latitudeValor);
    const longitude = composeCoordinate(form.longitudeDirecao, form.longitudeValor);
    const latitudeError = form.latitudeValor ? validateDmsCoordinate(latitude, "latitude") : "Informe a latitude.";
    const longitudeError = form.longitudeValor ? validateDmsCoordinate(longitude, "longitude") : "Informe a longitude.";

    if (latitudeError) nextErrors.latitude = latitudeError;
    if (longitudeError) nextErrors.longitude = longitudeError;

    if (form.tipo === "DEVOLUCAO") {
      const detalhesError = validateDetalhesDevolucao(form.detalhesDevolucao);
      const motivoSelecionado = findMotivoDevolucao(form.motivoDevolucao);

      if (!form.motivoDevolucao.trim()) {
        nextErrors.motivoDevolucao = "Selecione o motivo da devolução.";
      } else if (!motivoSelecionado) {
        nextErrors.motivoDevolucao = "Selecione um motivo da lista.";
      }

      if (detalhesError) nextErrors.detalhesDevolucao = detalhesError;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) {
      showMessage("Revise os campos destacados antes de salvar.", "error");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const municipioSelecionado = findMunicipio(form.municipio);
      const response = await fetch(`${API_URL}/inscricoes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: form.nome.trim(),
          cpf: form.cpf,
          municipio: municipioSelecionado,
          memorando: form.memorando.trim(),
          latitude: composeCoordinate(form.latitudeDirecao, form.latitudeValor),
          longitude: composeCoordinate(form.longitudeDirecao, form.longitudeValor),
          tipo: form.tipo,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Erro ao salvar registro";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const textError = await response.text();
          if (textError) errorMessage = textError;
        }

        throw new Error(errorMessage);
      }

      setForm(INITIAL_FORM);
      setErrors({});
      setMotivoOpen(false);
      showMessage("Registro salvo com sucesso.", "success");
    } catch (error) {
      console.error(error);
      showMessage(error instanceof Error ? error.message : "Não foi possível salvar o registro.", "error");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setErrors({});
    setMessage("");
    setMotivoOpen(false);
  }

  const coordinateMapState = useMemo(() => {
    const latitude = composeCoordinate(form.latitudeDirecao, form.latitudeValor);
    const longitude = composeCoordinate(form.longitudeDirecao, form.longitudeValor);
    const latitudeError = form.latitudeValor ? validateDmsCoordinate(latitude, "latitude") : "Informe a latitude.";
    const longitudeError = form.longitudeValor ? validateDmsCoordinate(longitude, "longitude") : "Informe a longitude.";
    const hasLatitudeError = !!latitudeError;
    const hasLongitudeError = !!longitudeError;

    if (hasLatitudeError || hasLongitudeError) {
      return {
        valid: false,
        message: "Coordenadas inválidas. Verifique latitude e longitude.",
        mapUrl: null,
      };
    }

    const latDecimal = parseDmsToDecimal(latitude);
    const lngDecimal = parseDmsToDecimal(longitude);

    if (latDecimal === null || lngDecimal === null) {
      return {
        valid: false,
        message: "Não foi possível converter as coordenadas para exibir no mapa.",
        mapUrl: null,
      };
    }

    return {
      valid: true,
      message: "",
      mapUrl: buildGoogleMapsUrl(latDecimal, lngDecimal),
    };
  }, [form.latitudeDirecao, form.latitudeValor, form.longitudeDirecao, form.longitudeValor]);

  const fieldClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-4 focus:ring-[#6B9D4A]/10";
  const fieldStyle = (hasError?: boolean) => ({
    backgroundColor: COLORS.inputBg,
    borderColor: hasError ? COLORS.danger : COLORS.border,
    color: COLORS.text,
  });

  const selectClass = "w-full rounded-xl border px-3 py-3 text-sm outline-none transition-all focus:ring-4 focus:ring-[#6B9D4A]/10";

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Adicionar</h1>
              <p className="text-sm" style={{ color: COLORS.textLight }}>
                Registre operações de produtores rurais
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-white"
              style={{ color: COLORS.primary, border: `1px solid ${COLORS.border}` }}
            >
              <RotateCcw size={16} />
              Limpar
            </button>
          </div>

          {message && (
            <div
              className="flex items-center gap-2 rounded-md border px-4 py-3 text-sm"
              style={{
                backgroundColor: messageType === "success" ? "#ECFDF3" : "#FEF3F2",
                borderColor: messageType === "success" ? "#ABEFC6" : "#FECDCA",
                color: messageType === "success" ? COLORS.primary : COLORS.danger,
              }}
            >
              {messageType === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{message}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border p-8 shadow-sm"
            style={{
              backgroundColor: "#FAFAF7",
              borderColor: COLORS.border,
              boxShadow: "0 4px 24px rgba(31,58,46,0.08)",
            }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ backgroundColor: COLORS.primary }}>
                <UserPlus size={16} color="white" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: COLORS.primary }}>Dados do produtor</h2>
                <p className="text-sm" style={{ color: COLORS.textLight }}>Preencha os dados para registrar a operação</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>Nome</label>
                    <input
                      value={form.nome}
                      onChange={(event) => updateField("nome", event.target.value)}
                      className={fieldClass}
                      style={fieldStyle(!!errors.nome)}
                    />
                    {errors.nome && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.nome}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>CPF</label>
                    <input
                      value={form.cpf}
                      onChange={(event) => updateField("cpf", event.target.value)}
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      className={fieldClass}
                      style={fieldStyle(!!errors.cpf)}
                    />
                    {errors.cpf && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.cpf}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>Localidade</label>
                    <UnlocSelect
                      value={form.municipio}
                      valueMode="municipio"
                      onChange={(value) => updateField("municipio", value)}
                      placeholder="Selecione a localidade"
                      error={!!errors.municipio}
                      colors={COLORS}
                    />
                    {errors.municipio && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.municipio}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>Memorando</label>
                    <input
                      value={form.memorando}
                      onChange={(event) => updateField("memorando", event.target.value)}
                      className={fieldClass}
                      style={fieldStyle(!!errors.memorando)}
                    />
                    {errors.memorando && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.memorando}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>Latitude</label>
                    <div className="grid grid-cols-[76px_1fr] gap-2">
                      <select
                        value={form.latitudeDirecao}
                        onChange={(event) => updateCoordinateDirection("latitudeDirecao", event.target.value as "N" | "S")}
                        className={selectClass}
                        style={fieldStyle(!!errors.latitude)}
                        aria-label="Direção da latitude"
                      >
                        <option value="S">(S)</option>
                        <option value="N">(N)</option>
                      </select>
                      <input
                        value={form.latitudeValor}
                        onChange={(event) => updateCoordinateValue("latitudeValor", event.target.value)}
                        onPaste={(event) => handleCoordinatePaste("latitudeValor", event)}
                        inputMode="numeric"
                        placeholder="03°34'50,20&quot;"
                        maxLength={12}
                        className={fieldClass}
                        style={fieldStyle(!!errors.latitude)}
                      />
                    </div>
                    {errors.latitude && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.latitude}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>Longitude</label>
                    <div className="grid grid-cols-[76px_1fr] gap-2">
                      <select
                        value={form.longitudeDirecao}
                        onChange={(event) => updateCoordinateDirection("longitudeDirecao", event.target.value as "E" | "W")}
                        className={selectClass}
                        style={fieldStyle(!!errors.longitude)}
                        aria-label="Direção da longitude"
                      >
                        <option value="W">(W)</option>
                        <option value="E">(E)</option>
                      </select>
                      <input
                        value={form.longitudeValor}
                        onChange={(event) => updateCoordinateValue("longitudeValor", event.target.value)}
                        onPaste={(event) => handleCoordinatePaste("longitudeValor", event)}
                        inputMode="numeric"
                        placeholder="061°17'29,09&quot;"
                        maxLength={13}
                        className={fieldClass}
                        style={fieldStyle(!!errors.longitude)}
                      />
                    </div>
                    {errors.longitude && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.longitude}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>Operação</label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {[
                        { value: "INSCRICAO_RENOVACAO", label: "Inscrição/Renovação" },
                        { value: "DEVOLUCAO", label: "Devolução" },
                      ].map((option) => {
                        const isActive = form.tipo === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField("tipo", option.value)}
                            className="rounded-xl px-4 py-3 text-sm font-semibold transition-all"
                            style={{
                              backgroundColor: isActive ? COLORS.accent : COLORS.inputBg,
                              border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
                              color: isActive ? "#FFFFFF" : COLORS.text,
                            }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {form.tipo === "DEVOLUCAO" && (
                    <div className="space-y-3">
                      <div ref={motivoRef} className="relative space-y-1">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>Motivo da devolução</label>
                        <div className="relative">
                          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                          <input
                            value={form.motivoDevolucao}
                            onChange={(event) => {
                              updateField("motivoDevolucao", event.target.value);
                              setMotivoOpen(true);
                            }}
                            onFocus={() => setMotivoOpen(true)}
                            placeholder="Digite para filtrar..."
                            className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition-all focus:ring-4 focus:ring-[#6B9D4A]/10"
                            style={fieldStyle(!!errors.motivoDevolucao)}
                            autoComplete="off"
                          />
                        </div>
                        {motivoOpen && (
                          <div
                            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border shadow-lg"
                            style={{ backgroundColor: COLORS.card, borderColor: COLORS.borderFocus }}
                          >
                            {filteredMotivosDevolucao.length > 0 ? (
                              filteredMotivosDevolucao.map((motivo) => (
                                <button
                                  key={motivo.value}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    updateField("motivoDevolucao", motivo.label);
                                    setMotivoOpen(false);
                                  }}
                                  className="block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#F0F4EE]"
                                  style={{ color: COLORS.text }}
                                >
                                  {motivo.label}
                                </button>
                              ))
                            ) : (
                              <p className="px-4 py-3 text-sm" style={{ color: COLORS.textLight }}>
                                Nenhum motivo encontrado
                              </p>
                            )}
                          </div>
                        )}
                        {errors.motivoDevolucao && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.motivoDevolucao}</p>}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textLight }}>Detalhes da devolução</label>
                        <textarea
                          value={form.detalhesDevolucao}
                          onChange={(event) => updateField("detalhesDevolucao", event.target.value)}
                          rows={4}
                          className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-4 focus:ring-[#6B9D4A]/10"
                          style={fieldStyle(!!errors.detalhesDevolucao)}
                        />
                        {errors.detalhesDevolucao && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.detalhesDevolucao}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <aside className="w-full overflow-hidden rounded-[28px]" style={{ backgroundColor: COLORS.border, border: `1px solid ${COLORS.inputBg}` }}>
                <div className="flex flex-col gap-3 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F7F4] text-[#5E7564]">
                        <MapPin size={18} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                          Mapa da localização
                        </h3>
                        <p className="text-xs" style={{ color: COLORS.textLight }}>
                          Abra quando quiser ver o ponto no mapa.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMap((current) => !current)}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition"
                      style={{ borderColor: COLORS.inputBg, color: COLORS.primary, backgroundColor: COLORS.background }}
                    >
                      {showMap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {showMap ? "Ocultar mapa" : "Mostrar mapa"}
                    </button>
                  </div>
                </div>

                {showMap ? (
                  <div className="relative h-80 w-full overflow-hidden rounded-b-[28px]" style={{ backgroundColor: COLORS.border }}>
                    {coordinateMapState.valid && coordinateMapState.mapUrl ? (
                      <iframe
                        title="Mapa de localização"
                        src={coordinateMapState.mapUrl}
                        className="h-full w-full"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
                          {coordinateMapState.message}
                        </p>
                        <p className="mt-2 text-xs" style={{ color: COLORS.textLight }}>
                          Digite latitude e longitude válidas para visualizar o ponto no mapa.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center text-sm" style={{ color: COLORS.textLight }}>
                    Abra o painel para visualizar o mapa apenas quando precisar.
                  </div>
                )}
              </aside>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                style={{ backgroundColor: COLORS.primary }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="transition-transform duration-200 group-hover:scale-110" />}
                Salvar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
