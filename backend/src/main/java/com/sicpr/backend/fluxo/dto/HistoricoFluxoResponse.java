package com.sicpr.backend.fluxo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class HistoricoFluxoResponse {
    private String id;
    private String usuario;
    private String acao;
    private LocalDateTime dataHora;
    private String observacao;
}
