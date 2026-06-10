package com.sicpr.backend.fluxo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GerenteUnidadeResponse {
    private String id;
    private String nome;
    private String unidadeLocal;
    private String cargo;
    private String telefoneCorporativo;
    private String telefonePessoal;
    private String status;
    private LocalDateTime cadastradoEm;
    private LocalDateTime encerradoEm;
}
