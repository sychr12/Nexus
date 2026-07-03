package com.sicpr.backend;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SystemFoundationTests extends IntegrationTestSupport {

    @Test
    void contextLoads() {
    }

    @Test
    void healthcheckPublicoExpõeApenasStatus() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test
    void flywayAplicaVersaoAtualDoSchema() {
        String version = jdbcTemplate.queryForObject(
                "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 1",
                String.class
        );

        assertThat(version).isEqualTo("9");
    }

    @Test
    void criptografiaDeTextoFazRoundTrip() throws Exception {
        Object cryptoService = applicationContext.getBean("cryptoService");
        String encrypted = (String) invoke(cryptoService, "encrypt", String.class, "dado sensivel");

        assertThat(encrypted).startsWith("v1:").doesNotContain("dado sensivel");
        assertThat(invoke(cryptoService, "decrypt", String.class, encrypted)).isEqualTo("dado sensivel");
    }

    @Test
    void criptografiaDeArquivoFazRoundTripEPreservaLegado() throws Exception {
        Object cryptoService = applicationContext.getBean("cryptoService");
        byte[] original = "arquivo sensivel".getBytes();
        byte[] encrypted = (byte[]) invoke(cryptoService, "encryptBytes", byte[].class, original);

        assertThat(encrypted).isNotEqualTo(original);
        assertThat((byte[]) invoke(cryptoService, "decryptBytes", byte[].class, encrypted)).isEqualTo(original);
        assertThat((byte[]) invoke(cryptoService, "decryptBytes", byte[].class, original)).isEqualTo(original);
    }

    @Test
    void hashPesquisavelDeCpfENormalizadoEDeterministico() throws Exception {
        Object searchHashService = applicationContext.getBean("searchHashService");
        String formatted = (String) invoke(searchHashService, "cpfHash", String.class, "123.456.789-01");
        String plain = (String) invoke(searchHashService, "cpfHash", String.class, "12345678901");

        assertThat(formatted).hasSize(64).isEqualTo(plain).doesNotContain("12345678901");
    }
}
