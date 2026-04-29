package com.sicpr.backend.auth.service;

import com.sicpr.backend.auth.dto.AuthResponse;
import com.sicpr.backend.auth.dto.LoginRequest;
import com.sicpr.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;

    public AuthResponse login(LoginRequest request) {

        if (request.getEmail() == null || request.getEmail().isEmpty()) {
            throw new RuntimeException("Email obrigatório");
        }

        String token = jwtService.generateToken(request.getEmail());

        return new AuthResponse(token);
    }
}