package com.sicpr.backend.analise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessoAnaliseResponse {

    private Long id;

    // Dados do produtor
    private String produtor;

    private String cpf;

    // PDFs
    private String processoPdf;

    private String declaracaoPdf;

    // Datas
    private LocalDate dataDeclaracao;

    private LocalDate recebidoEm;

    // Resultado das validações
    private String tipoIdentificado;

    private String gccStatus;

    private Boolean dadosGccConferidos;

    // Observações
    private String observacao;

    private LocalDateTime observacaoAtualizadaEm;

    // Decisão
    private String decisao;

    private String motivoDevolucao;

    private String decisaoResponsavel;

    private LocalDateTime decisaoEm;

    // Encaminhamento
    private String encaminhadoPara;

    private LocalDateTime encaminhadoEm;

    // Flags de análise
    private Boolean checklistIncompleto;

    private Boolean gccDivergente;

    private Boolean declaracaoVencida;

    private Boolean declaracaoFutura;

    private Boolean cpfDivergente;
}