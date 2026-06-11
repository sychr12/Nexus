"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthSession, getStoredUsername, hasAuthToken, resolveStoredAuthUser, type StoredAuthUser } from "@/app/_lib/auth";

type UseAuthSessionOptions = {
  defaultUsername?: string;
  redirectTo?: string;
};

export function useAuthSession(options: UseAuthSessionOptions = {}) {
  const { defaultUsername = "Usuario", redirectTo = "/login" } = options;
  const router = useRouter();
  const [user, setUser] = useState<StoredAuthUser>({
    username: defaultUsername,
    role: "",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasAuthToken()) {
      router.push(redirectTo);
      return;
    }

    let active = true;

    resolveStoredAuthUser(defaultUsername)
      .then((resolvedUser) => {
        if (active) setUser(resolvedUser);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [defaultUsername, redirectTo, router]);

  const logout = useCallback(() => {
    clearAuthSession();
    router.push(redirectTo);
  }, [redirectTo, router]);

  return {
    ...user,
    username: user.username || getStoredUsername(defaultUsername),
    ready,
    logout,
  };
}
