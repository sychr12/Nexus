package com.sicpr.backend.inscricao.validation;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class DmsCoordinateValidator {

    private static final Pattern LATITUDE_PATTERN =
            Pattern.compile("^\\(([NS])\\) ([0-9]{2})°([0-9]{2})'([0-9]{2}),([0-9]{2})\"$");

    private static final Pattern LONGITUDE_PATTERN =
            Pattern.compile("^\\(([EW])\\) ([0-9]{3})°([0-9]{2})'([0-9]{2}),([0-9]{2})\"$");

    private DmsCoordinateValidator() {
    }

    public static String normalizarLatitude(String valor) {
        return normalizar(valor);
    }

    public static String normalizarLongitude(String valor) {
        return normalizar(valor);
    }

    public static String validarLatitude(String valor) {
        return validar(valor, LATITUDE_PATTERN, 90, "Latitude");
    }

    public static String validarLongitude(String valor) {
        return validar(valor, LONGITUDE_PATTERN, 180, "Longitude");
    }

    private static String normalizar(String valor) {
        if (valor == null) {
            return "";
        }

        return valor.trim()
                .replace('º', '°')
                .replace('“', '"')
                .replace('”', '"')
                .replace('‘', '\'')
                .replace('’', '\'');
    }

    private static String validar(
            String valor,
            Pattern pattern,
            int limiteGraus,
            String campo
    ) {
        String coordenada = normalizar(valor);

        if (coordenada.isBlank()) {
            return campo + " é obrigatória.";
        }

        if (!coordenada.equals(valor)) {
            return campo + " não deve possuir espaços no início ou fim.";
        }

        if (contemCaracterInvisivel(coordenada)) {
            return campo + " não deve conter espaços ocultos, tabulações ou caracteres invisíveis.";
        }

        Matcher matcher = pattern.matcher(coordenada);

        if (!matcher.matches()) {
            return campo + " deve estar no formato oficial DMS.";
        }

        int graus = Integer.parseInt(matcher.group(2));
        int minutos = Integer.parseInt(matcher.group(3));
        int segundos = Integer.parseInt(matcher.group(4));
        int decimais = Integer.parseInt(matcher.group(5));

        if (graus > limiteGraus) {
            return campo + " possui graus fora do intervalo permitido.";
        }

        if (minutos > 59) {
            return campo + " possui minutos fora do intervalo permitido.";
        }

        if (segundos > 59 || decimais > 99) {
            return campo + " possui segundos fora do intervalo permitido.";
        }

        if (graus == limiteGraus && (minutos != 0 || segundos != 0 || decimais != 0)) {
            return campo + " no limite máximo deve possuir minutos e segundos zerados.";
        }

        return "";
    }

    private static boolean contemCaracterInvisivel(String valor) {
        return valor.chars().anyMatch((ch) ->
                ch == '\t'
                        || ch == '\n'
                        || ch == '\r'
                        || ch == 0x00A0
                        || ch == 0x200B
                        || ch == 0x200C
                        || ch == 0x200D
                        || ch == 0xFEFF
        );
    }
}
