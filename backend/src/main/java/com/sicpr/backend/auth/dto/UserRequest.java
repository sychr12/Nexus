package com.sicpr.backend.auth.dto;

import lombok.Data;

@Data
public class UserRequest {
    private String username;
    private String password;
    private String status;
    private String perfil;
    private String email;
    private String nomeCompleto;
    private String telefone;
}