package com.sicpr.backend.inscricao.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;


@Data
public class InscricaoRequest {
    @NotBlank(message = "Nome e obrigatorio.")
    @Size(max = 200, message = "Nome deve ter no maximo 200 caracteres.")
    private String nome;

    @NotBlank(message = "CPF e obrigatorio.")
    @Pattern(regexp = "^(?:\\D*\\d){11}\\D*$", message = "CPF deve conter 11 digitos.")
    private String cpf;

    @NotBlank(message = "Municipio e obrigatorio.")
    @Size(max = 100, message = "Municipio deve ter no maximo 100 caracteres.")
    private String municipio;

    @NotBlank(message = "Memorando e obrigatorio.")
    @Size(max = 100, message = "Memorando deve ter no maximo 100 caracteres.")
    private String memorando;

    @NotBlank(message = "Latitude e obrigatoria.")
    @Size(max = 40, message = "Latitude deve ter no maximo 40 caracteres.")
    private String latitude;

    @NotBlank(message = "Longitude e obrigatoria.")
    @Size(max = 40, message = "Longitude deve ter no maximo 40 caracteres.")
    private String longitude;

    @NotBlank(message = "Tipo e obrigatorio.")
    @Pattern(regexp = "INSCRICAO|RENOVACAO|ALTERACAO|inscricao|renovacao|alteracao", message = "Tipo invalido.")
    private String tipo;
}
