package com.sicpr.backend;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MensagemIntegrationTests extends IntegrationTestSupport {

    @Test
    @WithMockUser(username = "mensagem_usuario", roles = "USUARIO")
    void usuarioPodeListarContatosDeMensagensSemAcessoAoGerenciamento() throws Exception {
        criarUsuarioTeste("mensagem_usuario", "USUARIO", "Manaus");
        criarUsuarioTeste("mensagem_destinatario_ativo", "TECNICO", "Manaus");

        mockMvc.perform(get("/api/mensagens/usuarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].username").value(org.hamcrest.Matchers.hasItem("mensagem_destinatario_ativo")));
    }

    @Test
    @WithMockUser(username = "mensagem_remetente", roles = "ADMIN")
    void uploadDeMensagemRejeitaArquivoComAssinaturaInvalida() throws Exception {
        criarUsuarioTeste("mensagem_remetente", "ADMIN");
        Long destinatarioId = criarUsuarioTeste("mensagem_destinatario", "USUARIO");
        MockMultipartFile falsoPng = new MockMultipartFile(
                "anexo",
                "documento.png",
                "image/png",
                "isto nao e uma imagem".getBytes()
        );

        mockMvc.perform(multipart("/api/mensagens")
                        .file(falsoPng)
                        .param("destinatarioId", destinatarioId.toString())
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }
}
