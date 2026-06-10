package com.sicpr.backend.fluxo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentoFluxoResponse {
    private String id;
    private String nome;
    private String arquivo;
    private Boolean obrigatorio;
    private String categoria;
    private String conteudo;
    private String mimeType;
    private Long tamanho;
}
