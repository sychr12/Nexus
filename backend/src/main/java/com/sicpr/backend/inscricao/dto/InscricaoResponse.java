package com.sicpr.backend.inscricao.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscricaoResponse {

    private Long id;

    private String nome;

    private String cpf;

    private String municipio;

    private String memorando;

    private String tipo;

    private LocalDateTime criadoEm;
}
