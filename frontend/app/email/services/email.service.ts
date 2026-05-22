// app/email/services/email.service.ts
import { EmailAnexo, EmailStats, DownloadRequest, DownloadResponse } from '../types/email';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

function authHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export const emailService = {
    async listarEmails(page: number = 0, size: number = 20): Promise<{ content: EmailAnexo[], totalElements: number }> {
        const response = await fetch(`${API_URL}/email/listar?page=${page}&size=${size}`, {
            headers: authHeaders(),
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Erro ao listar emails');
        return response.json();
    },

    async buscarEmails(texto: string, page: number = 0, size: number = 20): Promise<{ content: EmailAnexo[], totalElements: number }> {
        const response = await fetch(`${API_URL}/email/buscar?texto=${encodeURIComponent(texto)}&page=${page}&size=${size}`, {
            headers: authHeaders(),
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Erro ao buscar emails');
        return response.json();
    },

    async buscarPorMunicipio(municipio: string, page: number = 0, size: number = 20): Promise<{ content: EmailAnexo[], totalElements: number }> {
        const response = await fetch(`${API_URL}/email/municipio/${encodeURIComponent(municipio)}?page=${page}&size=${size}`, {
            headers: authHeaders(),
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Erro ao buscar por município');
        return response.json();
    },

    async downloadPdf(id: number): Promise<Blob> {
        const response = await fetch(`${API_URL}/email/download/${id}`, {
            headers: authHeaders(),
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Erro ao baixar PDF');
        return response.blob();
    },

    async obterEstatisticas(): Promise<EmailStats> {
        const response = await fetch(`${API_URL}/email/stats`, {
            headers: authHeaders(),
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Erro ao obter estatísticas');
        return response.json();
    },

    async processarEmails(request: DownloadRequest): Promise<DownloadResponse> {
        const response = await fetch(`${API_URL}/email/processar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(request),
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Erro ao processar emails');
        return response.json();
    }
};
