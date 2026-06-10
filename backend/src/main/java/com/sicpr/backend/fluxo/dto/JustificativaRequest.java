package com.sicpr.backend.fluxo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JustificativaRequest {

    @NotBlank
    private String justificativa;
}
