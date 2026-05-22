import API_URL from "../lib/api";
import { Memorando } from "../types/memorando";

type CreateMemorandoPayload = {
  numero: string;
  descricao: string;
  data: string;
  unloc: string;
  municipio?: string;
  memoEntrada?: string;
};

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listarMemorandos(): Promise<Memorando[]> {
  const response = await fetch(
    `${API_URL}/memorandos`,
    {
      cache: "no-store",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao listar memorandos");
  }

  return response.json();
}

export async function criarMemorando(data: CreateMemorandoPayload): Promise<Memorando> {
  const response = await fetch(
    `${API_URL}/memorandos`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao criar memorando");
  }

  return response.json();
}

export async function downloadMemorando(
  id: number
) {
  const response = await fetch(`${API_URL}/memorandos/${id}/download`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao baixar memorando");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
