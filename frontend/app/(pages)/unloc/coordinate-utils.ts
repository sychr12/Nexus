const LATITUDE_PATTERN = /^\(([NS])\) ([0-9]{2})°([0-9]{2})'([0-9]{2}),([0-9]{2})"$/;
const LONGITUDE_PATTERN = /^\(([EW])\) ([0-9]{3})°([0-9]{2})'([0-9]{2}),([0-9]{2})"$/;

export function normalizeCoordinate(value: string) {
  return (value || "")
    .trim()
    .replace(/º/g, "°")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'");
}

export function validateLatitude(value: string) {
  return validateCoordinate(normalizeCoordinate(value), LATITUDE_PATTERN, 90, "Latitude");
}

export function validateLongitude(value: string) {
  return validateCoordinate(normalizeCoordinate(value), LONGITUDE_PATTERN, 180, "Longitude");
}

function validateCoordinate(value: string, pattern: RegExp, maxDegrees: number, field: string) {
  if (!value) {
    return `${field} e obrigatoria.`;
  }

  if (hasInvisibleCharacter(value)) {
    return `${field} nao deve conter espacos ocultos, tabulacoes ou caracteres invisiveis.`;
  }

  const match = value.match(pattern);
  if (!match) {
    return `${field} deve estar no formato oficial DMS.`;
  }

  const degrees = Number(match[2]);
  const minutes = Number(match[3]);
  const seconds = Number(match[4]);
  const decimals = Number(match[5]);

  if (degrees > maxDegrees) {
    return `${field} possui graus fora do intervalo permitido.`;
  }

  if (minutes > 59) {
    return `${field} possui minutos fora do intervalo permitido.`;
  }

  if (seconds > 59 || decimals > 99) {
    return `${field} possui segundos fora do intervalo permitido.`;
  }

  if (degrees === maxDegrees && (minutes !== 0 || seconds !== 0 || decimals !== 0)) {
    return `${field} no limite maximo deve possuir minutos e segundos zerados.`;
  }

  return "";
}

function hasInvisibleCharacter(value: string) {
  return Array.from(value).some((char) =>
    ["\t", "\n", "\r", "\u00A0", "\u200B", "\u200C", "\u200D", "\uFEFF"].includes(char),
  );
}
