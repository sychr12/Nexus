// frontend/app/carteira/services/carteiraService.ts
import API_URL from "../lib/api";
import {
  CarteiraResponse,
  CarteiraRequest,
  FiltroBusca,
  PageResponse,
  CarteiraEstatistica,
  CarteiraEntrada,
  CarteiraUsuario,
  CarteiraForm,
} from "../types/carteira";

function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

function getHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function throwOnError(response: Response) {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response;
}

// ============ CARTEIRA DIGITAL - PRODUTOR RURAL ============

export async function cadastrarCarteira(data: CarteiraRequest): Promise<CarteiraResponse> {
  const formData = new FormData();
  
  formData.append("registro", data.registro);
  formData.append("cpf", data.cpf);
  formData.append("nome", data.nome);
  formData.append("propriedade", data.propriedade);
  formData.append("unloc", data.unloc);
  formData.append("inicio", data.inicio);
  formData.append("validade", data.validade);
  formData.append("endereco", data.endereco);
  formData.append("atividade1", data.atividade1);
  formData.append("atividade2", data.atividade2);
  formData.append("georef", data.georef);
  
  if (data.fotos) {
    data.fotos.forEach((foto) => {
      if (foto) {
        formData.append("fotos", foto);
      }
    });
  }

  const token = getAuthToken();
  const response = await fetch(`${API_URL}/carteira`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  await throwOnError(response);
  return response.json();
}


export async function listarCarteiras(
  page: number = 0,
  size: number = 10
): Promise<PageResponse<CarteiraResponse>> {
  const response = await fetch(`${API_URL}/carteira/listar?page=${page}&size=${size}`, {
    method: "GET",
    headers: getHeaders(),
  });
  await throwOnError(response);
  return response.json();
}

export async function buscarCarteirasComFiltros(
  filtro: FiltroBusca,
  page: number = 0,
  size: number = 10
): Promise<PageResponse<CarteiraResponse>> {
  const params = new URLSearchParams();
  if (filtro.termoPesquisa) params.append("termoPesquisa", filtro.termoPesquisa);
  if (filtro.periodo) params.append("periodo", filtro.periodo);
  if (filtro.usuario) params.append("usuario", filtro.usuario);
  params.append("page", page.toString());
  params.append("size", size.toString());

  const response = await fetch(`${API_URL}/carteira/buscar?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  });
  await throwOnError(response);
  return response.json();
}

export async function buscarCarteiraPorId(id: number): Promise<CarteiraResponse> {
  const response = await fetch(`${API_URL}/carteira/${id}`, {
    method: "GET",
    headers: getHeaders(),
  });
  await throwOnError(response);
  return response.json();
}

export async function buscarPorCpf(cpf: string): Promise<CarteiraResponse> {
  const response = await fetch(`${API_URL}/carteira/cpf/${cpf}`, {
    method: "GET",
    headers: getHeaders(),
  });
  await throwOnError(response);
  return response.json();
}

export async function baixarPdf(id: number, nome: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/carteira/pdf/${id}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao baixar PDF");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `carteira_${nome}_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function visualizarPdf(id: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/carteira/visualizar/${id}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao visualizar PDF");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function buscarUsuariosUnicos(): Promise<string[]> {
  const response = await fetch(`${API_URL}/carteira/usuarios`, {
    method: "GET",
    headers: getHeaders(),
  });
  await throwOnError(response);
  return response.json();
}

export async function contarTotalCarteiras(): Promise<number> {
  const response = await fetch(`${API_URL}/carteira/total`, {
    method: "GET",
    headers: getHeaders(),
  });
  await throwOnError(response);
  return response.json();
}

export async function buscarEstatisticas(): Promise<CarteiraEstatistica> {
  const [total, usuarios, lista] = await Promise.all([
    contarTotalCarteiras(),
    buscarUsuariosUnicos(),
    listarCarteiras(0, 100),
  ]);

  const totalPorUnloc: Record<string, number> = {};
  lista.content.forEach((carteira) => {
    totalPorUnloc[carteira.unloc] = (totalPorUnloc[carteira.unloc] || 0) + 1;
  });

  return {
    totalCarteiras: total,
    totalUsuarios: usuarios.length,
    totalPorUnloc,
  };
}

// ============ MÉTODOS PARA UPLOAD EM LOTE ============

// CORRIGIDO: método para enviar múltiplos arquivos PDF
export async function enviarBatchFiles(files: File[]): Promise<BatchResult> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });
  
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/carteira/batch/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  await throwOnError(response);
  return response.json();
}

// CORRIGIDO: método para enviar arquivo ZIP
export async function enviarBatchZip(file: File): Promise<BatchResult> {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/carteira/batch/zip`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  await throwOnError(response);
  return response.json();
}

// ============ TIPOS PARA BATCH ============

export interface BatchResult {
  batchId: string;
  totalArquivos: number;
  sucessos: number;
  erros: number;
  ignorados: number;
  tempoTotalMs: number;
  detalhes: BatchItem[];
}

export interface BatchItem {
  arquivo: string;
  cpf: string;
  sucesso: boolean;
  mensagem: string;
}

// ============ MÉTODOS LEGADOS PARA COMPATIBILIDADE ============

export async function buscarUsuarios(): Promise<CarteiraUsuario[]> {
  const usuarios = await buscarUsuariosUnicos();
  return usuarios.map((nome, index) => ({
    id: String(index + 1),
    nome,
  }));
}

export async function listarCarteirasLegado(): Promise<CarteiraEntrada[]> {
  const response = await listarCarteiras(0, 100);
  return response.content.map((c) => ({
    id: c.id,
    descricao: `${c.nome} - ${c.propriedade}`,
    valor: 0,
    data: c.createdAt,
    usuario: c.usuario,
  }));
}

export async function cadastrarCarteiraLegado(payload: CarteiraForm): Promise<CarteiraEntrada> {
  const request: CarteiraRequest = {
    registro: payload.descricao,
    cpf: "00000000000",
    nome: payload.descricao,
    propriedade: payload.descricao,
    unloc: "MAO",
    inicio: new Date().toISOString(),
    validade: new Date().toISOString(),
    endereco: "",
    atividade1: "",
    atividade2: "",
    georef: "",
  };
  
  const response = await cadastrarCarteira(request);
  return {
    id: response.id,
    descricao: response.nome,
    valor: payload.valor,
    data: response.createdAt,
    usuario: response.usuario,
  };
}
