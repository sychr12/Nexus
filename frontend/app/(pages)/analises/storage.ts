/**
 * Camada de persistência de dados usando localStorage.
 * Gerencia:
 * - ANALISES_STORAGE_KEY: memorandos completos (para edição contínua)
 * - ANALISES_LANCAMENTOS_KEY: encaminhamentos para lançamento
 * - ANALISES_DEVOLUCOES_KEY: encaminhamentos para devolução
 * 
 * Funções:
 * - buildEncaminhamento: constrói registro de encaminhamento com dados do processo
 * - appendEncaminhamentos: adiciona/atualiza encaminhamentos no localStorage
 * 
 * ⚠️ Temporário: será substituído por persistência em banco de dados real.
 */


import { GCC_STATUS_LABELS, TIPO_IDENTIFICADO_LABELS } from "./data";
import { getProcessoGccStatus, getProcessoTipo } from "./rules";
import type { DispatchTarget, EncaminhamentoAnalise, MemorandoAnalise, ProcessoProdutor } from "./types";

export const ANALISES_STORAGE_KEY = "sicpr-analises-memorandos";
export const ANALISES_LANCAMENTOS_KEY = "sicpr-analises-lancamentos";
export const ANALISES_DEVOLUCOES_KEY = "sicpr-analises-devolucoes";

export const buildEncaminhamento = (
  memorando: MemorandoAnalise,
  processo: ProcessoProdutor,
  destino: DispatchTarget,
  encaminhadoEm: string,
): EncaminhamentoAnalise => ({
  id: `${memorando.id}-${processo.id}-${destino}`,
  memorandoId: memorando.id,
  memorandoNumero: memorando.numero,
  memorandoTitulo: memorando.titulo,
  memorandoPdf: memorando.memorandoPdf,
  produtorId: processo.id,
  produtor: processo.produtor,
  cpf: processo.cpf,
  localidade: memorando.localidade,
  processoPdf: processo.processoPdf,
  declaracaoPdf: processo.declaracaoPdf,
  tipoIdentificado: TIPO_IDENTIFICADO_LABELS[getProcessoTipo(processo)],
  resultadoConsulta: GCC_STATUS_LABELS[getProcessoGccStatus(processo)],
  dataDeclaracao: processo.dataDeclaracao,
  recebidoEm: memorando.recebidoEm,
  encaminhadoEm,
  destino,
  motivo: processo.motivoDevolucao,
  observacao: processo.observacao,
});

export const appendEncaminhamentos = (destino: DispatchTarget, encaminhamentos: EncaminhamentoAnalise[]) => {
  if (encaminhamentos.length === 0 || typeof window === "undefined") return;

  const storageKey = destino === "lancamento" ? ANALISES_LANCAMENTOS_KEY : ANALISES_DEVOLUCOES_KEY;
  const oppositeStorageKey = destino === "lancamento" ? ANALISES_DEVOLUCOES_KEY : ANALISES_LANCAMENTOS_KEY;
  const oppositeDestino: DispatchTarget = destino === "lancamento" ? "devolucao" : "lancamento";
  let current: EncaminhamentoAnalise[] = [];
  let oppositeCurrent: EncaminhamentoAnalise[] = [];

  try {
    current = JSON.parse(localStorage.getItem(storageKey) || "[]") as EncaminhamentoAnalise[];
  } catch {
    current = [];
  }

  try {
    oppositeCurrent = JSON.parse(localStorage.getItem(oppositeStorageKey) || "[]") as EncaminhamentoAnalise[];
  } catch {
    oppositeCurrent = [];
  }

  const byId = new Map(current.map((item) => [item.id, item]));
  encaminhamentos.forEach((item) => byId.set(item.id, item));
  localStorage.setItem(storageKey, JSON.stringify(Array.from(byId.values())));

  const oppositeIds = new Set(encaminhamentos.map((item) => item.id.replace(`-${destino}`, `-${oppositeDestino}`)));
  localStorage.setItem(
    oppositeStorageKey,
    JSON.stringify(oppositeCurrent.filter((item) => !oppositeIds.has(item.id))),
  );
};
