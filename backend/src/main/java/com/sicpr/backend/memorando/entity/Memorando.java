package com.sicpr.backend.memorando.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "memorandos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Memorando {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero;

    private String descricao;

    private String unloc;

    private String municipio;

    @Column(name = "memo_entrada")
    private String memoEntrada;

    @Column(name = "data_emissao")
    private LocalDate dataEmissao;

    private Integer quantidade;

    private String usuario;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

  
    @JsonIgnore
    @Column(name = "arquivo_word", columnDefinition = "bytea")
    private byte[] arquivoWord;
}
