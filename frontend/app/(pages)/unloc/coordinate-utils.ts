type CoordinateKind = "latitude" | "longitude";

const LATITUDE_PATTERN = /^\(([NS])\) ([0-9]{2})°([0-9]{2})'([0-9]{2}),([0-9]{2})"$/;
const LONGITUDE_PATTERN = /^\(([EW])\) ([0-9]{3})°([0-9]{2})'([0-9]{2}),([0-9]{2})"$/;

const COORDINATE_CONFIG = {
  latitude: {
    degreeDigits: 2,
    fallbackHemisphere: "S",
    allowedHemispheres: ["N", "S"],
    maxDegrees: 90,
    pattern: LATITUDE_PATTERN,
    example: `(S) 08°05'28,62"`,
    label: "Latitude",
  },
  longitude: {
    degreeDigits: 3,
    fallbackHemisphere: "W",
    allowedHemispheres: ["E", "W"],
    maxDegrees: 180,
    pattern: LONGITUDE_PATTERN,
    example: `(W) 067°37'10,93"`,
    label: "Longitude",
  },
} as const;

export function formatCoordinateInput(value: string, kind: CoordinateKind) {
  const config = COORDINATE_CONFIG[kind];
  const cleanValue = removeInvisibleCharacters(value)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º˚]/g, "°")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'");

  if (!cleanValue.trim()) {
    return "";
  }

  const typedHemisphere = cleanValue.match(/[NSEW]/)?.[0];
  const hemisphere = typedHemisphere && (config.allowedHemispheres as readonly string[]).includes(typedHemisphere)
    ? typedHemisphere
    : config.fallbackHemisphere;
  const digits = cleanValue.replace(/\D/g, "").slice(0, config.degreeDigits + 6);
  const degrees = digits.slice(0, config.degreeDigits);
  const minutes = digits.slice(config.degreeDigits, config.degreeDigits + 2);
  const seconds = digits.slice(config.degreeDigits + 2, config.degreeDigits + 4);
  const decimals = digits.slice(config.degreeDigits + 4, config.degreeDigits + 6);

  let formatted = `(${hemisphere}) `;
  if (degrees) formatted += degrees;
  if (minutes) formatted += `°${minutes}`;
  if (seconds) formatted += `'${seconds}`;
  if (decimals) formatted += `,${decimals}`;
  if (digits.length === config.degreeDigits + 6) formatted += "\"";

  return formatted.trimEnd();
}

export function normalizeCoordinate(value: string, kind?: CoordinateKind) {
  const normalized = removeInvisibleCharacters(value)
    .trim()
    .toUpperCase()
    .replace(/[º˚]/g, "°")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ");

  if (!kind) return normalized;
  if (COORDINATE_CONFIG[kind].pattern.test(normalized)) return normalized;

  return formatCoordinateInput(normalized, kind);
}

export function validateLatitude(value: string) {
  return validateCoordinate(normalizeCoordinate(value, "latitude"), "latitude");
}

export function validateLongitude(value: string) {
  return validateCoordinate(normalizeCoordinate(value, "longitude"), "longitude");
}

export function buildGoogleEarthUrl(latitude: string, longitude: string) {
  const coordinates = parseCoordinatePair(latitude, longitude);

  if (!coordinates) {
    return null;
  }

  return `https://earth.google.com/web/search/${coordinates.lat.toFixed(8)},${coordinates.lng.toFixed(8)}`;
}

export function buildGoogleMapsEmbedUrl(latitude: string, longitude: string) {
  const coordinates = parseCoordinatePair(latitude, longitude);

  if (!coordinates) {
    return null;
  }

  const query = `${coordinates.lat.toFixed(8)},${coordinates.lng.toFixed(8)}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=17&output=embed`;
}

function parseCoordinatePair(latitude: string, longitude: string) {
  const lat = parseCoordinate(normalizeCoordinate(latitude, "latitude"), "latitude");
  const lng = parseCoordinate(normalizeCoordinate(longitude, "longitude"), "longitude");

  if (lat == null || lng == null) {
    return null;
  }

  return { lat, lng };
}

function parseCoordinate(value: string, kind: CoordinateKind) {
  const config = COORDINATE_CONFIG[kind];
  const match = value.match(config.pattern);
  if (!match) return null;

  const hemisphere = match[1];
  const degrees = Number(match[2]);
  const minutes = Number(match[3]);
  const seconds = Number(`${match[4]}.${match[5]}`);
  const decimal = degrees + minutes / 60 + seconds / 3600;

  return hemisphere === "S" || hemisphere === "W" ? -decimal : decimal;
}

function validateCoordinate(value: string, kind: CoordinateKind) {
  const config = COORDINATE_CONFIG[kind];

  if (!value) {
    return `${config.label} é obrigatória.`;
  }

  if (hasInvisibleCharacter(value)) {
    return `${config.label} não deve conter espaços ocultos, tabulações ou caracteres invisíveis.`;
  }

  const match = value.match(config.pattern);
  if (!match) {
    return `${config.label} deve estar no formato oficial ${config.example}.`;
  }

  const hemisphere = match[1];
  const degrees = Number(match[2]);
  const minutes = Number(match[3]);
  const seconds = Number(match[4]);
  const decimals = Number(match[5]);

  if (!(config.allowedHemispheres as readonly string[]).includes(hemisphere)) {
    const allowed = config.allowedHemispheres.join(" ou ");
    return `${config.label} deve usar direção ${allowed}.`;
  }

  if (degrees > config.maxDegrees) {
    return `${config.label} possui graus fora do intervalo permitido.`;
  }

  if (minutes > 59) {
    return `${config.label} possui minutos fora do intervalo permitido.`;
  }

  if (seconds > 59 || decimals > 99) {
    return `${config.label} possui segundos fora do intervalo permitido.`;
  }

  if (degrees === config.maxDegrees && (minutes !== 0 || seconds !== 0 || decimals !== 0)) {
    return `${config.label} no limite máximo deve possuir minutos e segundos zerados.`;
  }

  return "";
}

function removeInvisibleCharacters(value: string) {
  return Array.from(value || "")
    .filter((char) => !["\t", "\n", "\r", "\u00A0", "\u200B", "\u200C", "\u200D", "\uFEFF"].includes(char))
    .join("");
}

function hasInvisibleCharacter(value: string) {
  return Array.from(value).some((char) =>
    ["\t", "\n", "\r", "\u00A0", "\u200B", "\u200C", "\u200D", "\uFEFF"].includes(char),
  );
}
