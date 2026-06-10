export interface UnlocOption {
  municipio: string;
  value: string;
  label: string;
}

export const UNLOC_CODES: Record<string, string> = {
  "Alvarães": "ALV",
  "Amaturá": "AMT",
  "Anamã": "ANA",
  "Anori": "ANO",
  "Apuí": "APU",
  "Atalaia do Norte": "ATN",
  "Autazes": "AUT",
  "Barcelos": "BAR",
  "Barreirinha": "BRR",
  "Benjamin Constant": "BCT",
  "Beruri": "BER",
  "Boa Vista do Ramos": "BVR",
  "Boca do Acre": "BAC",
  "Borba": "BOR",
  "Caapiranga": "CAP",
  "Canutama": "CAN",
  "Carauari": "CAR",
  "Careiro": "CAI",
  "Careiro da Várzea": "CAV",
  "Coari": "COA",
  "Codajás": "COD",
  "Eirunepé": "EIR",
  "Envira": "ENV",
  "Fonte Boa": "FBO",
  "Guajará": "GUA",
  "Humaitá": "HUM",
  "Ipixuna": "IPI",
  "Iranduba": "IRA",
  "Itacoatiara": "ITA",
  "Itamarati": "ITM",
  "Itapiranga": "ITP",
  "Japurá": "JAP",
  "Juruá": "JUR",
  "Jutaí": "JUT",
  "Lábrea": "LAB",
  "Manacapuru": "MAN",
  "Manaquiri": "MAQ",
  "Manaus": "MAO",
  "Manicoré": "MCO",
  "Maraã": "MAR",
  "Maués": "MAU",
  "Nhamundá": "NHA",
  "Nova Olinda do Norte": "NON",
  "Novo Airão": "NAI",
  "Novo Aripuanã": "NAR",
  "Parintins": "PAR",
  "Pauini": "PAU",
  "Presidente Figueiredo": "PFIG",
  "Rio Preto da Eva": "RPE",
  "Santa Isabel do Rio Negro": "SIRN",
  "Santo Antônio do Içá": "SAI",
  "São Gabriel da Cachoeira": "SGC",
  "São Paulo de Olivença": "SPOL",
  "São Sebastião do Uatumã": "SSU",
  "Silves": "SIL",
  "Tabatinga": "TAB",
  "Tapauá": "TAP",
  "Tefé": "TEF",
  "Tonantins": "TON",
  "Uarini": "UAR",
  "Urucará": "URC",
  "Urucurituba": "URU",
};

export const UNLOC_OPTIONS: UnlocOption[] = Object.entries(UNLOC_CODES).map(
  ([municipio, value]) => ({
    municipio,
    value,
    label: `${value} — ${municipio}`,
  })
);

export function normalizeUnlocText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getUnlocByCode(value: string) {
  return UNLOC_OPTIONS.find((option) => option.value === value);
}

export function getUnlocByMunicipio(value: string) {
  const normalized = normalizeUnlocText(value);
  return UNLOC_OPTIONS.find((option) => normalizeUnlocText(option.municipio) === normalized);
}

export function filterUnlocOptions(search: string) {
  const term = normalizeUnlocText(search);

  if (!term) {
    return UNLOC_OPTIONS;
  }

  return UNLOC_OPTIONS.filter(
    (option) =>
      normalizeUnlocText(option.municipio).includes(term) ||
      normalizeUnlocText(option.value).includes(term)
  );
}
