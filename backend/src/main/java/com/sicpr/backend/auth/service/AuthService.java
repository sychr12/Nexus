package com.sicpr.backend.auth.service;

import com.sicpr.backend.auth.dto.*;
import com.sicpr.backend.security.JwtService;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import com.sicpr.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserService userService;

    public AuthResponse login(LoginRequest request) {
        // 1. Busca o usuário
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));

        // 2. Verifica se está bloqueado
        if ("BLOQUEADO".equals(user.getStatus())) {
            if (user.getBloqueadoAte() != null && LocalDateTime.now().isBefore(user.getBloqueadoAte())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Usuário bloqueado. Tente novamente mais tarde.");
            } else {
                // Desbloqueio automático após expirar o tempo
                userService.resetTentativasFalhas(user.getUsername());
            }
        }

        // 3. Verifica se está inativo
        if ("INATIVO".equals(user.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuário inativo.");
        }

        // 4. Valida a senha
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            userService.incrementTentativasFalhas(user.getUsername());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        }

        // 5. Login bem-sucedido: reseta tentativas e registra último login
        userService.resetTentativasFalhas(user.getUsername());
        userService.registrarUltimoLogin(user.getUsername());

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token);
    }
}