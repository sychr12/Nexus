import { apiFetch, apiJson, throwIfNotOk } from "../../lib/http";
import { Memorando } from "../types/memorando";

type CreateMemorandoPayload = {
  numero: string;
  descricao: string;
  data: string;
  unloc: string;
  municipio?: string;
  memoEntrada?: string;
};

export async function listarMemorandos(): Promise<Memorando[]> {
  return apiJson<Memorando[]>("/memorandos", { cache: "no-store" }, "Erro ao listar memorandos");
}

export async function criarMemorando(data: CreateMemorandoPayload): Promise<Memorando> {
  return apiJson<Memorando>("/memorandos", { method: "POST", body: data }, "Erro ao criar memorando");
}

export async function downloadMemorando(
  id: number
) {
  const response = await apiFetch(`/memorandos/${id}/download`);
  await throwIfNotOk(response, "Erro ao baixar memorando");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
