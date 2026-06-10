package com.sicpr.backend.analise.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "analise_processos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessoAnalise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Dados do produtor
    private String produtor;

    private String cpf;

    // Arquivos vinculados
    @Column(columnDefinition = "TEXT")
    private String processoPdf;

    @Column(columnDefinition = "TEXT")
    private String declaracaoPdf;

    // Datas
    private LocalDate dataDeclaracao;

    private LocalDate recebidoEm;

    // Resultado das regras
    private String tipoIdentificado;

    private String gccStatus;

    private Boolean dadosGccConferidos;

    // Observações da análise
    @Column(columnDefinition = "TEXT")
    private String observacao;

    private LocalDateTime observacaoAtualizadaEm;

    // Decisão final do processo
    private String decisao;

    private String motivoDevolucao;

    private String decisaoResponsavel;

    private LocalDateTime decisaoEm;

    // Encaminhamento
    private String encaminhadoPara;

    private LocalDateTime encaminhadoEm;

    // Flags de validação
    private Boolean checklistIncompleto;

    private Boolean gccDivergente;

    private Boolean declaracaoVencida;

    private Boolean declaracaoFutura;

    private Boolean cpfDivergente;

    // Relação com a análise/memorando
    @ManyToOne
    @JoinColumn(name = "analise_id")
    private Analise analise;

    @PrePersist
    protected void onCreate() {

        if (dadosGccConferidos == null) {
            dadosGccConferidos = false;
        }

        if (checklistIncompleto == null) {
            checklistIncompleto = false;
        }

        if (gccDivergente == null) {
            gccDivergente = false;
        }

        if (declaracaoVencida == null) {
            declaracaoVencida = false;
        }

        if (declaracaoFutura == null) {
            declaracaoFutura = false;
        }

        if (cpfDivergente == null) {
            cpfDivergente = false;
        }

        if (tipoIdentificado == null || tipoIdentificado.isBlank()) {
            tipoIdentificado = "nao_definido";
        }

        if (gccStatus == null || gccStatus.isBlank()) {
            gccStatus = "nao_consultado";
        }
    }
}   