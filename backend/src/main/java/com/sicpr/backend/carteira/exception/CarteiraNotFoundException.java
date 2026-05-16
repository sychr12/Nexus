package com.sicpr.backend.carteira.exception;

public class CarteiraNotFoundException extends RuntimeException {
    
    public CarteiraNotFoundException(String message) {
        super(message);
    }
    
    public CarteiraNotFoundException(Long id) {
        super("Carteira não encontrada com ID: " + id);
    }
    
    public CarteiraNotFoundException(String cpf, String tipo) {
        super("Carteira não encontrada para " + tipo + ": " + cpf);
    }
}