// app/email/types/email.ts
export interface EmailAnexo {
    id: number;
    emailId: string;
    remetente: string;
    assunto: string;
    municipio: string;
    dataEmail: string;
    nomeArquivo: string;
    mimeType: string;
    criadoEm: string;
}

export interface EmailStats {
    total: number;
    hoje: number;
    estaSemana: number;
    esteMes: number;
    porMunicipio: Record<string, number>;
}

export interface DownloadRequest {
    email: string;
    senha: string;
    apenasNaoLidos: boolean;
}

export interface DownloadResponse {
    success: boolean;
    processados: number;
    message: string;
}