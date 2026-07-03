// backend/src/main/java/com/sicpr/backend/config/SecurityConfig.java
package com.sicpr.backend.config;

import com.sicpr.backend.audit.service.AuditService;
import com.sicpr.backend.audit.web.AuditLogFilter;
import com.sicpr.backend.security.JwtAuthFilter;
import com.sicpr.backend.security.RoleUtils;
import com.sicpr.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuditService auditService;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        CsrfTokenRequestAttributeHandler csrfRequestHandler = new CsrfTokenRequestAttributeHandler();
        csrfRequestHandler.setCsrfRequestAttributeName("_csrf");

        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(csrfRequestHandler)
                .ignoringRequestMatchers(
                    "/api/auth/login",
                    "/api/auth/password-reset/confirm",
                    "/api/inscricoes",
                    "/error"
                )
            )

            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(auth -> auth

                // OPTIONS
                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()

                // AUTH
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/login"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/logout"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/password-reset/confirm"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/auth/ping",
                    "/api/auth/csrf"
                ).permitAll()

                // HEALTHCHECK
                .requestMatchers(
                    HttpMethod.GET,
                    "/actuator/health",
                    "/actuator/health/**"
                ).permitAll()

                // CARTEIRAS - setor Carteira do Produtor em Manaus
                .requestMatchers(
                    "/api/carteira/**"
                ).hasAnyRole("ADMIN", "USUARIO")

                // MEMORANDOS - administracao central por enquanto
                .requestMatchers(
                    "/api/memorandos/**"
                ).hasRole("ADMIN")

                // INSCRICOES
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/inscricoes"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inscricoes"
                ).hasAnyRole("ADMIN", "GERENTE", "TECNICO", "USUARIO")
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inscricoes/web"
                ).hasAnyRole("ADMIN", "GERENTE", "TECNICO", "USUARIO")

                // USUARIOS
                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/users/me/password"
                ).authenticated()
                .requestMatchers(
                    "/api/users/**"
                ).hasRole("ADMIN")

                // AUDITORIA
                .requestMatchers(
                    "/api/auditoria/**"
                ).hasRole("ADMIN")

                // ANALISES - equipe Carteira do Produtor
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/analises/**"
                ).hasAnyRole("ADMIN", "USUARIO")
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/analises/**"
                ).hasAnyRole("ADMIN", "USUARIO")
                .requestMatchers(
                    "/api/analises/**"
                ).hasRole("ADMIN")

                // ENCAMINHAMENTOS DE ANALISE
                .requestMatchers(
                    "/api/encaminhamentos-analise/**"
                ).hasAnyRole("ADMIN", "USUARIO")

                // FLUXO SICPR
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/fluxo/processos"
                ).hasAnyRole("ADMIN", "TECNICO", "USUARIO")
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/fluxo/processos/*"
                ).hasAnyRole("ADMIN", "TECNICO", "USUARIO")
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/fluxo/processos/*/encaminhar-gerente"
                ).hasAnyRole("ADMIN", "TECNICO", "USUARIO")
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/fluxo/processos/gerente"
                ).hasAnyRole("ADMIN", "GERENTE")
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/fluxo/gerente/aprovar-lote",
                    "/api/fluxo/processos/*/devolver-gerente"
                ).hasAnyRole("ADMIN", "GERENTE")
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/fluxo/processos/analise"
                ).hasAnyRole("ADMIN", "USUARIO")
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/fluxo/processos/*/analise/aprovar",
                    "/api/fluxo/processos/*/analise/devolver",
                    "/api/fluxo/processos/*/lancamento/concluir",
                    "/api/fluxo/processos/*/lancamento/devolver"
                ).hasAnyRole("ADMIN", "USUARIO")
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/fluxo/gerentes",
                    "/api/fluxo/gerentes/*/inativar"
                ).hasRole("ADMIN")
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/fluxo/gerentes/*"
                ).hasRole("ADMIN")
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/fluxo/processos",
                    "/api/fluxo/processos/*"
                ).hasAnyRole("ADMIN", "GERENTE", "TECNICO", "USUARIO")
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/fluxo/gerentes"
                ).hasAnyRole("ADMIN", "GERENTE")
                .requestMatchers(
                    "/api/fluxo/**"
                ).hasRole("ADMIN")

                // MENSAGENS - comunicacao interna operacional
                .requestMatchers(
                    "/api/mensagens/**"
                ).hasAnyRole("ADMIN", "TECNICO", "USUARIO")

                // DASHBOARD E RELATORIOS GERENCIAIS
                .requestMatchers(
                    "/api/dashboard/**"
                ).hasAnyRole("ADMIN", "GERENTE")
                .requestMatchers(
                    "/api/relatorios/**"
                ).hasAnyRole("ADMIN", "GERENTE")
                .requestMatchers(
                    "/api/central-memorandos/**"
                ).hasAnyRole("ADMIN", "GERENTE")

                // ERRO
                .requestMatchers(
                    "/error"
                ).permitAll()

                // SWAGGER
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).hasRole("ADMIN")

                // RESTANTE
                .anyRequest().authenticated()
            )

            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(new AuditLogFilter(auditService), JwtAuthFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(parseAllowedOrigins());

        configuration.setAllowedMethods(Arrays.asList(
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS"
        ));

        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    private List<String> parseAllowedOrigins() {
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return username -> userRepository.findByUsername(username)
            .map(user -> new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                "ATIVO".equals(user.getStatus()),
                true,
                true,
                true,
                java.util.List.of(new SimpleGrantedAuthority(RoleUtils.authorityFor(user.getPerfil())))
            ))
            .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado"));
    }
}
