package com.sicpr.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String perfil;
    private String role;
    private String unidadeLocal;
}
