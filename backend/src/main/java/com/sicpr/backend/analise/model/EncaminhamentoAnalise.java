package com.sicpr.backend.analise.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analise_encaminhamentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncaminhamentoAnalise {

    @Id
    private String id;

    private Long analiseId;

    private String memorandoNumero;

    private String memorandoTitulo;

    @Column(columnDefinition = "TEXT")
    private String memorandoPdf;

    private Long processoId;

    private String produtor;

    private String cpf;

    private String localidade;

    @Column(columnDefinition = "TEXT")
    private String processoPdf;

    @Column(columnDefinition = "TEXT")
    private String declaracaoPdf;

    private String tipoIdentificado;

    private String resultadoConsulta;

    private String dataDeclaracao;

    private LocalDateTime recebidoEm;

    private LocalDateTime encaminhadoEm;

    // lancamento ou devolucao
    private String destino;

    private String motivo;

    @Column(columnDefinition = "TEXT")
    private String observacao;
}