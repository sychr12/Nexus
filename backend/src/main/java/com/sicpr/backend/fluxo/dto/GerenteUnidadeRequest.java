package com.sicpr.backend.fluxo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GerenteUnidadeRequest {

    @NotBlank
    private String nome;

    @NotBlank
    private String unidadeLocal;

    @NotBlank
    private String cargo;

    private String telefoneCorporativo;
    private String telefonePessoal;
    private String status;
}
