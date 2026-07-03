package com.sicpr.backend.auth.controller;

import com.sicpr.backend.audit.service.AuditService;
import com.sicpr.backend.auth.dto.AuthResponse;
import com.sicpr.backend.auth.dto.LoginRequest;
import com.sicpr.backend.auth.service.AuthService;
import com.sicpr.backend.security.CurrentUserService;
import com.sicpr.backend.security.RoleUtils;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import com.sicpr.backend.user.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.web.csrf.CsrfToken;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String AUTH_COOKIE = "SICPR_AUTH";

    private final AuthService authService;
    private final CurrentUserService currentUser;
    private final UserRepository userRepository;
    private final UserService userService;
    private final AuditService auditService;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.auth.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${app.auth.cookie-same-site:Lax}")
    private String cookieSameSite;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authenticated;
        try {
            authenticated = authService.login(request);
        } catch (ResponseStatusException ex) {
            auditService.recordFailure(request.getUsername(), "AUTH_LOGIN", "USUARIO", request.getUsername(), ex.getStatusCode().value(), "Login recusado");
            throw ex;
        } catch (RuntimeException ex) {
            auditService.recordFailure(request.getUsername(), "AUTH_LOGIN", "USUARIO", request.getUsername(), 401, "Login recusado");
            throw ex;
        }

        auditService.recordSuccess(authenticated.getUsername(), "AUTH_LOGIN", "USUARIO", authenticated.getUsername(), "Login bem-sucedido");
        ResponseCookie cookie = ResponseCookie.from(AUTH_COOKIE, authenticated.getToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ofMillis(jwtExpirationMs))
                .build();

        AuthResponse body = new AuthResponse(
                null,
                authenticated.getUsername(),
                authenticated.getPerfil(),
                authenticated.getRole(),
                authenticated.getUnidadeLocal()
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        String username = currentUser.currentUsername().orElse("ANONIMO");
        auditService.recordSuccess(
                username,
                "AUTH_LOGOUT",
                "USUARIO",
                "ANONIMO".equals(username) ? null : username,
                "Logout solicitado"
        );

        ResponseCookie cookie = ResponseCookie.from(AUTH_COOKIE, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<Void> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        userService.resetPasswordWithToken(request.username(), request.token(), request.newPassword());
        auditService.recordSuccess(request.username(), "AUTH_PASSWORD_RESET", "USUARIO", request.username(), "Senha redefinida com codigo temporario");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/session")
    public AuthResponse session() {
        User user = userRepository.findByUsername(currentUser.requireUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessao invalida."));
        String perfil = RoleUtils.normalizeRole(user.getPerfil());
        return new AuthResponse(null, user.getUsername(), perfil, RoleUtils.authorityFor(perfil), user.getUnidadeLocal());
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }

    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        csrfToken.getToken();
        return ResponseEntity.noContent().build();
    }

    record PasswordResetConfirmRequest(
            @NotBlank(message = "Usuario e obrigatorio.")
            String username,

            @NotBlank(message = "Codigo temporario e obrigatorio.")
            String token,

            @NotBlank(message = "Nova senha e obrigatoria.")
            @Size(min = 8, max = 120, message = "Nova senha deve ter entre 8 e 120 caracteres.")
            String newPassword
    ) {
    }
}
