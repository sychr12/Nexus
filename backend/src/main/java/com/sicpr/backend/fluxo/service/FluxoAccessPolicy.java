package com.sicpr.backend.fluxo.service;

import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.security.RoleUtils;
import com.sicpr.backend.user.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class FluxoAccessPolicy {

    public boolean hasGlobalAccess(User user) {
        String role = RoleUtils.normalizeRole(user.getPerfil());
        return "ADMIN".equals(role);
    }

    public boolean isAdmin(User user) {
        return "ADMIN".equals(RoleUtils.normalizeRole(user.getPerfil()));
    }

    public String requireScopedUnidadeLocal(User user) {
        String unidadeLocal = user.getUnidadeLocal();
        if (unidadeLocal == null || unidadeLocal.trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario sem unidade local vinculada.");
        }
        return unidadeLocal.trim();
    }

    public void requireAccessToProcesso(User user, ProcessoFluxo processo) {
        requireAccessToUnidadeLocal(user, processo.getUnidadeLocal());
    }

    public void requireAccessToUnidadeLocal(User user, String unidadeLocal) {
        if (hasGlobalAccess(user)) {
            return;
        }
        String unidadePermitida = requireScopedUnidadeLocal(user);
        if (!sameUnidadeLocal(unidadePermitida, unidadeLocal)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario nao tem acesso a esta unidade local.");
        }
    }

    public boolean sameUnidadeLocal(String left, String right) {
        return normalizeUnidadeLocal(left).equals(normalizeUnidadeLocal(right));
    }

    public String normalizeUnidadeLocal(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
