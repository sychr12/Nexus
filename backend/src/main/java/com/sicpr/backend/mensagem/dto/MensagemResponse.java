package com.sicpr.backend.mensagem.dto;

import com.sicpr.backend.mensagem.model.Mensagem;

import java.time.LocalDateTime;

public record MensagemResponse(
        Long id,
        Long remetenteId,
        String remetenteNome,
        String remetenteCargo,
        Long destinatarioId,
        String destinatarioNome,
        String destinatarioCargo,
        String texto,
        String anexoNomeOriginal,
        String anexoContentType,
        Long anexoTamanho,
        String anexoUrl,
        Boolean lida,
        LocalDateTime criadoEm,
        LocalDateTime expiraEm
) {
    public static MensagemResponse from(Mensagem mensagem) {
        return from(mensagem, mensagem.getTexto());
    }

    public static MensagemResponse from(Mensagem mensagem, String texto) {
        String anexoUrl = mensagem.getAnexoNomeArquivo() == null
                ? null
                : "/api/mensagens/anexos/" + mensagem.getAnexoNomeArquivo();

        return new MensagemResponse(
                mensagem.getId(),
                mensagem.getRemetente().getId(),
                nomeUsuario(mensagem.getRemetente().getNomeCompleto(), mensagem.getRemetente().getUsername()),
                mensagem.getRemetente().getPerfil(),
                mensagem.getDestinatario().getId(),
                nomeUsuario(mensagem.getDestinatario().getNomeCompleto(), mensagem.getDestinatario().getUsername()),
                mensagem.getDestinatario().getPerfil(),
                texto,
                mensagem.getAnexoNomeOriginal(),
                mensagem.getAnexoContentType(),
                mensagem.getAnexoTamanho(),
                anexoUrl,
                mensagem.getLida(),
                mensagem.getCriadoEm(),
                mensagem.getExpiraEm()
        );
    }

    private static String nomeUsuario(String nomeCompleto, String username) {
        return nomeCompleto == null || nomeCompleto.isBlank() ? username : nomeCompleto;
    }
}
