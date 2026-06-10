package com.sicpr.backend.fluxo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
public class ProcessoFluxoRequest {

    @NotBlank
    private String produtor;

    @NotBlank
    private String cpf;

    @NotBlank
    private String tipoProcesso;

    @NotBlank
    private String unidadeLocal;

    private Map<String, Map<String, String>> documentosGerados;

    private List<DocumentoFluxoRequest> documentos = new ArrayList<>();
}
