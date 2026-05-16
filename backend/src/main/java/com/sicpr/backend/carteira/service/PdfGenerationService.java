// service/PdfGenerationService.java
package com.sicpr.backend.carteira.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.sicpr.backend.carteira.model.CarteiraDigital;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;

@Service
@Slf4j
public class PdfGenerationService {
    
    public byte[] gerarPdf(CarteiraDigital carteira) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();
            
            // FRENTE DO CARTÃO
            adicionarFrente(document, carteira);
            document.newPage();
            
            // VERSO DO CARTÃO
            adicionarVerso(document, carteira);
            
            // PÁGINAS DE FOTOS
            adicionarFotos(document, carteira);
            
            document.close();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF", e);
        }
        
        return baos.toByteArray();
    }
    
    private void adicionarFrente(Document document, CarteiraDigital carteira) throws DocumentException {
        Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
        Font labelFont = new Font(Font.HELVETICA, 12, Font.BOLD);
        Font valueFont = new Font(Font.HELVETICA, 12, Font.NORMAL);
        
        Paragraph title = new Paragraph("CARTEIRA DIGITAL DO PRODUTOR RURAL", titleFont);
        title.setAlignment(Paragraph.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{30, 70});
        
        adicionarCelula(table, "Registro:", labelFont, carteira.getRegistro(), valueFont);
        adicionarCelula(table, "CPF:", labelFont, formatarCpf(carteira.getCpf()), valueFont);
        adicionarCelula(table, "Nome:", labelFont, carteira.getNome(), valueFont);
        adicionarCelula(table, "Propriedade:", labelFont, carteira.getPropriedade(), valueFont);
        adicionarCelula(table, "UNLOC:", labelFont, carteira.getUnloc(), valueFont);
        adicionarCelula(table, "Início:", labelFont, carteira.getInicio(), valueFont);
        adicionarCelula(table, "Validade:", labelFont, carteira.getValidade(), valueFont);
        
        document.add(table);
    }
    
    private void adicionarVerso(Document document, CarteiraDigital carteira) throws DocumentException {
        Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
        Font labelFont = new Font(Font.HELVETICA, 12, Font.BOLD);
        Font valueFont = new Font(Font.HELVETICA, 12, Font.NORMAL);
        
        Paragraph title = new Paragraph("INFORMAÇÕES COMPLEMENTARES", titleFont);
        title.setAlignment(Paragraph.ALIGN_CENTER);
        title.setSpacingAfter(15);
        document.add(title);
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{30, 70});
        
        adicionarCelula(table, "Endereço:", labelFont, carteira.getEndereco(), valueFont);
        adicionarCelula(table, "Atividade Principal:", labelFont, carteira.getAtividade1(), valueFont);
        adicionarCelula(table, "Atividade Secundária:", labelFont, carteira.getAtividade2(), valueFont);
        adicionarCelula(table, "Georreferenciamento:", labelFont, carteira.getGeoref(), valueFont);
        
        document.add(table);
    }
    
    private void adicionarFotos(Document document, CarteiraDigital carteira) throws Exception {
        byte[][] fotos = {carteira.getFoto1(), carteira.getFoto2(), carteira.getFoto3()};
        
        for (int i = 0; i < fotos.length; i++) {
            if (fotos[i] != null && fotos[i].length > 0) {
                document.newPage();
                
                Font titleFont = new Font(Font.HELVETICA, 14, Font.BOLD);
                Paragraph title = new Paragraph("FOTO " + (i + 1), titleFont);
                title.setAlignment(Paragraph.ALIGN_CENTER);
                title.setSpacingAfter(10);
                document.add(title);
                
                try {
                    Image img = Image.getInstance(fotos[i]);
                    img.scaleToFit(500, 400);
                    img.setAlignment(Image.ALIGN_CENTER);
                    document.add(img);
                } catch (Exception e) {
                    log.error("Erro ao adicionar foto {}: {}", i + 1, e.getMessage());
                }
            }
        }
    }
    
    private void adicionarCelula(PdfPTable table, String label, Font labelFont, String value, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Paragraph(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(labelCell);
        
        PdfPCell valueCell = new PdfPCell(new Paragraph(value != null ? value : "—", valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(valueCell);
    }
    
    private String formatarCpf(String cpf) {
        if (cpf == null || cpf.isEmpty()) return "—";
        String numeros = cpf.replaceAll("\\D", "");
        if (numeros.length() == 11) {
            return numeros.replaceAll("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
        }
        return cpf;
    }
}