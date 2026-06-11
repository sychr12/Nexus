import type { AnexoUpload } from "./config";

export function fileToAnexo(file: File): Promise<AnexoUpload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
        nome: file.name,
        arquivo: file.name,
        conteudo: String(reader.result || ""),
        mimeType: file.type,
        tamanho: file.size,
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(size?: number) {
  if (!size) return "Tamanho nao informado";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
