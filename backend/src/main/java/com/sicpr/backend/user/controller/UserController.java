package com.sicpr.backend.user.controller;

import com.sicpr.backend.auth.dto.UserRequest;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;

    @GetMapping
    public List<UserResponse> getAll() {
        return service.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public UserResponse getById(@PathVariable Long id) {
        return UserResponse.from(service.findById(id));
    }

    @GetMapping("/username/{username}")
    public UserResponse getByUsername(@PathVariable String username) {
        return UserResponse.from(service.findByUsername(username));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody UserRequest request) {
        User user = User.builder()
                .username(request.getUsername())
                .password(request.getPassword())
                .nomeCompleto(request.getNomeCompleto())
                .telefone(request.getTelefone())
                .perfil(request.getPerfil())
                .status(request.getStatus())
                .build();
        return UserResponse.from(service.create(user));
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        User user = User.builder()
                .nomeCompleto(request.getNomeCompleto())
                .telefone(request.getTelefone())
                .perfil(request.getPerfil())
                .password(request.getPassword())
                .build();
        return UserResponse.from(service.update(id, user));
    }

    @PatchMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@PathVariable Long id,
                               @RequestParam String oldPassword,
                               @RequestParam String newPassword) {
        service.changePassword(id, oldPassword, newPassword);
    }

    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateStatus(@PathVariable Long id, @RequestParam String status) {
        service.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    record UserResponse(
            Long id,
            String username,
            String nomeCompleto,
            String telefone,
            String perfil,
            String status
    ) {
        static UserResponse from(User u) {
            return new UserResponse(
                    u.getId(), u.getUsername(),
                    u.getNomeCompleto(), u.getTelefone(),
                    u.getPerfil(), u.getStatus()
            );
        }
    }
}
