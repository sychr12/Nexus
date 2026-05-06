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
public class AtividadeRecenteDTO {
    private String tipo;
    private String usuario;
    private String descricao;
    private LocalDateTime dataHora;
    private String icone;
}