package com.sicpr.backend.mensagem.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MensagemRequest {
    @NotNull
    private Long destinatarioId;

    private String texto;
}
