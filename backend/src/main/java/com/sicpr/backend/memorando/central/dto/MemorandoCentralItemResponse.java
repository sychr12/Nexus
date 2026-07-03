package com.sicpr.backend.memorando.central.dto;

import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record MemorandoCentralItemResponse(
        String loteId,
        String numero,
        String arquivo,
        LocalDateTime criadoEm,
        String gerenteResponsavel,
        String unidadeLocal,
        Integer quantidade,
        List<Map<String, Object>> produtores,
        Map<String, Object> assinatura,
        List<ProcessoFluxoResponse> processos,
        String status,
        LocalDateTime ultimaMovimentacao,
        List<String> tecnicos,
        String relacionadoAnterior,
        String sucessor,
        List<String> cadeiaSucessao
) {
}
