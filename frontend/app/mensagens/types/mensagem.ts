export type Mensagem = {
  id: number;
  remetenteId: number;
  remetenteNome: string;
  remetenteCargo?: string;
  destinatarioId: number;
  destinatarioNome: string;
  destinatarioCargo?: string;
  texto?: string;
  anexoNomeOriginal?: string;
  anexoContentType?: string;
  anexoTamanho?: number;
  anexoUrl?: string;
  lida: boolean;
  criadoEm: string;
  expiraEm: string;
};

export type MensagemUser = {
  id: number;
  username: string;
  email?: string;
  nomeCompleto?: string;
  perfil?: string;
  status?: string;
};
