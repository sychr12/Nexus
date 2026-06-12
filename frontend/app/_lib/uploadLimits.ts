export const UPLOAD_LIMITS = {
  messageAttachmentMaxBytes: 10 * 1024 * 1024,
  carteiraPhotoMaxBytes: 2 * 1024 * 1024,
  carteiraBatchPdfMaxBytes: 10 * 1024 * 1024,
  carteiraBatchZipMaxBytes: 50 * 1024 * 1024,
  carteiraBatchMaxFiles: 50,
} as const;

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
}

export function validateFileSize(file: File, maxBytes: number, label: string) {
  if (file.size > maxBytes) {
    throw new Error(`${label} deve ter no maximo ${formatBytes(maxBytes)}.`);
  }
}

export function validateCarteiraPhoto(file: File) {
  validateFileSize(file, UPLOAD_LIMITS.carteiraPhotoMaxBytes, "Foto");
  if (!file.type.startsWith("image/")) {
    throw new Error("Apenas imagens sao permitidas nas fotos da carteira.");
  }
}

export function validateBatchPdfs(files: File[]) {
  if (files.length > UPLOAD_LIMITS.carteiraBatchMaxFiles) {
    throw new Error(`Selecione no maximo ${UPLOAD_LIMITS.carteiraBatchMaxFiles} PDFs por lote.`);
  }

  files.forEach((file) => {
    validateFileSize(file, UPLOAD_LIMITS.carteiraBatchPdfMaxBytes, `PDF ${file.name}`);
    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      throw new Error(`Arquivo invalido: ${file.name}. Envie apenas PDFs.`);
    }
  });
}

export function validateBatchZip(file: File) {
  validateFileSize(file, UPLOAD_LIMITS.carteiraBatchZipMaxBytes, "ZIP");
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Envie apenas arquivo ZIP.");
  }
}

export function validateMessageAttachment(file: File) {
  validateFileSize(file, UPLOAD_LIMITS.messageAttachmentMaxBytes, "Anexo");
  if (!file.type.startsWith("image/") && !file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
    throw new Error("Apenas imagem, audio ou video sao permitidos.");
  }
}
