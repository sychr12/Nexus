package com.sicpr.backend.memorando.word;

import com.sicpr.backend.memorando.entity.Memorando;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class WordTemplateProcessor {

    private static final DateTimeFormatter BR_DATE =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] processar(
            Memorando memorando
    ) {

        try {

            InputStream input =
                    getClass().getResourceAsStream(
                            "/templates/modelo_memosaida.docx"
                    );

            if (input == null) {
                throw new RuntimeException(
                        "Template Word não encontrado"
                );
            }

            XWPFDocument document =
                    new XWPFDocument(
                            new ByteArrayInputStream(
                                    input.readAllBytes()
                            )
                    );

            Map<String,String> values =
                    new HashMap<>();

            values.put(
                    "(num)",
                    memorando.getNumero()
            );

            values.put(
                    "(data)",
                    memorando.getDataEmissao() != null
                            ? memorando.getDataEmissao()
                            .format(BR_DATE)
                            : ""
            );

            values.put(
                    "(muni)",
                    memorando.getMunicipio()
            );

            values.put(
                    "(memos)",
                    memorando.getMemoEntrada()
            );

            values.put(
                    "(qtda)",
                    memorando.getQuantidade() != null
                            ? memorando.getQuantidade()
                            .toString()
                            : "0"
            );

            values.put(
                    "(nomes)",
                    memorando.getDescricao()
            );

            PlaceholderReplacer.replace(
                    document,
                    values
            );

            ByteArrayOutputStream out =
                    new ByteArrayOutputStream();

            document.write(out);

            document.close();

            return out.toByteArray();

        }

        catch (Exception e) {

            throw new RuntimeException(
                    "Erro ao gerar documento",
                    e
            );
        }
    }
}