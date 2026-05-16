package com.sicpr.backend.memorando.word;

import com.sicpr.backend.memorando.entity.Memorando;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WordGeneratorService {

    private final WordTemplateProcessor processor;

    public byte[] gerarDocumento(
            Memorando memorando
    ) {

        return processor.processar(
                memorando
        );
    }
}