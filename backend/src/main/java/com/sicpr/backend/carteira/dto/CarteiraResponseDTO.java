// dto/CarteiraResponseDTO.java
package com.sicpr.backend.carteira.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CarteiraResponseDTO {
    private Long id;
    private String registro;
    private String cpf;
    private String nome;
    private String propriedade;
    private String unloc;
    private String inicio;
    private String validade;
    private String endereco;
    private String atividade1;
    private String atividade2;
    private String georef;
    private String usuario;
    private LocalDateTime createdAt;
    private List<String> fotosBase64;
}