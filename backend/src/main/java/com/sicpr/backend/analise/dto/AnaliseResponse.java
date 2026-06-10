package com.sicpr.backend.analise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnaliseResponse {

    private Long id;

    // Dados do memorando
    private String numero;

    private String titulo;

    private String motivo;

    private String localidade;

    private String prioridade;

    // recebido / em_analise / finalizado
    private String status;

    // PDF do memorando
    private String memorandoPdf;

    // Responsável
    private String abertoPor;

    // Datas
    private LocalDateTime recebidoEm;

    private LocalDateTime abertoEm;

    private LocalDateTime finalizadoEm;

    // Quantidade de processos
    private Integer produtoresInformados;

    // Processos vinculados
    private List<ProcessoAnaliseResponse> processos;
}
