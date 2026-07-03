export type PasswordRule = {
  id: string;
  label: string;
  valid: boolean;
};

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: "length",
      label: "Entre 8 e 120 caracteres",
      valid: password.length >= 8 && password.length <= 120,
    },
    {
      id: "spaces",
      label: "Sem espaços",
      valid: password.length > 0 && !/\s/u.test(password),
    },
    {
      id: "uppercase",
      label: "Pelo menos uma letra maiúscula",
      valid: Array.from(password).some((char) => char.toLocaleUpperCase() === char && char.toLocaleLowerCase() !== char),
    },
    {
      id: "lowercase",
      label: "Pelo menos uma letra minúscula",
      valid: Array.from(password).some((char) => char.toLocaleLowerCase() === char && char.toLocaleUpperCase() !== char),
    },
    {
      id: "number",
      label: "Pelo menos um número",
      valid: /\p{N}/u.test(password),
    },
    {
      id: "special",
      label: "Pelo menos um caractere especial",
      valid: /[^\p{L}\p{N}\s]/u.test(password),
    },
  ];
}

export function isPasswordPolicyValid(password: string) {
  return getPasswordRules(password).every((rule) => rule.valid);
}
