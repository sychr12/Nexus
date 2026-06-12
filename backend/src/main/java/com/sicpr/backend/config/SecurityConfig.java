// backend/src/main/java/com/sicpr/backend/config/SecurityConfig.java
package com.sicpr.backend.config;

import com.sicpr.backend.security.JwtAuthFilter;
import com.sicpr.backend.security.RoleUtils;
import com.sicpr.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

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
                    HttpMethod.GET,
                    "/api/auth/ping"
                ).permitAll()

                // CARTEIRAS
                .requestMatchers(
                    "/api/carteira/**"
                ).hasAnyRole("ADMIN", "GERENTE", "TECNICO", "USUARIO")

                // MEMORANDOS
                .requestMatchers(
                    "/api/memorandos/**"
                ).hasAnyRole("ADMIN", "GERENTE", "TECNICO", "USUARIO")

                // INSCRICOES
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/inscricoes"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inscricoes"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inscricoes/web"
                ).hasAnyRole("ADMIN", "GERENTE", "TECNICO")

                // USUARIOS
                .requestMatchers(
                    "/api/users/**"
                ).hasRole("ADMIN")

                // EMAILS
                .requestMatchers(
                    "/api/email/**"
                ).hasRole("ADMIN")

                // ENCAMINHAMENTOS DE ANALISE
                .requestMatchers(
                    "/api/encaminhamentos-analise/**"
                ).hasAnyRole("ADMIN", "GERENTE", "TECNICO", "USUARIO")

                // FLUXO SICPR
                .requestMatchers(
                    "/api/fluxo/**"
                ).hasAnyRole("ADMIN", "GERENTE", "TECNICO", "USUARIO")

                // DASHBOARD
                .requestMatchers(
                    "/api/dashboard/**"
                ).hasAnyRole("ADMIN", "GERENTE", "TECNICO", "USUARIO")

                // ERRO
                .requestMatchers(
                    "/error"
                ).permitAll()

                // SWAGGER
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // RESTANTE
                .anyRequest().authenticated()
            )

            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:*"
        ));

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
