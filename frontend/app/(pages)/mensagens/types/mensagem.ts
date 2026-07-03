// app/mensagens/types/mensagem.ts
export interface MensagemUser {
  id: number;
  username: string;
  nomeCompleto: string | null;
  perfil: string | null;
  status: string;
}

export interface Mensagem {
  id: number;
  remetenteId: number;
  remetenteNome: string;
  remetenteCargo: string | null;
  destinatarioId: number;
  destinatarioNome: string;
  destinatarioCargo: string | null;
  texto: string | null;
  anexoNomeOriginal: string | null;
  anexoContentType: string | null;
  anexoTamanho: number | null;
  anexoUrl: string | null;
  lida: boolean;
  criadoEm: string;
  expiraEm: string;
}
