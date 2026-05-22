// backend/src/main/java/com/sicpr/backend/email/dto/EmailStatsDTO.java
package com.sicpr.backend.email.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailStatsDTO {
    private long total;
    private long hoje;
    private long estaSemana;
    private long esteMes;
    private Map<String, Long> porMunicipio;
}