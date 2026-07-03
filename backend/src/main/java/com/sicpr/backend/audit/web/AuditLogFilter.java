package com.sicpr.backend.audit.web;

import com.sicpr.backend.audit.service.AuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class AuditLogFilter extends OncePerRequestFilter {

    private final AuditService auditService;
    private final AuditActionResolver actionResolver = new AuditActionResolver();

    public AuditLogFilter(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        boolean auditable = actionResolver.shouldAudit(request.getMethod(), request.getRequestURI());
        if (!auditable) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            filterChain.doFilter(request, response);
            record(request, response.getStatus(), null);
        } catch (ServletException | IOException | RuntimeException ex) {
            record(request, response.getStatus() >= 400 ? response.getStatus() : 500, ex);
            throw ex;
        }
    }

    private void record(HttpServletRequest request, int status, Exception exception) {
        AuditActionResolver.AuditAction action = actionResolver.resolve(request.getMethod(), request.getRequestURI());
        String outcome = status >= 400 || exception != null ? "FALHA" : "SUCESSO";
        String details = "status=" + status;
        if (exception != null) {
            details += "; exception=" + exception.getClass().getSimpleName();
        }

        auditService.record(
                currentUsername(),
                action.action(),
                action.resourceType(),
                action.resourceId(),
                request.getMethod(),
                request.getRequestURI(),
                status,
                outcome,
                details
        );
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            return "ANONIMO";
        }
        return authentication.getName();
    }
}
