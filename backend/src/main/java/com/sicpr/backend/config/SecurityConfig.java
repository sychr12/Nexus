package com.sicpr.backend.config;

import com.sicpr.backend.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .cors(cors -> {})

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // OPTIONS
                .requestMatchers(
                        HttpMethod.OPTIONS,
                        "/**"
                ).permitAll()

                // AUTH
                .requestMatchers(
                        "/api/auth/**"
                ).permitAll()

                // MEMORANDOS
                .requestMatchers(
                        "/api/memorandos/**"
                ).permitAll()

                // INSCRIÇÕES
                .requestMatchers(
                        "/api/inscricoes/**"
                ).permitAll()

                // ENCAMINHAMENTOS DE ANÁLISE
                .requestMatchers(
                        "/api/encaminhamentos-analise/**"
                ).permitAll()

                // DASHBOARD
                .requestMatchers(
                        "/api/dashboard/**"
                ).authenticated()

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

            .addFilterBefore(
                    jwtAuthFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
