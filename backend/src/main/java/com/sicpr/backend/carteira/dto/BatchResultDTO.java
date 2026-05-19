// dto/BatchResultDTO.java
package com.sicpr.backend.carteira.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class BatchResultDTO {
    private String batchId;
    private int totalArquivos;
    private int sucessos;
    private int erros;
    private int ignorados;
    private long tempoTotalMs;
    private List<BatchItemDTO> detalhes = new ArrayList<>();
    
    @Data
    public static class BatchItemDTO {
        private String arquivo;
        private String cpf;
        private boolean sucesso;
        private String mensagem;
    }
}