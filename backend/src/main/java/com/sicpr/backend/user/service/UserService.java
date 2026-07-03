package com.sicpr.backend.user.service;

import com.sicpr.backend.security.RoleUtils;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private static final String STATUS_ATIVO = "ATIVO";
    private static final String STATUS_INATIVO = "INATIVO";
    private static final String STATUS_BLOQUEADO = "BLOQUEADO";
    private static final int DEFAULT_LIST_LIMIT = 500;
    private static final int MAX_LIST_LIMIT = 1000;
    private static final String RESET_TOKEN_PREFIX = "IDAM-";
    private static final int RESET_TOKEN_EXPIRATION_MINUTES = 10;

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final SecureRandom secureRandom = new SecureRandom();

    public List<User> findAll() {
        return findAll(DEFAULT_LIST_LIMIT);
    }

    public List<User> findAll(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, MAX_LIST_LIMIT));
        return repository.findAll(PageRequest.of(0, safeLimit)).getContent();
    }

    @SuppressWarnings("null")
    public User findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado."));
    }

    public User findByUsername(String username) {
        return repository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado."));
    }

    @SuppressWarnings("null")
    @Transactional
    public User create(User user) {
        if (!StringUtils.hasText(user.getUsername())) {
            throw new IllegalArgumentException("Username e obrigatorio");
        }
        if (!StringUtils.hasText(user.getPassword())) {
            throw new IllegalArgumentException("Senha e obrigatoria");
        }
        passwordPolicy.validate(user.getPassword(), user.getUsername());
        if (repository.findByUsername(user.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username ja existe");
        }
        user.setUsername(user.getUsername().trim());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus(normalizeStatus(user.getStatus(), STATUS_ATIVO));
        user.setPerfil(RoleUtils.normalizeRole(user.getPerfil()));
        user.setUnidadeLocal(normalizeUnidadeLocal(user.getUnidadeLocal(), user.getPerfil()));
        user.setTentativasFalhas(0);
        User saved = repository.save(user);
        log.info("Usuário criado: {}", saved.getUsername());
        return saved;
    }

    @Transactional
    public User update(Long id, User userUpdate) {
        User existing = findById(id);
        existing.setNomeCompleto(userUpdate.getNomeCompleto());
        existing.setTelefone(userUpdate.getTelefone());
        existing.setPerfil(RoleUtils.normalizeRole(userUpdate.getPerfil()));
        existing.setUnidadeLocal(normalizeUnidadeLocal(userUpdate.getUnidadeLocal(), existing.getPerfil()));
        if (userUpdate.getPassword() != null && !userUpdate.getPassword().isEmpty()) {
            passwordPolicy.validate(userUpdate.getPassword(), existing.getUsername());
            existing.setPassword(passwordEncoder.encode(userUpdate.getPassword()));
            existing.setSenhaAlteradaEm(LocalDateTime.now());
        }
        User saved = repository.save(existing);
        log.info("Usuário atualizado: {}", saved.getUsername());
        return saved;
    }

    @Transactional
    public void changePassword(Long id, String oldPassword, String newPassword) {
        User user = findById(id);
        changePasswordInternal(user, oldPassword, newPassword);
    }

    @Transactional
    public void changeOwnPassword(String username, String oldPassword, String newPassword) {
        User user = findByUsername(username);
        changePasswordInternal(user, oldPassword, newPassword);
    }

    private void changePasswordInternal(User user, String oldPassword, String newPassword) {
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual incorreta");
        }
        passwordPolicy.validate(newPassword, user.getUsername());
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setSenhaAlteradaEm(LocalDateTime.now());
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetExpiresAt(null);
        repository.save(user);
        log.info("Senha alterada para usuario: {}", user.getUsername());
    }

    @Transactional
    public void delete(Long id) {
        User user = findById(id);
        user.setStatus(STATUS_INATIVO);
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetExpiresAt(null);
        repository.save(user);
        log.info("Usuário deletado: {}", user.getUsername());
    }

    @Transactional
    public void updateStatus(Long id, String status) {
        User user = findById(id);
        user.setStatus(normalizeStatus(status, null));
        repository.save(user);
        log.info("Status do usuário {} alterado para: {}", user.getUsername(), status);
    }

    @Transactional
    public void incrementTentativasFalhas(String username) {
        User user = findByUsername(username);
        int atual = user.getTentativasFalhas() != null ? user.getTentativasFalhas() : 0;
        user.setTentativasFalhas(atual + 1);
        if (user.getTentativasFalhas() >= 5) {
            user.setStatus(STATUS_BLOQUEADO);
            user.setBloqueadoAte(LocalDateTime.now().plusMinutes(30));
            log.warn("Usuário {} bloqueado após {} tentativas", username, user.getTentativasFalhas());
        }
        repository.save(user);
    }

    @Transactional
    public void resetTentativasFalhas(String username) {
        User user = findByUsername(username);
        user.setTentativasFalhas(0);
        user.setBloqueadoAte(null);
        if (STATUS_BLOQUEADO.equals(user.getStatus())) {
            user.setStatus(STATUS_ATIVO);
        }
        repository.save(user);
    }

    @Transactional
    public void registrarUltimoLogin(String username) {
        User user = findByUsername(username);
        user.setUltimoLogin(LocalDateTime.now());
        repository.save(user);
    }

    @Transactional
    public PasswordResetToken issuePasswordResetToken(Long id) {
        User user = findById(id);
        String token = generateResetToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRATION_MINUTES);
        user.setPasswordResetTokenHash(hashToken(token));
        user.setPasswordResetExpiresAt(expiresAt);
        repository.save(user);
        log.warn("Codigo temporario de redefinicao de senha emitido para usuario: {}", user.getUsername());
        return new PasswordResetToken(token, expiresAt);
    }

    @Transactional
    public void resetPasswordWithToken(String username, String token, String newPassword) {
        if (!StringUtils.hasText(username) || !StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Codigo invalido ou expirado.");
        }

        User user = repository.findByUsername(username.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Codigo invalido ou expirado."));
        String expectedHash = user.getPasswordResetTokenHash();
        LocalDateTime expiresAt = user.getPasswordResetExpiresAt();
        if (expectedHash == null
                || expiresAt == null
                || LocalDateTime.now().isAfter(expiresAt)
                || !MessageDigest.isEqual(
                        expectedHash.getBytes(StandardCharsets.UTF_8),
                        hashToken(token).getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Codigo invalido ou expirado.");
        }

        passwordPolicy.validate(newPassword, user.getUsername());
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setSenhaAlteradaEm(LocalDateTime.now());
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetExpiresAt(null);
        user.setTentativasFalhas(0);
        if (STATUS_BLOQUEADO.equals(user.getStatus())) {
            user.setStatus(STATUS_ATIVO);
            user.setBloqueadoAte(null);
        }
        repository.save(user);
        log.info("Senha redefinida com codigo temporario para usuario: {}", user.getUsername());
    }

    private String normalizeStatus(String status, String defaultStatus) {
        if (!StringUtils.hasText(status)) {
            if (defaultStatus != null) {
                return defaultStatus;
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status e obrigatorio.");
        }

        String normalized = status.trim().toUpperCase();
        return switch (normalized) {
            case STATUS_ATIVO, STATUS_INATIVO, STATUS_BLOQUEADO -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalido.");
        };
    }

    private String normalizeUnidadeLocal(String unidadeLocal, String perfil) {
        String normalizedRole = RoleUtils.normalizeRole(perfil);
        if ("GERENTE".equals(normalizedRole) || "TECNICO".equals(normalizedRole)) {
            if (!StringUtils.hasText(unidadeLocal)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unidade local e obrigatoria para gerente e tecnico.");
            }
            return unidadeLocal.trim();
        }

        return StringUtils.hasText(unidadeLocal) ? unidadeLocal.trim() : null;
    }

    private String generateResetToken() {
        return RESET_TOKEN_PREFIX + String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(normalizeResetToken(token).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponivel.", e);
        }
    }

    private String normalizeResetToken(String token) {
        if (!StringUtils.hasText(token)) {
            return "";
        }

        String normalized = token.trim().toUpperCase().replaceAll("\\s+", "");
        if (normalized.matches("^\\d{6}$")) {
            return RESET_TOKEN_PREFIX + normalized;
        }
        return normalized;
    }

    public record PasswordResetToken(String token, LocalDateTime expiresAt) {
    }
}
