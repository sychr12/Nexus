package com.sicpr.backend.carteira.dto;


import lombok.Data;

@Data
public class FiltroBuscaDTO {
    private String termoPesquisa;
    private String periodo; // TODOS, ULTIMO_MES, ULTIMO_ANO
    private String usuario;
}