package com.sicpr.backend;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FluxoIntegrationTests extends IntegrationTestSupport {

    @Test
    void fluxoSemAutenticacaoERejeitado() throws Exception {
        mockMvc.perform(get("/api/fluxo/processos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "tecnico", roles = "TECNICO")
    void tecnicoPodeChegarAValidacaoDeCriacao() throws Exception {
        mockMvc.perform(post("/api/fluxo/processos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "tecnico_criador", roles = "TECNICO")
    void criacaoDeProcessoGeraIdsCompativeisComSchema() throws Exception {
        criarUsuarioTeste("tecnico_criador", "TECNICO", "Manaus");

        mockMvc.perform(post("/api/fluxo/processos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtor": "Produtor Teste",
                                  "cpf": "32165498700",
                                  "tipoProcesso": "inscricao",
                                  "unidadeLocal": "Manaus",
                                  "documentosGerados": {
                                    "fac": {
                                      "endereco": "Comunidade rural",
                                      "propriedade": "Sitio teste",
                                      "atividade": "Producao familiar"
                                    }
                                  },
                                  "documentos": [
                                    {
                                      "nome": "FAC assinada pelo produtor",
                                      "arquivo": "fac-assinada.pdf",
                                      "obrigatorio": true,
                                      "categoria": "fac_assinada",
                                      "mimeType": "application/pdf",
                                      "tamanho": 128000
                                    }
                                  ]
                                }
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", matchesPattern("proc-[0-9a-f]{32}")))
                .andExpect(jsonPath("$.documentos[0].id", matchesPattern("doc-[0-9a-f]{32}")))
                .andExpect(jsonPath("$.historico[0].id", matchesPattern("hist-[0-9a-f]{32}")));
    }

    @Test
    @WithMockUser(username = "tecnico_manacapuru", roles = "TECNICO")
    void tecnicoNaoPodeCriarProcessoParaOutraUnidade() throws Exception {
        criarUsuarioTeste("tecnico_manacapuru", "TECNICO", "Manacapuru");

        mockMvc.perform(post("/api/fluxo/processos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtor": "Produtor Outra Unidade",
                                  "cpf": "32165498700",
                                  "tipoProcesso": "inscricao",
                                  "unidadeLocal": "Manaus"
                                }
                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "gerente_manacapuru", roles = "GERENTE")
    void gerenteNaoPodeConsultarOutraUnidade() throws Exception {
        criarUsuarioTeste("gerente_manacapuru", "GERENTE", "Manacapuru");

        mockMvc.perform(get("/api/fluxo/processos?unidadeLocal=Manaus"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "usuario_manacapuru", roles = "USUARIO")
    void usuarioNaoPodeConsultarOutraUnidade() throws Exception {
        criarUsuarioTeste("usuario_manacapuru", "USUARIO", "Manacapuru");

        mockMvc.perform(get("/api/fluxo/processos?unidadeLocal=Manaus"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "gerente", roles = "GERENTE")
    void gerenteNaoPodeExecutarEtapaDeAnalise() throws Exception {
        mockMvc.perform(post("/api/fluxo/processos/inexistente/analise/aprovar")
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void adminPodeAtravessarRegraGeralDoFluxo() throws Exception {
        mockMvc.perform(get("/api/fluxo/rota-inexistente"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "usuario_lancador", roles = "USUARIO")
    void conclusaoDeLancamentoPublicaProdutorNaConsulta() throws Exception {
        criarUsuarioTeste("usuario_lancador", "USUARIO", "Manaus");

        MvcResult criado = mockMvc.perform(post("/api/fluxo/processos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtor": "Produtor Publicado",
                                  "cpf": "98765432100",
                                  "tipoProcesso": "inscricao",
                                  "unidadeLocal": "Manaus"
                                }
                """))
                .andExpect(status().isOk())
                .andReturn();

        String processoId = JsonPath.read(criado.getResponse().getContentAsString(), "$.id");
        jdbcTemplate.update("""
                UPDATE fluxo_processos
                SET situacao = 'aprovado_lancamento',
                    memorando_numero = 'MEM-123/2026',
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = ?
                """, processoId);

        mockMvc.perform(post("/api/fluxo/processos/{id}/lancamento/concluir", processoId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.situacao").value("concluido"));

        mockMvc.perform(get("/api/inscricoes/web"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nome", hasItem("Produtor Publicado")))
                .andExpect(jsonPath("$[*].memorando", hasItem("MEM-123/2026")));
    }
}
