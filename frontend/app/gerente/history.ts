import type { ProcessoSicpr } from "../fluxo/types";

export type GerenteHistoryStatus = "aprovado" | "devolvido";

export type GerenteHistoryProdutor = {
  id: string;
  produtor: string;
  cpf: string;
  tipoProcesso: ProcessoSicpr["tipoProcesso"];
};

export type GerenteHistoryMemorando = {
  id: string;
  numero: string;
  tipo: GerenteHistoryStatus;
  dataHora: string;
  unidadeLocal: string;
  quantidade: number;
  produtores: GerenteHistoryProdutor[];
  motivo?: string;
  codigoValidacao?: string;
  documentosAssinados?: string[];
};

export function getGerenteHistory(processos: ProcessoSicpr[]): GerenteHistoryMemorando[] {
  const grupos = new Map<string, GerenteHistoryMemorando>();

  processos.forEach((processo) => {
    processo.historico
      .filter((item) =>
        item.acao === "Aprovado e assinado pelo gerente" || item.acao === "Devolvido pelo gerente",
      )
      .forEach((item) => {
        const tipo: GerenteHistoryStatus = item.acao === "Devolvido pelo gerente" ? "devolvido" : "aprovado";
        const dataHora = tipo === "aprovado"
          ? processo.memorandoCriadoEm || processo.gerenteAssinadoEm || item.dataHora
          : item.dataHora;
        const numero = processo.memorandoNumero || getMemorandoNumeroFromObservation(item.observacao) || "sem número";
        const key = tipo === "aprovado"
          ? processo.memorandoLoteId || `aprovado-${numero}-${dataHora}`
          : processo.memorandoLoteId || `devolvido-${processo.unidadeLocal}-${item.observacao || ""}-${item.dataHora.slice(0, 16)}`;
        const produtores = getHistoryProdutores(processo);
        const grupo = grupos.get(key);

        if (grupo) {
          produtores.forEach((produtor) => addHistoryProdutor(grupo, produtor));
          grupo.quantidade = Math.max(grupo.quantidade, grupo.produtores.length);
          return;
        }

        grupos.set(key, {
          id: key,
          numero,
          tipo,
          dataHora,
          unidadeLocal: processo.unidadeLocal,
          quantidade: processo.memorandoQuantidade || produtores.length,
          produtores,
          motivo: tipo === "devolvido" ? item.observacao : undefined,
          codigoValidacao: processo.assinaturaEletronica?.codigoValidacao,
          documentosAssinados: processo.assinaturaEletronica?.documentosAssinados.map((documento) => documento.nome),
        });
      });
  });

  return Array.from(grupos.values())
    .map((grupo) => ({ ...grupo, quantidade: Math.max(grupo.quantidade, grupo.produtores.length) }))
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
}

export function getGerenteHistoryStatusClass(status: GerenteHistoryStatus) {
  return status === "aprovado"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : "bg-red-50 text-red-700 ring-red-100";
}

function getHistoryProdutores(processo: ProcessoSicpr): GerenteHistoryProdutor[] {
  const produtores = processo.memorandoProdutores?.length
    ? processo.memorandoProdutores
    : [{ id: processo.id, produtor: processo.produtor, cpf: processo.cpf, tipoProcesso: processo.tipoProcesso }];

  return produtores.map((produtor) => ({
    id: produtor.id,
    produtor: produtor.produtor,
    cpf: produtor.cpf,
    tipoProcesso: produtor.tipoProcesso,
  }));
}

function addHistoryProdutor(grupo: GerenteHistoryMemorando, produtor: GerenteHistoryProdutor) {
  if (grupo.produtores.some((item) => item.id === produtor.id)) return;
  grupo.produtores.push(produtor);
}

function getMemorandoNumeroFromObservation(observacao?: string) {
  return observacao?.match(/Memorando\s+(.+)/i)?.[1]?.trim();
}
