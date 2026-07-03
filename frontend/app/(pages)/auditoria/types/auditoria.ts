export type AuditResult = "SUCESSO" | "FALHA" | "";

export type AuditEvent = {
  id: number;
  ocorreuEm: string;
  usuario: string | null;
  acao: string;
  recursoTipo: string | null;
  recursoId: string | null;
  metodoHttp: string | null;
  caminho: string | null;
  statusHttp: number | null;
  resultado: string;
  ipOrigem: string | null;
  userAgent: string | null;
  correlationId: string | null;
  detalhes: string | null;
};

export type AuditFilters = {
  usuario: string;
  acao: string;
  resultado: AuditResult;
  recursoTipo: string;
  recursoId: string;
  de: string;
  ate: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};
