package com.sicpr.backend;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AnaliseIntegrationTests extends IntegrationTestSupport {

    @Test
    @WithMockUser(username = "carteira_analise", roles = "USUARIO")
    void equipeCarteiraPodeCriarAnalise() throws Exception {
        mockMvc.perform(post("/api/analises")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analiseValidaJson("MEM-USUARIO-BLOQUEADO")))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "tecnico_analise", roles = "TECNICO")
    void tecnicoUnidadeLocalNaoPodeCriarAnalise() throws Exception {
        mockMvc.perform(post("/api/analises")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analiseValidaJson("MEM-TECNICO-BLOQUEADO")))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "carteira_operador", roles = "USUARIO")
    void equipeCarteiraPodeOperarAnaliseComAutoriaReal() throws Exception {
        String numero = "MEM-ANALISE-AUDITORIA";

        mockMvc.perform(post("/api/analises")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analiseValidaJson(numero)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.numero").value(numero));

        Long analiseId = jdbcTemplate.queryForObject(
                "SELECT id FROM analises WHERE numero = ?",
                Long.class,
                numero
        );
        Long processoId = jdbcTemplate.queryForObject(
                "SELECT id FROM analise_processos WHERE analise_id = ?",
                Long.class,
                analiseId
        );

        mockMvc.perform(post("/api/analises/{id}/abrir", analiseId)
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.abertoPor").value("carteira_operador"));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT aberto_por FROM analises WHERE id = ?",
                String.class,
                analiseId
        )).isEqualTo("carteira_operador");

        mockMvc.perform(post("/api/analises/processos/{processoId}/decisao", processoId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"destino\":\"lancamento\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("finalizado"));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT decisao_responsavel FROM analise_processos WHERE id = ?",
                String.class,
                processoId
        )).isEqualTo("carteira_operador");
    }
}
