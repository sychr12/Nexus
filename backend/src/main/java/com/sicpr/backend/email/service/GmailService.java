// backend/src/main/java/com/sicpr/backend/email/service/GmailService.java
package com.sicpr.backend.email.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.mail.*;
import javax.mail.search.FlagTerm;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
public class GmailService {
    
    private static final String IMAP_HOST = "imap.gmail.com";
    private static final int IMAP_PORT = 993;
    
    private final Map<String, String> municipioPorEmail = new HashMap<>();
    
    public GmailService() {
        carregarMapeamentoMunicipios();
    }
    
    private void carregarMapeamentoMunicipios() {
        municipioPorEmail.put("manaus", "Manaus");
        municipioPorEmail.put("parintins", "Parintins");
        municipioPorEmail.put("itacoatiara", "Itacoatiara");
        municipioPorEmail.put("manacapuru", "Manacapuru");
        municipioPorEmail.put("coari", "Coari");
        municipioPorEmail.put("tefe", "Tefé");
        municipioPorEmail.put("humaita", "Humaitá");
        municipioPorEmail.put("labrea", "Lábrea");
        municipioPorEmail.put("maués", "Maués");
        municipioPorEmail.put("borba", "Borba");
        municipioPorEmail.put("novo_airao", "Novo Airão");
        municipioPorEmail.put("presidente_figueiredo", "Presidente Figueiredo");
    }
    
    public String obterMunicipioPorEmail(String email) {
        if (email == null) return "Desconhecido";
        String emailLower = email.toLowerCase();
        for (Map.Entry<String, String> entry : municipioPorEmail.entrySet()) {
            if (emailLower.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "Desconhecido";
    }
    
    public List<Message> buscarEmailsComAnexos(String email, String senha, boolean apenasNaoLidos) {
        List<Message> emailsComAnexos = new ArrayList<>();
        
        Properties props = new Properties();
        props.setProperty("mail.imap.ssl.enable", "true");
        props.setProperty("mail.imap.auth", "true");
        props.setProperty("mail.imap.port", String.valueOf(IMAP_PORT));
        props.setProperty("mail.imap.host", IMAP_HOST);
        props.setProperty("mail.imap.connectiontimeout", "5000");
        props.setProperty("mail.imap.timeout", "5000");
        
        try {
            Session session = Session.getInstance(props);
            Store store = session.getStore("imap");
            store.connect(IMAP_HOST, email, senha);
            
            Folder inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);
            
            Message[] messages;
            if (apenasNaoLidos) {
                messages = inbox.search(new FlagTerm(new Flags(Flags.Flag.SEEN), false));
            } else {
                messages = inbox.getMessages();
            }
            
            for (Message msg : messages) {
                try {
                    if (temAnexoPDF(msg)) {
                        emailsComAnexos.add(msg);
                    }
                } catch (Exception e) {
                    log.error("Erro ao verificar anexo do email: {}", e.getMessage());
                }
            }
            
            inbox.close(false);
            store.close();
            
            log.info("Encontrados {} emails com anexos PDF", emailsComAnexos.size());
            return emailsComAnexos;
            
        } catch (Exception e) {
            log.error("Erro ao buscar emails: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
    
    private boolean temAnexoPDF(Message message) throws MessagingException, IOException {
        return extrairPartsPDF(message).findAny().isPresent();
    }
    
    private java.util.stream.Stream<BodyPart> extrairPartsPDF(Part part) throws MessagingException, IOException {
        List<BodyPart> pdfs = new ArrayList<>();
        
        if (part.isMimeType("multipart/*")) {
            Multipart multipart = (Multipart) part.getContent();
            for (int i = 0; i < multipart.getCount(); i++) {
                pdfs.addAll(extrairPartsPDF(multipart.getBodyPart(i)).toList());
            }
        } else if (part.getFileName() != null && part.getFileName().toLowerCase().endsWith(".pdf")) {
            pdfs.add((BodyPart) part);
        }
        
        return pdfs.stream();
    }
    
    public byte[] extrairAnexoPDF(Message message) {
        try {
            Optional<BodyPart> pdfPart = extrairPartsPDF(message).findFirst();
            if (pdfPart.isPresent()) {
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                pdfPart.get().writeTo(outputStream);
                return outputStream.toByteArray();
            }
        } catch (Exception e) {
            log.error("Erro ao extrair anexo PDF: {}", e.getMessage());
        }
        return null;
    }
    
    public String extrairRemetente(Message message) throws MessagingException {
        Address[] from = message.getFrom();
        if (from != null && from.length > 0) {
            String remetente = from[0].toString();
            // Extrair apenas o email do formato "Nome <email@dominio.com>"
            if (remetente.contains("<") && remetente.contains(">")) {
                int start = remetente.indexOf("<");
                int end = remetente.indexOf(">");
                return remetente.substring(start + 1, end);
            }
            return remetente;
        }
        return "Desconhecido";
    }
    
    public String extrairAssunto(Message message) throws MessagingException {
        String assunto = message.getSubject();
        return assunto != null ? assunto : "Sem assunto";
    }
    
    public LocalDateTime extrairData(Message message) throws MessagingException {
        Date receivedDate = message.getReceivedDate();
        if (receivedDate == null) {
            receivedDate = message.getSentDate();
        }
        if (receivedDate != null) {
            return receivedDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        }
        return LocalDateTime.now();
    }
    
    public String extrairMessageId(Message message) throws MessagingException {
        String[] messageId = message.getHeader("Message-ID");
        if (messageId != null && messageId.length > 0) {
            return messageId[0];
        }
        return UUID.randomUUID().toString();
    }
}