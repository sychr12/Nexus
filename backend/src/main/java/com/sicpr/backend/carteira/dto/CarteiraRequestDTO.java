// dto/CarteiraRequestDTO.java
package com.sicpr.backend.carteira.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CarteiraRequestDTO {
    @Size(max = 50, message = "Registro deve ter no maximo 50 caracteres.")
    private String registro;

    @NotBlank(message = "CPF e obrigatorio.")
    @Pattern(regexp = "^(?:\\D*\\d){11}\\D*$", message = "CPF deve conter 11 digitos.")
    private String cpf;

    @NotBlank(message = "Nome e obrigatorio.")
    @Size(max = 200, message = "Nome deve ter no maximo 200 caracteres.")
    private String nome;

    @Size(max = 255, message = "Propriedade deve ter no maximo 255 caracteres.")
    private String propriedade;

    @Size(max = 20, message = "Unidade local deve ter no maximo 20 caracteres.")
    private String unloc;

    @Size(max = 10, message = "Inicio deve ter no maximo 10 caracteres.")
    private String inicio;

    @Size(max = 10, message = "Validade deve ter no maximo 10 caracteres.")
    private String validade;

    @Size(max = 500, message = "Endereco deve ter no maximo 500 caracteres.")
    private String endereco;

    @Size(max = 4000, message = "Atividade 1 deve ter no maximo 4000 caracteres.")
    private String atividade1;

    @Size(max = 4000, message = "Atividade 2 deve ter no maximo 4000 caracteres.")
    private String atividade2;

    @Size(max = 1000, message = "Georreferencia deve ter no maximo 1000 caracteres.")
    private String georef;

    private MultipartFile[] fotos;
}
