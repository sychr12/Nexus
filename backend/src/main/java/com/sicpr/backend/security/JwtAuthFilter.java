package com.sicpr.backend.security;

import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String AUTH_COOKIE = "SICPR_AUTH";

    private final JwtService jwtService;
    private final UserRepository userRepository;

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
        ) {

            filterChain.doFilter(request, response);
            return;
        }

        String token = resolveToken(request);

        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {

            boolean tokenValido =
                    jwtService.validateToken(token);

            if (tokenValido) {

                String username =
                        jwtService.extractUsername(token);
                User user = userRepository.findByUsername(username).orElse(null);
                if (user == null || !"ATIVO".equals(user.getStatus())) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Usuario inativo ou inexistente");
                    return;
                }

                String role = user.getPerfil() != null ? user.getPerfil() : jwtService.extractRole(token);

                UserDetails principal =
                        new org.springframework.security.core.userdetails.User(
                                user.getUsername(),
                                user.getPassword(),
                                "ATIVO".equals(user.getStatus()),
                                true,
                                true,
                                true,
                                List.of(new SimpleGrantedAuthority(RoleUtils.authorityFor(role)))
                        );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                principal.getAuthorities()
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

    private String resolveToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (AUTH_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
}
