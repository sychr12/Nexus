package com.sicpr.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "debug=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class IntegrationTestSupport {

    protected static final String TEST_PASSWORD = "Sicpr@123";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ApplicationContext applicationContext;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected Object invoke(Object target, String method, Class<?> parameterType, Object argument) throws Exception {
        return target.getClass().getMethod(method, parameterType).invoke(target, argument);
    }

    protected String analiseValidaJson(String numero) {
        return """
                {
                  "numero": "%s",
                  "titulo": "Memorando de teste",
                  "motivo": "INSCRICAO",
                  "localidade": "Manaus",
                  "prioridade": "normal",
                  "memorandoPdf": "memorando.pdf",
                  "processos": [
                    {
                      "produtor": "Produtor Analise",
                      "cpf": "12345678901",
                      "processoPdf": "processo.pdf",
                      "declaracaoPdf": "declaracao.pdf"
                    }
                  ]
                }
                """.formatted(numero);
    }

    protected Long criarUsuarioTeste(String username, String perfil) {
        return criarUsuarioTeste(username, perfil, null);
    }

    protected Long criarUsuarioTeste(String username, String perfil, String unidadeLocal) {
        jdbcTemplate.update("""
                INSERT INTO users (username, password, nome_completo, perfil, unidade_local, status, tentativas_falhas, criado_em, atualizado_em)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                username,
                passwordEncoder.encode(TEST_PASSWORD),
                "Usuario " + username,
                perfil,
                unidadeLocal,
                "ATIVO",
                0
        );

        return jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE username = ?",
                Long.class,
                username
        );
    }

    protected MvcResult loginComoAdmin(String username) throws Exception {
        jdbcTemplate.update("""
                INSERT INTO users (username, password, nome_completo, perfil, status, tentativas_falhas, criado_em, atualizado_em)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                username,
                passwordEncoder.encode(TEST_PASSWORD),
                "Administrador Login",
                "ADMIN",
                "ATIVO",
                0
        );

        return mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, TEST_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("SICPR_AUTH", true))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.perfil").value("ADMIN"))
                .andReturn();
    }
}
