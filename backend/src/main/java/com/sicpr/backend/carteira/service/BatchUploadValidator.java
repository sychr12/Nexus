package com.sicpr.backend.carteira.service;

import com.sicpr.backend.config.UploadSecurityProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class BatchUploadValidator {

    private final UploadSecurityProperties uploadSecurityProperties;

    public void validarListaArquivos(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Envie ao menos um arquivo PDF.");
        }
        if (files.size() > maxBatchFiles()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Quantidade de PDFs acima do limite permitido.");
        }
    }

    public void validarPdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo PDF vazio.");
        }
        if (file.getSize() > maxPdfBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "PDF excede o limite permitido.");
        }

        String nomeArquivo = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!nomeArquivo.endsWith(".pdf") || (!contentType.isBlank() && !contentType.equals("application/pdf"))) {
            throw new IllegalArgumentException("Apenas arquivos PDF sao permitidos.");
        }
        if (!hasPdfSignature(file)) {
            throw new IllegalArgumentException("Arquivo PDF invalido.");
        }
    }

    public void validarZip(MultipartFile zipFile) {
        if (zipFile == null || zipFile.isEmpty()) {
            throw new IllegalArgumentException("Arquivo ZIP vazio.");
        }
        if (zipFile.getSize() > uploadSecurityProperties.carteiraBatchZipMaxBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "ZIP excede o limite permitido.");
        }

        String nomeArquivo = zipFile.getOriginalFilename() == null ? "" : zipFile.getOriginalFilename().toLowerCase();
        String contentType = zipFile.getContentType() == null ? "" : zipFile.getContentType().toLowerCase(Locale.ROOT);
        if (!nomeArquivo.endsWith(".zip")
                || (!contentType.isBlank()
                && !Set.of("application/zip", "application/x-zip-compressed", "application/octet-stream").contains(contentType))) {
            throw new IllegalArgumentException("Apenas arquivos ZIP sao permitidos.");
        }
        if (!hasZipSignature(zipFile)) {
            throw new IllegalArgumentException("Arquivo ZIP invalido.");
        }
    }

    public boolean isUnsafeZipEntry(String name) {
        if (name == null || name.isBlank()) {
            return true;
        }
        String normalized = name.replace('\\', '/');
        return normalized.startsWith("/")
                || normalized.contains("../")
                || normalized.contains("..\\")
                || normalized.matches("^[A-Za-z]:.*");
    }

    public int maxBatchFiles() {
        return uploadSecurityProperties.getCarteiraBatchMaxFiles();
    }

    public int maxZipEntries() {
        return uploadSecurityProperties.getCarteiraBatchMaxZipEntries();
    }

    public long maxPdfBytes() {
        return uploadSecurityProperties.carteiraBatchPdfMaxBytes();
    }

    private boolean hasPdfSignature(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(5);
            return header.length == 5
                    && header[0] == '%'
                    && header[1] == 'P'
                    && header[2] == 'D'
                    && header[3] == 'F'
                    && header[4] == '-';
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nao foi possivel validar o PDF.");
        }
    }

    private boolean hasZipSignature(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(4);
            return header.length >= 4
                    && header[0] == 'P'
                    && header[1] == 'K'
                    && (header[2] == 3 || header[2] == 5 || header[2] == 7)
                    && (header[3] == 4 || header[3] == 6 || header[3] == 8);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nao foi possivel validar o ZIP.");
        }
    }
}
