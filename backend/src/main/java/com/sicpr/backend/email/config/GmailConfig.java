// backend/src/main/java/com/sicpr/backend/email/config/GmailConfig.java
package com.sicpr.backend.email.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class GmailConfig {
    
    // Configurações diretas - SEM ARQUIVOS EXTERNOS
    public static final String APPLICATION_NAME = "SICPR - Email Downloader";
    public static final int MAX_RESULTS = 50;
    public static final String LABEL_PROCESSADO = "SICPR_Processado";
}