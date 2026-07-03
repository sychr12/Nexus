package com.sicpr.backend.memorando.central.dto;

import java.util.List;
import java.util.Map;

public record MemorandoCentralPageResponse(
        List<MemorandoCentralItemResponse> items,
        long total,
        int page,
        int size,
        int totalPages,
        Map<String, Long> statusCounts
) {
}
