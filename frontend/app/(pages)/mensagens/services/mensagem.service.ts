// app/mensagens/services/mensagem.service.ts
import type { Mensagem } from "../types/mensagem";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
}

export const mensagemService = {
  async listar(): Promise<Mensagem[]> {
    try {
      const response = await fetch(`${API_URL}/api/mensagens`, {
        method: "GET",
        headers: authHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status} ao carregar mensagens`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[mensagemService.listar]", error);
      throw error;
    }
  },

  async enviar(destinatarioId: number, texto: string, anexo?: File | null): Promise<Mensagem> {
    try {
      const formData = new FormData();
      formData.append("destinatarioId", String(destinatarioId));
      if (texto?.trim()) formData.append("texto", texto.trim());
      if (anexo) formData.append("anexo", anexo);

      // Não definir Content-Type manualmente para FormData
      const response = await fetch(`${API_URL}/api/mensagens`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status} ao enviar mensagem`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[mensagemService.enviar]", error);
      throw error;
    }
  },

  async carregarAnexo(anexoUrl: string): Promise<string> {
    try {
      // Garantir que a URL comece com /api se necessário
      const url = anexoUrl.startsWith("/api") ? anexoUrl : `/api${anexoUrl.startsWith("/") ? anexoUrl : `/${anexoUrl}`}`;
      
      const response = await fetch(`${API_URL}${url}`, {
        method: "GET",
        headers: authHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status} ao carregar anexo`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("[mensagemService.carregarAnexo]", error);
      throw error;
    }
  },
};