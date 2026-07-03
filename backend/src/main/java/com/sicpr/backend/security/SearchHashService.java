package com.sicpr.backend.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class SearchHashService {

    private static final String HMAC = "HmacSHA256";

    private final String configuredKey;
    private SecretKeySpec keySpec;

    public SearchHashService(@Value("${app.crypto.search-key:${app.crypto.key}}") String configuredKey) {
        this.configuredKey = configuredKey;
    }

    @PostConstruct
    void validateConfiguration() {
        if (configuredKey == null || configuredKey.trim().length() < 32) {
            throw new IllegalStateException("DATA_SEARCH_HASH_KEY deve ter pelo menos 32 caracteres.");
        }
        keySpec = new SecretKeySpec(deriveKey(configuredKey), HMAC);
    }

    public String cpfHash(String cpf) {
        String normalized = normalizeCpf(cpf);
        if (normalized.isBlank()) {
            return null;
        }
        return hmac(normalized);
    }

    public String normalizeCpf(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }

    private String hmac(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC);
            mac.init(keySpec);
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao gerar hash pesquisavel.", e);
        }
    }

    private byte[] deriveKey(String key) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(key.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao preparar chave de hash.", e);
        }
    }
}
