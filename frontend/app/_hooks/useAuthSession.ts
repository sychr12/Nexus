"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout as logoutRequest, resolveStoredAuthUser, type StoredAuthUser } from "@/app/_lib/auth";
import { canAccessRole, normalizeRole, type SystemRole } from "@/app/_lib/access-control";

type UseAuthSessionOptions = {
  defaultUsername?: string;
  redirectTo?: string;
  unauthorizedRedirectTo?: string;
  allowedRoles?: readonly SystemRole[];
};

export function useAuthSession(options: UseAuthSessionOptions = {}) {
  const { defaultUsername = "Usuario", redirectTo = "/login", unauthorizedRedirectTo = "/perfil?acesso=negado", allowedRoles } = options;
  const router = useRouter();
  const allowedRolesKey = allowedRoles?.join("|") || "";
  const [user, setUser] = useState<StoredAuthUser>({
    username: defaultUsername,
    role: "",
    unidadeLocal: null,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    resolveStoredAuthUser(defaultUsername)
      .then((resolvedUser) => {
        if (!active) return;

        const normalized = normalizeRole(resolvedUser.role);
        const effectiveAllowedRoles = allowedRolesKey ? allowedRolesKey.split("|") as SystemRole[] : undefined;
        if (!canAccessRole(normalized, effectiveAllowedRoles)) {
          router.replace(unauthorizedRedirectTo);
          return;
        }

        setUser({ ...resolvedUser, role: normalized });
        setReady(true);
      })
      .catch(() => {
        if (active) router.push(redirectTo);
      });

    return () => {
      active = false;
    };
  }, [allowedRolesKey, defaultUsername, redirectTo, router, unauthorizedRedirectTo]);

  const logout = useCallback(() => {
    void logoutRequest();
    router.push(redirectTo);
  }, [redirectTo, router]);

  return {
    ...user,
    username: user.username || defaultUsername,
    normalizedRole: normalizeRole(user.role),
    isAllowed: canAccessRole(user.role, allowedRoles),
    ready,
    logout,
  };
}
