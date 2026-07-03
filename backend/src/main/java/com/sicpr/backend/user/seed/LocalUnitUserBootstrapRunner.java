package com.sicpr.backend.user.seed;

import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import com.sicpr.backend.user.service.PasswordPolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "sicpr.security.bootstrap-users", name = "enabled", havingValue = "true")
public class LocalUnitUserBootstrapRunner implements ApplicationRunner {

    private static final Set<String> ALLOWED_PROFILES = Set.of("GERENTE", "TECNICO", "USUARIO");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;

    @Value("${sicpr.security.bootstrap-users.entries:}")
    private String entries;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (entries == null || entries.isBlank()) {
            throw new IllegalStateException("BOOTSTRAP_USERS_ENTRIES deve ser informado quando bootstrap de usuarios estiver habilitado.");
        }

        Arrays.stream(entries.split(";"))
                .map(String::trim)
                .filter(entry -> !entry.isBlank())
                .map(this::parseEntry)
                .forEach(this::createIfMissing);
    }

    private BootstrapUser parseEntry(String entry) {
        String[] parts = entry.split("\\|", -1);
        if (parts.length != 5) {
            throw new IllegalStateException("BOOTSTRAP_USERS_ENTRIES deve usar o formato username|senha|nomeCompleto|perfil|unidadeLocal.");
        }

        String username = requireValue(parts[0], "username");
        String password = requireValue(parts[1], "senha");
        String nomeCompleto = requireValue(parts[2], "nomeCompleto");
        String perfil = requireValue(parts[3], "perfil").toUpperCase(Locale.ROOT);
        String unidadeLocal = requireValue(parts[4], "unidadeLocal");

        if (!ALLOWED_PROFILES.contains(perfil)) {
            throw new IllegalStateException("BOOTSTRAP_USERS_ENTRIES aceita apenas os perfis GERENTE, TECNICO ou USUARIO.");
        }

        try {
            passwordPolicy.validate(password, username);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("Senha do usuario bootstrap '" + username + "' nao atende a politica de senha.", ex);
        }

        return new BootstrapUser(username, password, nomeCompleto, perfil, unidadeLocal);
    }

    private void createIfMissing(BootstrapUser bootstrapUser) {
        userRepository.findByUsername(bootstrapUser.username()).ifPresentOrElse(existing ->
                log.info("Usuario bootstrap de unidade local ja existe: {}", bootstrapUser.username()), () -> {
            User user = User.builder()
                    .username(bootstrapUser.username())
                    .password(passwordEncoder.encode(bootstrapUser.password()))
                    .nomeCompleto(bootstrapUser.nomeCompleto())
                    .perfil(bootstrapUser.perfil())
                    .unidadeLocal(bootstrapUser.unidadeLocal())
                    .status("ATIVO")
                    .tentativasFalhas(0)
                    .build();

            userRepository.save(user);
            log.warn("Usuario bootstrap de unidade local criado: {} ({}, {})",
                    bootstrapUser.username(),
                    bootstrapUser.perfil(),
                    bootstrapUser.unidadeLocal());
        });
    }

    private String requireValue(String value, String field) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalStateException("Campo " + field + " e obrigatorio em BOOTSTRAP_USERS_ENTRIES.");
        }
        return value.trim();
    }

    private record BootstrapUser(
            String username,
            String password,
            String nomeCompleto,
            String perfil,
            String unidadeLocal
    ) {
    }
}
