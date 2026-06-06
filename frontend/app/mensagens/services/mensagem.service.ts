import type { Mensagem } from "../types/mensagem";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export const mensagemService = {
  async listar(): Promise<Mensagem[]> {
    const response = await fetch(`${API_URL}/api/mensagens`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erro ao carregar mensagens");
    }

    return response.json();
  },

  async enviar(destinatarioId: number, texto: string, anexo?: File | null): Promise<Mensagem> {
    const formData = new FormData();
    formData.append("destinatarioId", String(destinatarioId));
    if (texto.trim()) formData.append("texto", texto.trim());
    if (anexo) formData.append("anexo", anexo);

    const response = await fetch(`${API_URL}/api/mensagens`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erro ao enviar mensagem");
    }

    return response.json();
  },

  async carregarAnexo(anexoUrl: string): Promise<string> {
    const response = await fetch(`${API_URL}${anexoUrl}`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erro ao carregar anexo");
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};
