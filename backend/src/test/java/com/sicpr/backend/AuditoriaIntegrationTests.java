package com.sicpr.backend;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuditoriaIntegrationTests extends IntegrationTestSupport {

    @Test
    @WithMockUser(username = "tecnico", roles = "TECNICO")
    void auditoriaRegistraMutacaoMesmoQuandoValidacaoFalha() throws Exception {
        Long antes = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE acao = 'FLUXO_PROCESSO_CRIAR' AND usuario = 'tecnico'",
                Long.class
        );

        mockMvc.perform(post("/api/fluxo/processos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        Long depois = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE acao = 'FLUXO_PROCESSO_CRIAR' AND usuario = 'tecnico' AND resultado = 'FALHA'",
                Long.class
        );

        assertThat(depois).isGreaterThan(antes);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void adminPodeConsultarAuditoria() throws Exception {
        mockMvc.perform(get("/api/auditoria/eventos"))
                .andExpect(status().isOk());
    }
}
