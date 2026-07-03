package com.sicpr.backend.user.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class PasswordPolicy {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 120;

    public void validate(String password, String username) {
        if (password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha e obrigatoria.");
        }

        if (password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha deve ter entre 8 e 120 caracteres.");
        }

        if (password.chars().anyMatch(Character::isWhitespace)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha nao pode conter espacos.");
        }

        if (!password.chars().anyMatch(Character::isUpperCase)
                || !password.chars().anyMatch(Character::isLowerCase)
                || !password.chars().anyMatch(Character::isDigit)
                || password.chars().noneMatch(this::isSpecialCharacter)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha deve conter letra maiuscula, letra minuscula, numero e caractere especial.");
        }
    }

    private boolean isSpecialCharacter(int value) {
        return !Character.isLetterOrDigit(value);
    }
}
