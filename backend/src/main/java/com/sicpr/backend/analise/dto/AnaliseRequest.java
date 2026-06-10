package com.sicpr.backend.analise.dto;

import lombok.Data;

import java.util.List;

@Data
public class AnaliseRequest {

    private String numero;

    private String titulo;

    // RENOVACAO / INSCRICAO / DEVOLUCAO
    private String motivo;

    private String localidade;

    // urgente / normal
    private String prioridade;

    // PDF do memorando
    private String memorandoPdf;

    // Processos/produtores dentro do memorando
    private List<ProcessoAnaliseRequest> processos;
}
