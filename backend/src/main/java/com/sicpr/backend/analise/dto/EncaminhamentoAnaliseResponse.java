package com.sicpr.backend.analise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EncaminhamentoAnaliseResponse {

    private String id;

    // Memorando
    private Long analiseId;

    private String memorandoNumero;

    private String memorandoTitulo;

    private String memorandoPdf;

    // Processo
    private Long processoId;

    private String produtor;

    private String cpf;

    private String localidade;

    private String processoPdf;

    private String declaracaoPdf;

    // Resultado da análise
    private String tipoIdentificado;

    private String resultadoConsulta;

    private String dataDeclaracao;

    // Datas
    private LocalDateTime recebidoEm;

    private LocalDateTime encaminhadoEm;

    // lancamento ou devolucao
    private String destino;

    // devolução
    private String motivo;

    private String observacao;
}