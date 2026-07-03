package com.sicpr.backend.audit.controller;

import com.sicpr.backend.audit.model.AuditEvent;
import com.sicpr.backend.audit.repository.AuditEventRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
public class AuditController {

    private static final int MAX_PAGE_SIZE = 100;

    private final AuditEventRepository repository;

    @GetMapping("/eventos")
    public AuditPageResponse listarEventos(
            @RequestParam(required = false) String usuario,
            @RequestParam(required = false) String acao,
            @RequestParam(required = false) String resultado,
            @RequestParam(required = false) String recursoTipo,
            @RequestParam(required = false) String recursoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime ate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "ocorreuEm"));
        Page<AuditEventResponse> result = repository.findAll(specification(usuario, acao, resultado, recursoTipo, recursoId, de, ate), pageable)
                .map(AuditEventResponse::from);
        return AuditPageResponse.from(result);
    }

    private Specification<AuditEvent> specification(
            String usuario,
            String acao,
            String resultado,
            String recursoTipo,
            String recursoId,
            LocalDateTime de,
            LocalDateTime ate
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (hasText(usuario)) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("usuario")), like(usuario.toLowerCase())));
            }
            if (hasText(acao)) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("acao")), like(acao.toLowerCase())));
            }
            if (hasText(resultado)) {
                predicates.add(criteriaBuilder.equal(root.get("resultado"), resultado.trim().toUpperCase()));
            }
            if (hasText(recursoTipo)) {
                predicates.add(criteriaBuilder.equal(root.get("recursoTipo"), recursoTipo.trim().toUpperCase()));
            }
            if (hasText(recursoId)) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("recursoId")), like(recursoId.toLowerCase())));
            }
            if (de != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("ocorreuEm"), de));
            }
            if (ate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("ocorreuEm"), ate));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String like(String value) {
        return "%" + value.trim().replace("%", "\\%").replace("_", "\\_") + "%";
    }

    public record AuditEventResponse(
            Long id,
            LocalDateTime ocorreuEm,
            String usuario,
            String acao,
            String recursoTipo,
            String recursoId,
            String metodoHttp,
            String caminho,
            Integer statusHttp,
            String resultado,
            String ipOrigem,
            String userAgent,
            String correlationId,
            String detalhes
    ) {
        static AuditEventResponse from(AuditEvent event) {
            return new AuditEventResponse(
                    event.getId(),
                    event.getOcorreuEm(),
                    event.getUsuario(),
                    event.getAcao(),
                    event.getRecursoTipo(),
                    event.getRecursoId(),
                    event.getMetodoHttp(),
                    event.getCaminho(),
                    event.getStatusHttp(),
                    event.getResultado(),
                    event.getIpOrigem(),
                    event.getUserAgent(),
                    event.getCorrelationId(),
                    event.getDetalhes()
            );
        }
    }

    public record AuditPageResponse(
            List<AuditEventResponse> content,
            long totalElements,
            int totalPages,
            int number,
            int size,
            boolean first,
            boolean last
    ) {
        static AuditPageResponse from(Page<AuditEventResponse> page) {
            return new AuditPageResponse(
                    page.getContent(),
                    page.getTotalElements(),
                    page.getTotalPages(),
                    page.getNumber(),
                    page.getSize(),
                    page.isFirst(),
                    page.isLast()
            );
        }
    }
}
