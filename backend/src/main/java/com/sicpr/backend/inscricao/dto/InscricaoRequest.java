package com.sicpr.backend.inscricao.dto;

import lombok.Data;


@Data
public class InscricaoRequest {
    private String nome;
    private String cpf;
    private String municipio;
    private String memorando;
    private String latitude;
    private String longitude;
    private String tipo;
    
}
