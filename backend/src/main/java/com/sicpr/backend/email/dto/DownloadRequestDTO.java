// backend/src/main/java/com/sicpr/backend/email/dto/DownloadRequestDTO.java
package com.sicpr.backend.email.dto;

import lombok.Data;

@Data
public class DownloadRequestDTO {
    private String email;
    private String senha;
    private boolean apenasNaoLidos = true;
    private String labelProcessado = "SICPR_Processado";
}