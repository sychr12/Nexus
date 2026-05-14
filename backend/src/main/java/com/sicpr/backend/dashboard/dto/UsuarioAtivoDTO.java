package com.sicpr.backend.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioAtivoDTO {
    private String username;
    private String nome;
    private String perfil;
    private LocalDateTime ultimoAcesso;
    private String tempoOnline;
}