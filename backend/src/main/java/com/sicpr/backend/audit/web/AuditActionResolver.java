package com.sicpr.backend.audit.web;

import java.util.Locale;

class AuditActionResolver {

    AuditAction resolve(String method, String path) {
        String normalizedMethod = method == null ? "" : method.toUpperCase(Locale.ROOT);
        String normalizedPath = path == null ? "" : path;

        if (normalizedPath.equals("/api/fluxo/processos") && "POST".equals(normalizedMethod)) {
            return new AuditAction("FLUXO_PROCESSO_CRIAR", "PROCESSO_FLUXO", null);
        }
        if (normalizedPath.matches("/api/fluxo/processos/[^/]+") && "PUT".equals(normalizedMethod)) {
            return new AuditAction("FLUXO_PROCESSO_ATUALIZAR", "PROCESSO_FLUXO", segmentAfter(normalizedPath, "processos"));
        }
        if (normalizedPath.endsWith("/encaminhar-gerente")) {
            return new AuditAction("FLUXO_ENCAMINHAR_GERENTE", "PROCESSO_FLUXO", segmentAfter(normalizedPath, "processos"));
        }
        if (normalizedPath.equals("/api/fluxo/gerente/aprovar-lote")) {
            return new AuditAction("FLUXO_GERENTE_APROVAR_LOTE", "PROCESSO_FLUXO_LOTE", null);
        }
        if (normalizedPath.endsWith("/devolver-gerente")) {
            return new AuditAction("FLUXO_GERENTE_DEVOLVER", "PROCESSO_FLUXO", segmentAfter(normalizedPath, "processos"));
        }
        if (normalizedPath.endsWith("/analise/aprovar")) {
            return new AuditAction("FLUXO_ANALISE_APROVAR", "PROCESSO_FLUXO", segmentAfter(normalizedPath, "processos"));
        }
        if (normalizedPath.endsWith("/analise/devolver")) {
            return new AuditAction("FLUXO_ANALISE_DEVOLVER", "PROCESSO_FLUXO", segmentAfter(normalizedPath, "processos"));
        }
        if (normalizedPath.endsWith("/lancamento/concluir")) {
            return new AuditAction("FLUXO_LANCAMENTO_CONCLUIR", "PROCESSO_FLUXO", segmentAfter(normalizedPath, "processos"));
        }
        if (normalizedPath.endsWith("/lancamento/devolver")) {
            return new AuditAction("FLUXO_LANCAMENTO_DEVOLVER", "PROCESSO_FLUXO", segmentAfter(normalizedPath, "processos"));
        }
        if (normalizedPath.equals("/api/fluxo/gerentes") && "POST".equals(normalizedMethod)) {
            return new AuditAction("GERENTE_UNIDADE_CRIAR", "GERENTE_UNIDADE", null);
        }
        if (normalizedPath.matches("/api/fluxo/gerentes/[^/]+") && "PUT".equals(normalizedMethod)) {
            return new AuditAction("GERENTE_UNIDADE_ATUALIZAR", "GERENTE_UNIDADE", segmentAfter(normalizedPath, "gerentes"));
        }
        if (normalizedPath.endsWith("/inativar")) {
            return new AuditAction("GERENTE_UNIDADE_INATIVAR", "GERENTE_UNIDADE", segmentAfter(normalizedPath, "gerentes"));
        }

        if (normalizedPath.startsWith("/api/carteira/batch/upload")) {
            return new AuditAction("CARTEIRA_LOTE_UPLOAD", "CARTEIRA_DIGITAL", null);
        }
        if (normalizedPath.startsWith("/api/carteira/batch/zip")) {
            return new AuditAction("CARTEIRA_LOTE_ZIP", "CARTEIRA_DIGITAL", null);
        }
        if (normalizedPath.startsWith("/api/carteira")) {
            return new AuditAction("CARTEIRA_OPERACAO", "CARTEIRA_DIGITAL", segmentAfter(normalizedPath, "carteira"));
        }

        if (normalizedPath.startsWith("/api/memorandos") && "POST".equals(normalizedMethod)) {
            return new AuditAction("MEMORANDO_CRIAR", "MEMORANDO", null);
        }
        if (normalizedPath.startsWith("/api/memorandos") && "PUT".equals(normalizedMethod)) {
            return new AuditAction("MEMORANDO_ATUALIZAR", "MEMORANDO", segmentAfter(normalizedPath, "memorandos"));
        }
        if (normalizedPath.startsWith("/api/memorandos") && "DELETE".equals(normalizedMethod)) {
            return new AuditAction("MEMORANDO_EXCLUIR", "MEMORANDO", segmentAfter(normalizedPath, "memorandos"));
        }
        if (normalizedPath.startsWith("/api/central-memorandos")) {
            return new AuditAction("CENTRAL_MEMORANDO_OPERACAO", "MEMORANDO", null);
        }
        if (normalizedPath.contains("/download")) {
            return new AuditAction("DOCUMENTO_DOWNLOAD", inferResourceType(normalizedPath), inferResourceId(normalizedPath));
        }

        if (normalizedPath.startsWith("/api/mensagens") && "POST".equals(normalizedMethod)) {
            return new AuditAction("MENSAGEM_ENVIAR", "MENSAGEM", null);
        }
        if (normalizedPath.startsWith("/api/users") && "POST".equals(normalizedMethod)) {
            return new AuditAction("USUARIO_CRIAR", "USUARIO", null);
        }
        if (normalizedPath.startsWith("/api/users") && "PUT".equals(normalizedMethod)) {
            return new AuditAction("USUARIO_ATUALIZAR", "USUARIO", segmentAfter(normalizedPath, "users"));
        }
        if (normalizedPath.startsWith("/api/users") && "PATCH".equals(normalizedMethod)) {
            return new AuditAction("USUARIO_ALTERAR", "USUARIO", segmentAfter(normalizedPath, "users"));
        }
        if (normalizedPath.startsWith("/api/users") && "DELETE".equals(normalizedMethod)) {
            return new AuditAction("USUARIO_EXCLUIR", "USUARIO", segmentAfter(normalizedPath, "users"));
        }
        if (normalizedPath.equals("/api/inscricoes") && "POST".equals(normalizedMethod)) {
            return new AuditAction("INSCRICAO_CRIAR", "INSCRICAO", null);
        }
        return new AuditAction(isDownload(normalizedMethod, normalizedPath) ? "API_DOWNLOAD" : "API_MUTACAO", inferResourceType(normalizedPath), inferResourceId(normalizedPath));
    }

    boolean shouldAudit(String method, String path) {
        if (path == null || !path.startsWith("/api/")) {
            return false;
        }
        if (path.equals("/api/auth/login") || path.equals("/api/auth/logout") || path.equals("/api/auth/session")) {
            return false;
        }
        String normalizedMethod = method == null ? "" : method.toUpperCase(Locale.ROOT);
        return switch (normalizedMethod) {
            case "POST", "PUT", "PATCH", "DELETE" -> true;
            case "GET" -> isDownload(normalizedMethod, path);
            default -> false;
        };
    }

    private boolean isDownload(String method, String path) {
        return "GET".equals(method) && (path.contains("/download") || path.contains("/anexos/"));
    }

    private String inferResourceType(String path) {
        if (path.startsWith("/api/fluxo")) return "FLUXO";
        if (path.startsWith("/api/carteira")) return "CARTEIRA_DIGITAL";
        if (path.startsWith("/api/central-memorandos")) return "MEMORANDO";
        if (path.startsWith("/api/memorandos")) return "MEMORANDO";
        if (path.startsWith("/api/mensagens")) return "MENSAGEM";
        if (path.startsWith("/api/users")) return "USUARIO";
        if (path.startsWith("/api/inscricoes")) return "INSCRICAO";
        return "API";
    }

    private String inferResourceId(String path) {
        String[] segments = path.split("/");
        for (int index = segments.length - 1; index >= 0; index--) {
            String segment = segments[index];
            if (!segment.isBlank() && !segment.equals("download") && !segment.equals("anexos")) {
                return segment;
            }
        }
        return null;
    }

    private String segmentAfter(String path, String marker) {
        String[] segments = path.split("/");
        for (int index = 0; index < segments.length - 1; index++) {
            if (marker.equals(segments[index])) {
                return segments[index + 1];
            }
        }
        return null;
    }

    record AuditAction(String action, String resourceType, String resourceId) {
    }
}
