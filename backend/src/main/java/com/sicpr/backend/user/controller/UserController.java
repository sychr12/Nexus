package com.sicpr.backend.user.controller;

import com.sicpr.backend.auth.dto.UserRequest;
import com.sicpr.backend.security.CurrentUserService;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;
    private final CurrentUserService currentUser;

    @GetMapping
    public List<UserResponse> getAll(@RequestParam(defaultValue = "500") int limit) {
        return service.findAll(limit).stream()
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
                .unidadeLocal(request.getUnidadeLocal())
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
                .unidadeLocal(request.getUnidadeLocal())
                .perfil(request.getPerfil())
                .password(request.getPassword())
                .build();
        return UserResponse.from(service.update(id, user));
    }

    @PatchMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@PathVariable Long id,
                               @Valid @RequestBody ChangePasswordRequest request) {
        service.changePassword(id, request.oldPassword(), request.newPassword());
    }

    @PatchMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeOwnPassword(@Valid @RequestBody ChangePasswordRequest request) {
        service.changeOwnPassword(currentUser.requireUsername(), request.oldPassword(), request.newPassword());
    }

    @PostMapping("/{id}/password-reset-token")
    public PasswordResetTokenResponse issuePasswordResetToken(@PathVariable Long id) {
        UserService.PasswordResetToken resetToken = service.issuePasswordResetToken(id);
        return new PasswordResetTokenResponse(resetToken.token(), resetToken.expiresAt());
    }

    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateStatus(@PathVariable Long id, @RequestParam String status) {
        ensureNotCurrentUser(id, "Voce nao pode alterar o status do seu proprio usuario.");
        service.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        ensureNotCurrentUser(id, "Voce nao pode inativar o seu proprio usuario.");
        service.delete(id);
    }

    private void ensureNotCurrentUser(Long id, String message) {
        User target = service.findById(id);
        if (target.getUsername() != null && target.getUsername().equalsIgnoreCase(currentUser.requireUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    record UserResponse(
            Long id,
            String username,
            String nomeCompleto,
            String telefone,
            String unidadeLocal,
            String perfil,
            String status
    ) {
        static UserResponse from(User u) {
            return new UserResponse(
                    u.getId(), u.getUsername(),
                    u.getNomeCompleto(), u.getTelefone(), u.getUnidadeLocal(),
                    u.getPerfil(), u.getStatus()
            );
        }
    }

    record ChangePasswordRequest(
            @NotBlank(message = "Senha atual e obrigatoria.")
            String oldPassword,

            @NotBlank(message = "Nova senha e obrigatoria.")
            @Size(min = 8, max = 120, message = "Nova senha deve ter entre 8 e 120 caracteres.")
            String newPassword
    ) {
    }

    record PasswordResetTokenResponse(
            String token,
            LocalDateTime expiresAt
    ) {
    }
}
