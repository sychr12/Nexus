package com.sicpr.backend.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Arrays;

@Service
public class CryptoService {

    private static final String PREFIX = "v1:";
    private static final String CIPHER = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final byte[] BINARY_PREFIX = "SICPR1".getBytes(StandardCharsets.US_ASCII);

    private final String configuredKey;
    private final SecureRandom secureRandom = new SecureRandom();
    private SecretKeySpec secretKey;

    public CryptoService(@Value("${app.crypto.key}") String configuredKey) {
        this.configuredKey = configuredKey;
    }

    @PostConstruct
    void validateConfiguration() {
        if (configuredKey == null || configuredKey.trim().length() < 32) {
            throw new IllegalStateException("DATA_ENCRYPTION_KEY deve ter pelo menos 32 caracteres.");
        }

        secretKey = new SecretKeySpec(deriveKey(configuredKey), "AES");
    }

    public String encrypt(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        if (value.startsWith(PREFIX)) {
            return value;
        }

        try {
            byte[] iv = new byte[IV_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_BITS, iv));
            byte[] cipherText = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));

            ByteBuffer payload = ByteBuffer.allocate(iv.length + cipherText.length);
            payload.put(iv);
            payload.put(cipherText);

            return PREFIX + Base64.getEncoder().encodeToString(payload.array());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao criptografar dado sensivel.", e);
        }
    }

    public String decrypt(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        if (!value.startsWith(PREFIX)) {
            return decryptLegacyBase64(value);
        }

        try {
            byte[] payload = Base64.getDecoder().decode(value.substring(PREFIX.length()));
            ByteBuffer buffer = ByteBuffer.wrap(payload);

            byte[] iv = new byte[IV_BYTES];
            buffer.get(iv);

            byte[] cipherText = new byte[buffer.remaining()];
            buffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(CIPHER);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_BITS, iv));

            return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao descriptografar dado sensivel.", e);
        }
    }

    public boolean isEncrypted(String value) {
        return value != null && value.startsWith(PREFIX);
    }

    public byte[] encryptBytes(byte[] value) {
        if (value == null || value.length == 0) {
            return new byte[0];
        }
        if (hasBinaryPrefix(value)) {
            return value;
        }

        try {
            byte[] iv = new byte[IV_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_BITS, iv));
            byte[] cipherText = cipher.doFinal(value);

            ByteBuffer payload = ByteBuffer.allocate(BINARY_PREFIX.length + iv.length + cipherText.length);
            payload.put(BINARY_PREFIX);
            payload.put(iv);
            payload.put(cipherText);
            return payload.array();
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao criptografar arquivo sensivel.", e);
        }
    }

    public byte[] decryptBytes(byte[] value) {
        if (value == null || value.length == 0 || !hasBinaryPrefix(value)) {
            return value == null ? new byte[0] : value;
        }

        try {
            ByteBuffer buffer = ByteBuffer.wrap(value);
            buffer.position(BINARY_PREFIX.length);

            byte[] iv = new byte[IV_BYTES];
            buffer.get(iv);
            byte[] cipherText = new byte[buffer.remaining()];
            buffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(CIPHER);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_BITS, iv));
            return cipher.doFinal(cipherText);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao descriptografar arquivo sensivel.", e);
        }
    }

    public boolean isEncryptedBytes(byte[] value) {
        return value != null && hasBinaryPrefix(value);
    }

    private boolean hasBinaryPrefix(byte[] value) {
        return value.length >= BINARY_PREFIX.length
                && Arrays.equals(Arrays.copyOf(value, BINARY_PREFIX.length), BINARY_PREFIX);
    }

    private byte[] deriveKey(String key) {
        try {
            byte[] decoded = Base64.getDecoder().decode(key);
            if (decoded.length == 32) {
                return decoded;
            }
        } catch (IllegalArgumentException ignored) {
            // A chave tambem pode ser informada como texto forte em variavel de ambiente.
        }

        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(key.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao preparar chave de criptografia.", e);
        }
    }

    private String decryptLegacyBase64(String value) {
        try {
            return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value;
        }
    }
}
