package com.sicpr.backend.analise.dto;

import lombok.Data;

@Data
public class DecisaoProcessoRequest {

    // lancamento ou devolucao
    private String destino;

    // obrigatório quando destino = devolucao
    private String motivo;

    // obrigatório quando destino = devolucao
    private String observacao;
}