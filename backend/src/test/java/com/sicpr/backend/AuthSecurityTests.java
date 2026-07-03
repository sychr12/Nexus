package com.sicpr.backend;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthSecurityTests extends IntegrationTestSupport {

    @Test
    void loginRetornaCookieHttpOnlyESessaoFunciona() throws Exception {
        MvcResult login = loginComoAdmin("login_admin");

        mockMvc.perform(get("/api/auth/session")
                        .cookie(login.getResponse().getCookie("SICPR_AUTH")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("login_admin"))
                .andExpect(jsonPath("$.perfil").value("ADMIN"));
    }

    @Test
    @WithMockUser(username = "tecnico_sem_csrf", roles = "TECNICO")
    void mutacaoAutenticadaSemCsrfERejeitada() throws Exception {
        mockMvc.perform(post("/api/analises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "gerente", roles = "GERENTE")
    void gerenteNaoPodeCriarProcessoUnloc() throws Exception {
        mockMvc.perform(post("/api/fluxo/processos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "usuario", roles = "USUARIO")
    void usuarioPadraoNaoPodeConsultarAuditoria() throws Exception {
        mockMvc.perform(get("/api/auditoria/eventos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "usuario_consulta", roles = "USUARIO")
    void usuarioComUnidadeLocalPodeConsultarInscricoesDaPropriaUnidade() throws Exception {
        criarUsuarioTeste("usuario_consulta", "USUARIO", "Manacapuru");

        mockMvc.perform(get("/api/inscricoes/web"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "usuario_sem_unidade", roles = "USUARIO")
    void usuarioSemUnidadeLocalNaoPodeConsultarInscricoesWeb() throws Exception {
        criarUsuarioTeste("usuario_sem_unidade", "USUARIO");

        mockMvc.perform(get("/api/inscricoes/web"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "gerente_consulta", roles = "GERENTE")
    void gerenteComUnidadeLocalPodeConsultarInscricoesDaPropriaUnidade() throws Exception {
        criarUsuarioTeste("gerente_consulta", "GERENTE", "Manacapuru");

        mockMvc.perform(get("/api/inscricoes/web"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "gerente_central_memorandos", roles = "GERENTE")
    void gerentePodeConsultarCentralDeMemorandosDaPropriaUnidade() throws Exception {
        criarUsuarioTeste("gerente_central_memorandos", "GERENTE", "Manacapuru");

        mockMvc.perform(get("/api/central-memorandos"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "tecnico_central_memorandos", roles = "TECNICO")
    void tecnicoNaoPodeConsultarCentralDeMemorandos() throws Exception {
        criarUsuarioTeste("tecnico_central_memorandos", "TECNICO", "Manacapuru");

        mockMvc.perform(get("/api/central-memorandos"))
                .andExpect(status().isForbidden());
    }
}
