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

    public byte[] processar(Memorando memorando) {

        try {

            InputStream input =
                    getClass().getResourceAsStream(
                            "/templates/memorando.docx"
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

            Map<String, String> values = new HashMap<>();

            values.put("${NUMERO}",     memorando.getNumero());
            values.put("${UNLOC}",      memorando.getUnloc());
            values.put("${MUNICIPIO}",  memorando.getMunicipio());
            values.put("${MEMO_ENTRADA}", memorando.getMemoEntrada());
            values.put("${USUARIO}",    memorando.getUsuario());

            // ── BUG CORRIGIDO ──────────────────────────────────────────────
            // ${DATA} nunca era adicionado ao mapa → o placeholder ficava
            // literal no documento gerado.
            // ──────────────────────────────────────────────────────────────
            values.put("${DATA}",
                    memorando.getDataEmissao() != null
                            ? memorando.getDataEmissao().format(BR_DATE)
                            : ""
            );

            PlaceholderReplacer.replace(document, values);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.write(out);

            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException(
                    "Erro ao processar template Word", e
            );
        }
    }
}