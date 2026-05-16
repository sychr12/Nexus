// dto/CarteiraRequestDTO.java
package com.sicpr.backend.carteira.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CarteiraRequestDTO {
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
    private MultipartFile[] fotos;
}