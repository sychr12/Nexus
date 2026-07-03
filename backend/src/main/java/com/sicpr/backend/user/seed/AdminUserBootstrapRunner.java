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

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "sicpr.security.bootstrap-admin", name = "enabled", havingValue = "true")
public class AdminUserBootstrapRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;

    @Value("${sicpr.security.bootstrap-admin.username:admin}")
    private String username;

    @Value("${sicpr.security.bootstrap-admin.password:}")
    private String password;

    @Value("${sicpr.security.bootstrap-admin.name:Administrador SICPR}")
    private String name;

    @Value("${sicpr.security.bootstrap-admin.reset-password:false}")
    private boolean resetPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        validateConfiguration();

        userRepository.findByUsername(username).ifPresentOrElse(existing -> {
            if (!resetPassword) {
                return;
            }
            existing.setPassword(passwordEncoder.encode(password));
            existing.setPerfil("ADMIN");
            existing.setStatus("ATIVO");
            existing.setTentativasFalhas(0);
            existing.setBloqueadoAte(null);
            userRepository.save(existing);
            log.warn("Usuario administrador inicial resetado para bootstrap local: {}", username);
        }, this::createAdmin);
    }

    private void createAdmin() {
        User admin = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .nomeCompleto(name)
                .perfil("ADMIN")
                .status("ATIVO")
                .tentativasFalhas(0)
                .build();

        userRepository.save(admin);
        log.warn("Usuario administrador inicial criado para bootstrap local: {}", username);
    }

    private void validateConfiguration() {
        if (username == null || username.isBlank()) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_USERNAME deve ser informado quando bootstrap admin estiver habilitado.");
        }

        if (password == null || password.isBlank()) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD deve ser informado quando bootstrap admin estiver habilitado.");
        }

        try {
            passwordPolicy.validate(password, username);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD nao atende a politica de senha.", ex);
        }
    }
}
