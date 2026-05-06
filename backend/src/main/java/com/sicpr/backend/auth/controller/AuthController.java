package com.sicpr.backend.auth.controller;

import com.sicpr.backend.auth.dto.*;
import com.sicpr.backend.auth.service.AuthService;
import com.sicpr.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }

    @GetMapping("/check-user")
    public String checkUser(@RequestParam String username) {
        var user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            return "✅ Usuário encontrado: " + user.get().getUsername()
                    + " | ID: " + user.get().getId()
                    + " | Status: " + user.get().getStatus();
        } else {
            return "❌ Usuário NÃO encontrado: " + username;
        }
    }

    @GetMapping("/all-users")
    public String listAllUsers() {
        StringBuilder sb = new StringBuilder("📋 Lista de usuários no banco:\n");
        userRepository.findAll().forEach(u ->
                sb.append(" - Username: '").append(u.getUsername())
                  .append("' | ID: ").append(u.getId())
                  .append(" | Status: ").append(u.getStatus()).append("\n")
        );
        if (userRepository.count() == 0) {
            sb.append("⚠️ Nenhum usuário encontrado no banco!");
        }
        return sb.toString();
    }

    
    @GetMapping("/hash")
    public String gerarHash(@RequestParam String senha) {
        return passwordEncoder.encode(senha);
    }
}