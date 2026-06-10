package com.sicpr.backend.analise.dto;

import lombok.Data;

@Data
public class ProcessoAnaliseRequest {

    // Dados do produtor
    private String produtor;

    private String cpf;

    // PDFs
    private String processoPdf;

    private String declaracaoPdf;

    // Datas
    private String dataDeclaracao;

    private String recebidoEm;

    // Resultado das análises
    private String tipoIdentificado;

    private String gccStatus;

    private Boolean dadosGccConferidos;

    // Observações
    private String observacao;

    // Decisão
    private String decisao;

    private String motivoDevolucao;

    // Encaminhamento
    private String encaminhadoPara;

    private String encaminhadoEm;

    // Flags
    private Boolean checklistIncompleto;

    private Boolean gccDivergente;

    private Boolean declaracaoVencida;

    private Boolean declaracaoFutura;

    private Boolean cpfDivergente;
    
}