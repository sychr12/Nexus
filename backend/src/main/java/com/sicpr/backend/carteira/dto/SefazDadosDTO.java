// dto/SefazDadosDTO.java
package com.sicpr.backend.carteira.dto;

import lombok.Data;

@Data
public class SefazDadosDTO {
    private String nome;
    private String rp;
    private String cpf;
    private String propriedade;
    private String endereco;
    private String unloc;
    private String latitude;
    private String longitude;
    private String atv1;
    private String atv2;
    private String inicioatv;
    private String validade;
    private String cnae1;
    private String cnae2;
    private String numcontrole;
}