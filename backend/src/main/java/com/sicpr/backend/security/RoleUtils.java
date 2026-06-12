package com.sicpr.backend.security;

public final class RoleUtils {

    private RoleUtils() {
    }

    public static String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "USUARIO";
        }

        String normalized = role.trim().toUpperCase();
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring("ROLE_".length());
        }

        return switch (normalized) {
            case "ADMIN", "GERENTE", "TECNICO", "USUARIO" -> normalized;
            case "CHEFE" -> "GERENTE";
            default -> "USUARIO";
        };
    }

    public static String authorityFor(String role) {
        return "ROLE_" + normalizeRole(role);
    }
}
