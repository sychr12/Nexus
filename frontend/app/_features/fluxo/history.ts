import type { HistoricoProcesso } from "./types";
import { nowIso, uid } from "./utils";
export function historico(usuario: string, acao: string, observacao?: string): HistoricoProcesso {
  return {
    id: uid("hist"),
    usuario,
    acao,
    dataHora: nowIso(),
    observacao,
  };
}

