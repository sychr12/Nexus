package com.sicpr.backend.analise.validator;

import com.sicpr.backend.analise.dto.AnaliseRequest;
import com.sicpr.backend.analise.dto.DecisaoProcessoRequest;
import com.sicpr.backend.analise.dto.ProcessoAnaliseRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class AnaliseValidator {

    private AnaliseValidator() {
    }

    public static void validarAnalise(
            AnaliseRequest request
    ) {

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados da análise não enviados."
            );
        }

        if (isBlank(request.getNumero())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Número do memorando é obrigatório."
            );
        }

        if (isBlank(request.getTitulo())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Título do memorando é obrigatório."
            );
        }

        if (isBlank(request.getLocalidade())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Localidade é obrigatória."
            );
        }

        if (request.getProcessos() == null
                || request.getProcessos().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A análise deve possuir ao menos um processo."
            );
        }

        request.getProcessos()
                .forEach(AnaliseValidator::validarProcesso);
    }

    public static void validarProcesso(
            ProcessoAnaliseRequest request
    ) {

        if (isBlank(request.getProdutor())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nome do produtor é obrigatório."
            );
        }

        if (isBlank(request.getCpf())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "CPF do produtor é obrigatório."
            );
        }

        if (isBlank(request.getProcessoPdf())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PDF do processo é obrigatório."
            );
        }

        if (isBlank(request.getDeclaracaoPdf())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PDF da declaração é obrigatório."
            );
        }
    }

    public static void validarDecisao(
            DecisaoProcessoRequest request
    ) {

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados da decisão não enviados."
            );
        }

        if (isBlank(request.getDestino())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Destino é obrigatório."
            );
        }

        boolean lancamento =
                "lancamento".equalsIgnoreCase(
                        request.getDestino()
                );

        boolean devolucao =
                "devolucao".equalsIgnoreCase(
                        request.getDestino()
                );

        if (!lancamento && !devolucao) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Destino inválido."
            );
        }

        if (devolucao) {

            if (isBlank(request.getMotivo())) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Motivo da devolução é obrigatório."
                );
            }

            if (isBlank(request.getObservacao())) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Observação da devolução é obrigatória."
                );
            }
        }
    }

    private static boolean isBlank(
            String valor
    ) {

        return valor == null || valor.isBlank();
    }
}