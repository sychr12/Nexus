package com.sicpr.backend.memorando.word;

import org.apache.poi.xwpf.usermodel.*;

import java.util.List;
import java.util.Map;



public class PlaceholderReplacer {

    public static void replace(
            XWPFDocument document,
            Map<String, String> values
    ) {
        // Parágrafos do corpo principal
        for (XWPFParagraph paragraph : document.getParagraphs()) {
            replaceInParagraph(paragraph, values);
        }

        // Parágrafos dentro de tabelas
        for (XWPFTable table : document.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph paragraph : cell.getParagraphs()) {
                        replaceInParagraph(paragraph, values);
                    }
                }
            }
        }
    }


    private static void replaceInParagraph(
            XWPFParagraph paragraph,
            Map<String, String> values
    ) {
        List<XWPFRun> runs = paragraph.getRuns();
        if (runs == null || runs.isEmpty()) return;

        // 1. Concatena o texto de todos os runs
        StringBuilder fullText = new StringBuilder();
        for (XWPFRun run : runs) {
            String text = run.getText(0);
            fullText.append(text != null ? text : "");
        }

        // 2. Verifica se há algum placeholder no texto completo
        String combined = fullText.toString();
        boolean hasPlaceholder = values.keySet().stream()
                .anyMatch(combined::contains);

        if (!hasPlaceholder) return;

        // 3. Substitui todos os placeholders
        for (Map.Entry<String, String> entry : values.entrySet()) {
            combined = combined.replace(
                    entry.getKey(),
                    entry.getValue() != null ? entry.getValue() : ""
            );
        }

        // 4. Escreve o resultado no primeiro run e limpa os demais
        runs.get(0).setText(combined, 0);
        for (int i = 1; i < runs.size(); i++) {
            runs.get(i).setText("", 0);
        }
    }
}