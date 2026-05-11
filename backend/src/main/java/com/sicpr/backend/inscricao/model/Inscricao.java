package com.sicpr.backend.inscricao.model;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "inscricoes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inscricao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String cpf;
    private String municipio;
    private String memorando;
    private String tipo;
    
}
