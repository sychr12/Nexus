package com.sicpr.backend.user.service;

import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public List<User> findAll() {
        return repository.findAll();
    }

    @SuppressWarnings("null")
    public User findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + id));
    }

    public User findByUsername(String username) {
        return repository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + username));
    }

    @SuppressWarnings("null")
    @Transactional
    public User create(User user) {
        if (repository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username já existe");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus("ATIVO");
        user.setPerfil(user.getPerfil() != null ? user.getPerfil() : "USUARIO");
        user.setTentativasFalhas(0);
        User saved = repository.save(user);
        log.info("Usuário criado: {}", saved.getUsername());
        return saved;
    }

    @Transactional
    public User update(Long id, User userUpdate) {
        User existing = findById(id);
        existing.setNomeCompleto(userUpdate.getNomeCompleto());
        existing.setTelefone(userUpdate.getTelefone());
        existing.setPerfil(userUpdate.getPerfil());
        if (userUpdate.getPassword() != null && !userUpdate.getPassword().isEmpty()) {
            existing.setPassword(passwordEncoder.encode(userUpdate.getPassword()));
            existing.setSenhaAlteradaEm(LocalDateTime.now());
        }
        User saved = repository.save(existing);
        log.info("Usuário atualizado: {}", saved.getUsername());
        return saved;
    }

    @Transactional
    public void changePassword(Long id, String oldPassword, String newPassword) {
        User user = findById(id);
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Senha atual incorreta");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setSenhaAlteradaEm(LocalDateTime.now());
        repository.save(user);
        log.info("Senha alterada para usuário: {}", user.getUsername());
    }

    @Transactional
    public void delete(Long id) {
        User user = findById(id);
        repository.delete(user);
        log.info("Usuário deletado: {}", user.getUsername());
    }

    @Transactional
    public void updateStatus(Long id, String status) {
        User user = findById(id);
        user.setStatus(status);
        repository.save(user);
        log.info("Status do usuário {} alterado para: {}", user.getUsername(), status);
    }

    @Transactional
    public void incrementTentativasFalhas(String username) {
        User user = findByUsername(username);
        int atual = user.getTentativasFalhas() != null ? user.getTentativasFalhas() : 0;
        user.setTentativasFalhas(atual + 1);
        if (user.getTentativasFalhas() >= 5) {
            user.setStatus("BLOQUEADO");
            user.setBloqueadoAte(LocalDateTime.now().plusMinutes(30));
            log.warn("Usuário {} bloqueado após {} tentativas", username, user.getTentativasFalhas());
        }
        repository.save(user);
    }

    @Transactional
    public void resetTentativasFalhas(String username) {
        User user = findByUsername(username);
        user.setTentativasFalhas(0);
        user.setBloqueadoAte(null);
        if ("BLOQUEADO".equals(user.getStatus())) {
            user.setStatus("ATIVO");
        }
        repository.save(user);
    }

    @Transactional
    public void registrarUltimoLogin(String username) {
        User user = findByUsername(username);
        user.setUltimoLogin(LocalDateTime.now());
        repository.save(user);
    }
}
