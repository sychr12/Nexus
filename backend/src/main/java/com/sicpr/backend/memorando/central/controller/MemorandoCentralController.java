package com.sicpr.backend.memorando.central.controller;

import com.sicpr.backend.audit.service.AuditService;
import com.sicpr.backend.memorando.central.dto.MemorandoCentralPageResponse;
import com.sicpr.backend.memorando.central.service.MemorandoCentralService;
import com.sicpr.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/central-memorandos")
@RequiredArgsConstructor
public class MemorandoCentralController {

    private final MemorandoCentralService service;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public MemorandoCentralPageResponse listar(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "todos") String status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "50") Integer size
    ) {
        MemorandoCentralPageResponse response = service.listar(search, status, page, size);
        auditService.recordSuccess(
                currentUserService.requireUsername(),
                "CENTRAL_MEMORANDO_CONSULTAR",
                "MEMORANDO",
                null,
                "Consulta na Central de Memorandos: status=" + status + ", page=" + page + ", size=" + size
        );
        return response;
    }
}
