import type { GerenteUnidade, ProcessoSicpr } from "./types";
import { FLUXO_PROCESSOS_KEY, GERENTES_UNIDADE_KEY } from "./constants";
import { normalizeGerenteUnidade, normalizeProcesso } from "./normalizers";
import { createSeedGerentes, createSeedProcessos } from "./seeds";
export function loadProcessos(): ProcessoSicpr[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(localStorage.getItem(FLUXO_PROCESSOS_KEY) || "[]") as ProcessoSicpr[];
    if (stored.length > 0) {
      const migrated = stored.map(normalizeProcesso);
      saveProcessos(migrated);
      return migrated;
    }
  } catch {
    localStorage.removeItem(FLUXO_PROCESSOS_KEY);
  }

  const seed = createSeedProcessos();
  saveProcessos(seed);
  return seed;
}

export function saveProcessos(processos: ProcessoSicpr[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FLUXO_PROCESSOS_KEY, JSON.stringify(processos));
}

export function loadGerentesUnidade(): GerenteUnidade[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(localStorage.getItem(GERENTES_UNIDADE_KEY) || "[]") as GerenteUnidade[];
    if (stored.length > 0) return stored.map(normalizeGerenteUnidade);
  } catch {
    localStorage.removeItem(GERENTES_UNIDADE_KEY);
  }

  const seed = createSeedGerentes();
  saveGerentesUnidade(seed);
  return seed;
}

export function saveGerentesUnidade(gerentes: GerenteUnidade[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GERENTES_UNIDADE_KEY, JSON.stringify(gerentes));
}

