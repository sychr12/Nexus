package com.sicpr.backend.fluxo.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AprovarLoteRequest {

    @NotEmpty
    private List<String> ids;

    private String gerenteId;
}
