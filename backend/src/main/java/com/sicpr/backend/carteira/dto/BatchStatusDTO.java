// dto/BatchStatusDTO.java
package com.sicpr.backend.carteira.dto;

import lombok.Data;

@Data
public class BatchStatusDTO {
    private String batchId;
    private String status;
    private int processados;
    private int total;
    private int sucessos;
    private int erros;
    private String mensagem;
}