package com.sicpr.backend.auth.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRequest {
    @Size(max = 100, message = "Username deve ter no maximo 100 caracteres.")
    private String username;

    @Size(min = 8, max = 120, message = "Senha deve ter entre 8 e 120 caracteres.")
    private String password;

    @Pattern(regexp = "ATIVO|INATIVO|BLOQUEADO", message = "Status invalido.")
    private String status;

    @Pattern(regexp = "ADMIN|GERENTE|TECNICO|USUARIO", message = "Perfil invalido.")
    private String perfil;

    @Size(max = 200, message = "Nome completo deve ter no maximo 200 caracteres.")
    private String nomeCompleto;

    @Size(max = 30, message = "Telefone deve ter no maximo 30 caracteres.")
    private String telefone;

    @Size(max = 120, message = "Unidade local deve ter no maximo 120 caracteres.")
    private String unidadeLocal;
}
