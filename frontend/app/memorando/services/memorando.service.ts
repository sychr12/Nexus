import API_URL from "../lib/api";
import { Memorando } from "../types/memorando";

export async function listarMemorandos(): Promise<Memorando[]> {
  const response = await fetch(
    `${API_URL}/memorandos`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao listar memorandos");
  }

  return response.json();
}

export async function criarMemorando(data: any) {
  const response = await fetch(
    `${API_URL}/memorandos`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

  window.open(
    `${API_URL}/memorandos/${id}/download`,
    "_blank"
  );
}