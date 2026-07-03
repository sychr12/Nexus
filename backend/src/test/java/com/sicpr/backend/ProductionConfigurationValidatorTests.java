package com.sicpr.backend;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.lang.reflect.InvocationTargetException;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionConfigurationValidatorTests {

    @Test
    void ignoraValidacaoForaDoProfileProd() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("jwt.secret", "curto");

        assertThatCode(() -> validate(environment))
                .doesNotThrowAnyException();
    }

    @Test
    void bloqueiaConfiguracaoInseguraEmProducao() {
        MockEnvironment environment = prodEnvironment()
                .withProperty("jwt.secret", "local_dev_only_jwt_secret_change_before_shared_use")
                .withProperty("app.crypto.key", "local_dev_only_crypto_key_change_before_shared_use")
                .withProperty("app.crypto.search-key", "local_dev_only_crypto_key_change_before_shared_use")
                .withProperty("app.cors.allowed-origins", "http://localhost:3000,http://localhost:*")
                .withProperty("app.auth.cookie-secure", "false")
                .withProperty("sicpr.security.bootstrap-admin.enabled", "true")
                .withProperty("sicpr.security.bootstrap-admin.reset-password", "true")
                .withProperty("sicpr.security.bootstrap-users.enabled", "true")
                .withProperty("spring.jpa.hibernate.ddl-auto", "update")
                .withProperty("spring.flyway.enabled", "false");

        assertThatThrownBy(() -> validate(environment))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Configuracao insegura")
                .hasMessageContaining("JWT_SECRET")
                .hasMessageContaining("AUTH_COOKIE_SECURE")
                .hasMessageContaining("ALLOWED_ORIGINS")
                .hasMessageContaining("BOOTSTRAP_ADMIN_ENABLED")
                .hasMessageContaining("BOOTSTRAP_USERS_ENABLED")
                .hasMessageContaining("spring.flyway.enabled");
    }

    @Test
    void aceitaConfiguracaoProdSegura() {
        MockEnvironment environment = prodEnvironment()
                .withProperty("jwt.secret", "prod-jwt-secret-with-at-least-sixty-four-characters-1234567890-extra")
                .withProperty("app.crypto.key", "prod-data-encryption-key-with-32-plus-chars")
                .withProperty("app.crypto.search-key", "prod-search-hash-key-with-32-plus-chars")
                .withProperty("app.cors.allowed-origins", "https://sicpr.example.gov.br")
                .withProperty("app.auth.cookie-secure", "true")
                .withProperty("sicpr.security.bootstrap-admin.enabled", "false")
                .withProperty("sicpr.security.bootstrap-admin.reset-password", "false")
                .withProperty("sicpr.security.bootstrap-users.enabled", "false")
                .withProperty("spring.jpa.hibernate.ddl-auto", "validate")
                .withProperty("spring.flyway.enabled", "true");

        assertThatCode(() -> validate(environment))
                .doesNotThrowAnyException();
    }

    private MockEnvironment prodEnvironment() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        return environment;
    }

    private void validate(MockEnvironment environment) {
        try {
            Class<?> type = Class.forName("com.sicpr.backend.config.ProductionConfigurationValidator");
            Object validator = type.getConstructor(org.springframework.core.env.Environment.class).newInstance(environment);
            type.getMethod("validate").invoke(validator);
        } catch (InvocationTargetException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new RuntimeException(cause);
        } catch (ReflectiveOperationException ex) {
            throw new RuntimeException(ex);
        }
    }
}
