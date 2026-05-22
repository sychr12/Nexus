package com.sicpr.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getServletPath();
        String method = request.getMethod();

        if (
                ("POST".equals(method) && "/api/auth/login".equals(path))
                        || ("GET".equals(method) && "/api/auth/ping".equals(path))
                        || ("POST".equals(method) && "/api/inscricoes".equals(path))
                        || ("GET".equals(method) && "/api/inscricoes".equals(path))
                        || path.startsWith("/error")
                        || path.startsWith("/swagger-ui")
                        || path.startsWith("/v3/api-docs")
        ) {

            filterChain.doFilter(request, response);
            return;
        }

        String authHeader =
                request.getHeader("Authorization");

        if (
                authHeader == null
                        || !authHeader.startsWith("Bearer ")
        ) {

            filterChain.doFilter(request, response);
            return;
        }

        try {

            String token =
                    authHeader.substring(7);

            boolean tokenValido =
                    jwtService.validateToken(token);

            if (tokenValido) {

                String username =
                        jwtService.extractUsername(token);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(
                                        new SimpleGrantedAuthority(
                                                "ROLE_USER"
                                        )
                                )
                        );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);
            }

        } catch (Exception e) {

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.getWriter().write(
                    "Token inválido"
            );

            return;
        }

        filterChain.doFilter(
                request,
                response
        );
    }
}
