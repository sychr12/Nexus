package com.sicpr.backend.fluxo.dto;

import lombok.Data;

@Data
public class DocumentoFluxoRequest {
    private String id;
    private String nome;
    private String arquivo;
    private Boolean obrigatorio;
    private String categoria;
    private String conteudo;
    private String mimeType;
    private Long tamanho;
}
