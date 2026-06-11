import type { GerenteUnidade } from "./types";
import { nowIso, uid } from "./utils";
export function salvarGerenteUnidade(
  gerentes: GerenteUnidade[],
  input: Omit<GerenteUnidade, "id" | "cadastradoEm" | "encerradoEm"> & { id?: string },
) {
  const dataHora = nowIso();
  const normalizedStatus = input.status || "ativo";

  if (input.id) {
    return gerentes.map((gerente) => {
      if (gerente.id !== input.id) return gerente;
      const encerradoEm = normalizedStatus === "inativo" ? gerente.encerradoEm || dataHora : undefined;
      return {
        ...gerente,
        nome: input.nome,
        unidadeLocal: input.unidadeLocal,
        cargo: input.cargo,
        telefoneCorporativo: input.telefoneCorporativo,
        telefonePessoal: input.telefonePessoal,
        status: normalizedStatus,
        encerradoEm,
      };
    });
  }

  return [
    {
      id: uid("ger"),
      nome: input.nome,
      unidadeLocal: input.unidadeLocal,
      cargo: input.cargo,
      telefoneCorporativo: input.telefoneCorporativo,
      telefonePessoal: input.telefonePessoal,
      status: normalizedStatus,
      cadastradoEm: dataHora,
      encerradoEm: normalizedStatus === "inativo" ? dataHora : undefined,
    },
    ...gerentes,
  ];
}

export function inativarGerenteUnidade(gerentes: GerenteUnidade[], id: string) {
  const dataHora = nowIso();
  return gerentes.map((gerente) =>
    gerente.id === id
      ? { ...gerente, status: "inativo" as const, encerradoEm: gerente.encerradoEm || dataHora }
      : gerente,
  );
}

export function getGerentesAssinantesDaUnidade(gerentes: GerenteUnidade[], unidadeLocal: string) {
  return gerentes.filter(
    (gerente) =>
      gerente.unidadeLocal === unidadeLocal &&
      (gerente.status === "ativo" || gerente.status === "respondendo"),
  );
}

