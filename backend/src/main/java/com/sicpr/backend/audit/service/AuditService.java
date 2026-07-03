package com.sicpr.backend.audit.service;

import com.sicpr.backend.audit.model.AuditEvent;
import com.sicpr.backend.audit.repository.AuditEventRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private static final int MAX_USER_AGENT_LENGTH = 500;

    private final AuditEventRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            String username,
            String action,
            String resourceType,
            String resourceId,
            String method,
            String path,
            Integer httpStatus,
            String outcome,
            String details
    ) {
        try {
            HttpServletRequest request = currentRequest();
            AuditEvent event = new AuditEvent();
            event.setUsuario(clean(username));
            event.setAcao(clean(action));
            event.setRecursoTipo(clean(resourceType));
            event.setRecursoId(clean(resourceId));
            event.setMetodoHttp(clean(method));
            event.setCaminho(clean(path));
            event.setStatusHttp(httpStatus);
            event.setResultado(clean(outcome));
            event.setDetalhes(clean(details));

            if (request != null) {
                event.setIpOrigem(clientIp(request));
                event.setUserAgent(limit(clean(request.getHeader("User-Agent")), MAX_USER_AGENT_LENGTH));
                event.setCorrelationId(correlationId(request));
            }

            repository.save(event);
        } catch (Exception ex) {
            log.warn("Falha ao registrar evento de auditoria", ex);
        }
    }

    public void recordSuccess(String username, String action, String resourceType, String resourceId, String details) {
        HttpServletRequest request = currentRequest();
        record(
                username,
                action,
                resourceType,
                resourceId,
                request != null ? request.getMethod() : null,
                request != null ? request.getRequestURI() : null,
                200,
                "SUCESSO",
                details
        );
    }

    public void recordFailure(String username, String action, String resourceType, String resourceId, Integer status, String details) {
        HttpServletRequest request = currentRequest();
        record(
                username,
                action,
                resourceType,
                resourceId,
                request != null ? request.getMethod() : null,
                request != null ? request.getRequestURI() : null,
                status,
                "FALHA",
                details
        );
    }

    private HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest();
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String correlationId(HttpServletRequest request) {
        String requestId = request.getHeader("X-Request-Id");
        if (requestId != null && !requestId.isBlank()) {
            return clean(requestId);
        }
        String correlation = request.getHeader("X-Correlation-Id");
        return clean(correlation);
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceAll("[\\r\\n\\t]", " ").trim();
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
