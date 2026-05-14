"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
  Search,
  UserPlus,
} from "lucide-react";
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
  danger: "#B42318",
};

const MUNICIPIOS_AM = [
  "Alvarães",
  "Amaturá",
  "Anamã",
  "Anori",
  "Apuí",
  "Atalaia do Norte",
  "Autazes",
  "Barcelos",
  "Barreirinha",
  "Benjamin Constant",
  "Beruri",
  "Boa Vista do Ramos",
  "Boca do Acre",
  "Borba",
  "Caapiranga",
  "Canutama",
  "Carauari",
  "Careiro",
  "Careiro da Várzea",
  "Coari",
  "Codajás",
  "Eirunepé",
  "Envira",
  "Fonte Boa",
  "Guajará",
  "Humaitá",
  "Ipixuna",
  "Iranduba",
  "Itacoatiara",
  "Itamarati",
  "Itapiranga",
  "Japurá",
  "Juruá",
  "Jutaí",
  "Lábrea",
  "Manacapuru",
  "Manaquiri",
  "Manaus",
  "Manicoré",
  "Maraã",
  "Maués",
  "Nhamundá",
  "Nova Olinda do Norte",
  "Novo Airão",
  "Novo Aripuanã",
  "Parintins",
  "Pauini",
  "Presidente Figueiredo",
  "Rio Preto da Eva",
  "Santa Isabel do Rio Negro",
  "Santo Antônio do Içá",
  "São Gabriel da Cachoeira",
  "São Paulo de Olivença",
  "São Sebastião do Uatumã",
  "Silves",
  "Tabatinga",
  "Tapauá",
  "Tefé",
  "Tonantins",
  "Uarini",
  "Urucará",
  "Urucurituba",
];

const MOTIVOS_DEVOLUCAO = [
  { value: "DOCUMENTACAO_INCOMPLETA", label: "Documentação incompleta" },
  { value: "CPF_INVALIDO_DIVERGENTE", label: "CPF inválido ou divergente" },
  { value: "MEMORANDO_INCORRETO", label: "Memorando incorreto" },
  { value: "MUNICIPIO_DIVERGENTE", label: "Município divergente" },
  { value: "DUPLICIDADE_REGISTRO", label: "Duplicidade de registro" },
  { value: "FORA_DO_PRAZO", label: "Solicitação fora do prazo" },
  { value: "DADOS_INCONSISTENTES", label: "Dados inconsistentes" },
  { value: "PRODUTOR_NAO_LOCALIZADO", label: "Produtor não localizado" },
  { value: "OUTRO", label: "Outro" },
];

type Operacao = "INSCRICAO_RENOVACAO" | "DEVOLUCAO";

interface FormState {
  nome: string;
  cpf: string;
  municipio: string;
  memorando: string;
  tipo: Operacao;
  motivoDevolucao: string;
  detalhesDevolucao: string;
}

interface FormErrors {
  nome?: string;
  cpf?: string;
  municipio?: string;
  memorando?: string;
  motivoDevolucao?: string;
  detalhesDevolucao?: string;
}

const INITIAL_FORM: FormState = {
  nome: "",
  cpf: "",
  municipio: "",
  memorando: "",
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

function findMunicipio(value: string) {
  const normalized = normalizeText(value);
  return MUNICIPIOS_AM.find((municipio) => normalizeText(municipio) === normalized);
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

  if (text.length < 20) {
    return "Descreva o motivo com pelo menos 20 caracteres.";
  }

  if (meaningfulWords.length < 3) {
    return "Informe pelo menos 3 palavras descritivas.";
  }

  if (genericReasons.has(cleaned)) {
    return "Informe um motivo mais específico.";
  }

  if (/^(.)\1{5,}$/.test(cleaned.replace(/\s/g, ""))) {
    return "Evite repetir caracteres sem descrição real.";
  }

  if (!/[A-Za-zÀ-ÿ]{3,}/.test(text)) {
    return "O detalhe precisa conter uma descrição textual.";
  }

  return "";
}

export default function AdicionarPage() {
  const router = useRouter();
  const municipioRef = useRef<HTMLDivElement>(null);
  const motivoRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [municipioOpen, setMunicipioOpen] = useState(false);
  const [motivoOpen, setMotivoOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!municipioRef.current?.contains(event.target as Node)) {
        setMunicipioOpen(false);
      }
      if (!motivoRef.current?.contains(event.target as Node)) {
        setMotivoOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredMunicipios = useMemo(() => {
    const term = normalizeText(form.municipio);
    if (!term) return MUNICIPIOS_AM;
    return MUNICIPIOS_AM.filter((municipio) => normalizeText(municipio).includes(term));
  }, [form.municipio]);

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

  function validateForm() {
    const nextErrors: FormErrors = {};
    const cpfDigits = form.cpf.replace(/\D/g, "");
    const municipioSelecionado = findMunicipio(form.municipio);

    if (!form.nome.trim()) nextErrors.nome = "Informe o nome do produtor.";
    if (cpfDigits.length !== 11) nextErrors.cpf = "Informe um CPF válido com 11 dígitos.";
    if (!form.municipio.trim()) {
      nextErrors.municipio = "Informe o município.";
    } else if (!municipioSelecionado) {
      nextErrors.municipio = "Selecione um município da lista.";
    }
    if (!form.memorando.trim()) nextErrors.memorando = "Informe o memorando.";

    if (form.tipo === "DEVOLUCAO") {
      const detalhesError = validateDetalhesDevolucao(form.detalhesDevolucao);
      const motivoSelecionado = findMotivoDevolucao(form.motivoDevolucao);

      if (!form.motivoDevolucao.trim()) {
        nextErrors.motivoDevolucao = "Selecione o motivo da devolução.";
      } else if (!motivoSelecionado) {
        nextErrors.motivoDevolucao = "Selecione um motivo da lista.";
      }

      if (detalhesError) {
        nextErrors.detalhesDevolucao = detalhesError;
      }
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
          tipo: form.tipo,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar registro");
      }

      setForm(INITIAL_FORM);
      setErrors({});
      setMunicipioOpen(false);
      setMotivoOpen(false);
      showMessage("Registro salvo com sucesso.", "success");
    } catch (error) {
      console.error(error);
      showMessage("Não foi possível salvar o registro.", "error");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setErrors({});
    setMessage("");
    setMunicipioOpen(false);
    setMotivoOpen(false);
  }

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
            className="rounded-lg border p-5 shadow-sm"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: COLORS.light }}>
                <UserPlus size={18} style={{ color: COLORS.primary }} />
              </div>
              <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>Dados do produtor</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: COLORS.text }}>Nome</label>
                <input
                  value={form.nome}
                  onChange={(event) => updateField("nome", event.target.value)}
                  className="w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{ border: `1px solid ${errors.nome ? COLORS.danger : COLORS.border}`, color: COLORS.text }}
                />
                {errors.nome && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.nome}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: COLORS.text }}>CPF</label>
                <input
                  value={form.cpf}
                  onChange={(event) => updateField("cpf", event.target.value)}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  className="w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{ border: `1px solid ${errors.cpf ? COLORS.danger : COLORS.border}`, color: COLORS.text }}
                />
                {errors.cpf && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.cpf}</p>}
              </div>

              <div ref={municipioRef} className="relative">
                <label className="mb-1 block text-sm font-medium" style={{ color: COLORS.text }}>Município</label>
                <Search size={16} className="absolute left-3 top-[35px]" style={{ color: COLORS.textLight }} />
                <input
                  value={form.municipio}
                  onChange={(event) => {
                    updateField("municipio", event.target.value);
                    setMunicipioOpen(true);
                  }}
                  onFocus={() => setMunicipioOpen(true)}
                  placeholder="Digite para filtrar..."
                  className="w-full rounded-md py-2 pl-9 pr-3 text-sm outline-none"
                  style={{ border: `1px solid ${errors.municipio ? COLORS.danger : COLORS.border}`, color: COLORS.text }}
                  autoComplete="off"
                />
                {municipioOpen && (
                  <div
                    className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-white shadow-lg"
                    style={{ borderColor: COLORS.border }}
                  >
                    {filteredMunicipios.length > 0 ? (
                      filteredMunicipios.map((municipio) => (
                        <button
                          key={municipio}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            updateField("municipio", municipio);
                            setMunicipioOpen(false);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                          style={{ color: COLORS.text }}
                        >
                          {municipio}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm" style={{ color: COLORS.textLight }}>
                        Nenhum município encontrado
                      </p>
                    )}
                  </div>
                )}
                {errors.municipio && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.municipio}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: COLORS.text }}>Memorando</label>
                <input
                  value={form.memorando}
                  onChange={(event) => updateField("memorando", event.target.value)}
                  className="w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{ border: `1px solid ${errors.memorando ? COLORS.danger : COLORS.border}`, color: COLORS.text }}
                />
                {errors.memorando && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.memorando}</p>}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: COLORS.text }}>Operação</label>
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
                        className="rounded-md px-3 py-2 text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: isActive ? COLORS.accent : COLORS.card,
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
                  <div ref={motivoRef} className="relative">
                    <label className="mb-1 block text-sm font-medium" style={{ color: COLORS.text }}>Motivo da devolução</label>
                    <Search size={16} className="absolute left-3 top-[35px]" style={{ color: COLORS.textLight }} />
                    <input
                      value={form.motivoDevolucao}
                      onChange={(event) => {
                        updateField("motivoDevolucao", event.target.value);
                        setMotivoOpen(true);
                      }}
                      onFocus={() => setMotivoOpen(true)}
                      placeholder="Digite para filtrar..."
                      className="w-full rounded-md py-2 pl-9 pr-3 text-sm outline-none"
                      style={{ border: `1px solid ${errors.motivoDevolucao ? COLORS.danger : COLORS.border}`, color: COLORS.text }}
                      autoComplete="off"
                    />
                    {motivoOpen && (
                      <div
                        className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-white shadow-lg"
                        style={{ borderColor: COLORS.border }}
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
                              className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                              style={{ color: COLORS.text }}
                            >
                              {motivo.label}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm" style={{ color: COLORS.textLight }}>
                            Nenhum motivo encontrado
                          </p>
                        )}
                      </div>
                    )}
                    {errors.motivoDevolucao && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.motivoDevolucao}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: COLORS.text }}>Detalhes da devolução</label>
                    <textarea
                      value={form.detalhesDevolucao}
                      onChange={(event) => updateField("detalhesDevolucao", event.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-md px-3 py-2 text-sm outline-none"
                      style={{ border: `1px solid ${errors.detalhesDevolucao ? COLORS.danger : COLORS.border}`, color: COLORS.text }}
                    />
                    {errors.detalhesDevolucao && <p className="mt-1 text-xs" style={{ color: COLORS.danger }}>{errors.detalhesDevolucao}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="group inline-flex items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                style={{ backgroundColor: COLORS.accent }}
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
