package com.sicpr.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class ProductionConfigurationValidator implements ApplicationRunner {

    private static final List<String> UNSAFE_SECRET_MARKERS = List.of(
            "change-me",
            "local_dev_only",
            "test_",
            "dev_"
    );

    private final Environment environment;

    public ProductionConfigurationValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        validate();
    }

    public void validate() {
        if (!isProductionProfileActive()) {
            return;
        }

        List<String> errors = new ArrayList<>();

        String jwtSecret = environment.getProperty("jwt.secret", "");
        String cryptoKey = environment.getProperty("app.crypto.key", "");
        String searchKey = environment.getProperty("app.crypto.search-key", "");
        String allowedOrigins = environment.getProperty("app.cors.allowed-origins", "");
        boolean cookieSecure = environment.getProperty("app.auth.cookie-secure", Boolean.class, false);
        boolean bootstrapAdmin = environment.getProperty("sicpr.security.bootstrap-admin.enabled", Boolean.class, false);
        boolean bootstrapReset = environment.getProperty("sicpr.security.bootstrap-admin.reset-password", Boolean.class, false);
        boolean bootstrapUsers = environment.getProperty("sicpr.security.bootstrap-users.enabled", Boolean.class, false);
        String ddlAuto = environment.getProperty("spring.jpa.hibernate.ddl-auto", "");
        boolean flywayEnabled = environment.getProperty("spring.flyway.enabled", Boolean.class, true);

        requireStrongSecret(errors, "JWT_SECRET", jwtSecret, 64);
        requireStrongSecret(errors, "DATA_ENCRYPTION_KEY", cryptoKey, 32);
        requireStrongSecret(errors, "DATA_SEARCH_HASH_KEY", searchKey, 32);

        if (!cryptoKey.isBlank() && cryptoKey.equals(searchKey)) {
            errors.add("DATA_SEARCH_HASH_KEY deve ser diferente de DATA_ENCRYPTION_KEY em producao.");
        }

        if (!cookieSecure) {
            errors.add("AUTH_COOKIE_SECURE deve ser true em producao.");
        }

        if (allowedOrigins.isBlank()) {
            errors.add("ALLOWED_ORIGINS deve ser informado em producao.");
        } else if (allowedOrigins.contains("*") || allowedOrigins.toLowerCase().contains("localhost")) {
            errors.add("ALLOWED_ORIGINS nao deve conter wildcard ou localhost em producao.");
        }

        if (bootstrapAdmin) {
            errors.add("BOOTSTRAP_ADMIN_ENABLED deve ser false em producao.");
        }

        if (bootstrapReset) {
            errors.add("BOOTSTRAP_ADMIN_RESET_PASSWORD deve ser false em producao.");
        }

        if (bootstrapUsers) {
            errors.add("BOOTSTRAP_USERS_ENABLED deve ser false em producao.");
        }

        if (!"validate".equalsIgnoreCase(ddlAuto)) {
            errors.add("spring.jpa.hibernate.ddl-auto deve ser validate em producao.");
        }

        if (!flywayEnabled) {
            errors.add("spring.flyway.enabled deve permanecer true em producao.");
        }

        if (!errors.isEmpty()) {
            throw new IllegalStateException("Configuracao insegura para profile prod: " + String.join(" ", errors));
        }
    }

    private boolean isProductionProfileActive() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch("prod"::equalsIgnoreCase);
    }

    private void requireStrongSecret(List<String> errors, String name, String value, int minLength) {
        if (value == null || value.isBlank()) {
            errors.add(name + " deve ser informado em producao.");
            return;
        }

        if (value.trim().length() < minLength) {
            errors.add(name + " deve ter pelo menos " + minLength + " caracteres em producao.");
        }

        String normalized = value.toLowerCase();
        boolean unsafe = UNSAFE_SECRET_MARKERS.stream().anyMatch(normalized::contains);
        if (unsafe) {
            errors.add(name + " nao pode usar valor padrao ou de desenvolvimento em producao.");
        }
    }
}
