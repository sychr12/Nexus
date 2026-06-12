package com.sicpr.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Informe o usuario.")
    private String username;

    @NotBlank(message = "Informe a senha.")
    private String password;
}
