package com.sicpr.backend;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserSecurityTests extends IntegrationTestSupport {

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void criacaoDeUsuarioRejeitaSenhaFraca() throws Exception {
        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "usuario_senha_fraca",
                                  "password": "senhafraca",
                                  "nomeCompleto": "Usuario Senha Fraca",
                                  "perfil": "USUARIO"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void criacaoDeUsuarioAceitaSenhaForteENaoExpoeHash() throws Exception {
        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "usuario_senha_forte",
                                  "password": "Forte@123",
                                  "nomeCompleto": "Usuario Senha Forte",
                                  "perfil": "USUARIO"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("usuario_senha_forte"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void alteracaoDeSenhaRejeitaSenhaSemComplexidade() throws Exception {
        Long userId = criarUsuarioTeste("usuario_troca_senha", "USUARIO");

        mockMvc.perform(patch("/api/users/{id}/password", userId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "oldPassword": "%s",
                                  "newPassword": "senha-sem-numero"
                                }
                                """.formatted(TEST_PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", not("Senha atual incorreta")));
    }

    @Test
    @WithMockUser(username = "usuario_senha_propria", roles = "USUARIO")
    void usuarioAutenticadoPodeAlterarPropriaSenha() throws Exception {
        criarUsuarioTeste("usuario_senha_propria", "USUARIO");

        mockMvc.perform(patch("/api/users/me/password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "oldPassword": "%s",
                                  "newPassword": "Nova@12345"
                                }
                                """.formatted(TEST_PASSWORD)))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "admin_reset", roles = "ADMIN")
    void adminPodeEmitirTokenTemporarioEUsuarioRedefineSenha() throws Exception {
        Long userId = criarUsuarioTeste("usuario_reset_token", "USUARIO");

        MvcResult tokenResponse = mockMvc.perform(post("/api/users/{id}/password-reset-token", userId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.token").value(matchesPattern("IDAM-\\d{6}")))
                .andReturn();

        String token = JsonPath.read(tokenResponse.getResponse().getContentAsString(), "$.token");

        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "usuario_reset_token",
                                  "token": "%s",
                                  "newPassword": "Reset@12345"
                                }
                                """.formatted(token)))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void alteracaoDeStatusRejeitaValorInvalido() throws Exception {
        Long userId = criarUsuarioTeste("usuario_status_invalido", "USUARIO");

        mockMvc.perform(patch("/api/users/{id}/status", userId)
                        .with(csrf())
                        .param("status", "DESCONHECIDO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Status invalido."));
    }
}
