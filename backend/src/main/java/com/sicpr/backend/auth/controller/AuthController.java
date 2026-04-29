package com.sicpr.backend.auth.controller;

import com.sicpr.backend.auth.dto.AuthResponse;
import com.sicpr.backend.auth.dto.LoginRequest;
import com.sicpr.backend.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AuthController {

    private final AuthService service;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return service.login(request);
    }
}