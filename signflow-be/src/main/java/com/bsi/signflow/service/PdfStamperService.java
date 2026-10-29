package com.bsi.signflow.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.Base64;

@Service
public class PdfStamperService {

    public void stampSignature(String inputPdfPath, String outputPdfPath, String base64Image, double xPercent, double yPercent, double widthPercent, int pageNumber) throws IOException {
        
        if (base64Image.contains(",")) {
            base64Image = base64Image.split(",")[1];
        }
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);

        File file = new File(inputPdfPath);
        if (!file.exists()) {
            throw new RuntimeException("File PDF asli tidak ditemukan di path: " + inputPdfPath);
        }

        try (PDDocument document = PDDocument.load(file)) {
            if (pageNumber < 1 || pageNumber > document.getNumberOfPages()) {
                throw new IllegalArgumentException("Halaman " + pageNumber + " tidak tersedia di dokumen ini.");
            }
            
            PDPage page = document.getPage(pageNumber - 1);
            PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "signature");

            // Menggunakan persentase untuk akurasi mutlak terlepas dari zoom layar
            org.apache.pdfbox.pdmodel.common.PDRectangle cropBox = page.getCropBox();
            float pdfWidth = cropBox.getWidth();
            float pdfHeight = cropBox.getHeight();
            float lowerLeftX = cropBox.getLowerLeftX();
            float lowerLeftY = cropBox.getLowerLeftY();

            float targetWidth = (float) (widthPercent * pdfWidth);
            float imgScale = targetWidth / pdImage.getWidth();
            float targetHeight = pdImage.getHeight() * imgScale;

            float xPoint = lowerLeftX + (float) (xPercent * pdfWidth);
            // yPercent dihitung dari ATAS (standar layar), jadi Top Point = pdfHeight - (yPercent * pdfHeight)
            // Karena PDFBox menggambar dari Kiri-Bawah, maka Bottom Point = Top Point - targetHeight
            float yPoint = lowerLeftY + pdfHeight - (float) (yPercent * pdfHeight) - targetHeight;

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                contentStream.drawImage(pdImage, xPoint, yPoint, targetWidth, targetHeight);
            }

            document.save(outputPdfPath);
        }
    }
    
    public void stampSignatures(String inputPdfPath, String outputPdfPath, String base64Image, java.util.List<com.bsi.signflow.dto.SignRequest.Placement> placements) throws IOException {
        if (placements == null || placements.isEmpty()) return;

        if (base64Image.contains(",")) {
            base64Image = base64Image.split(",")[1];
        }
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);

        File file = new File(inputPdfPath);
        if (!file.exists()) {
            throw new RuntimeException("File PDF asli tidak ditemukan di path: " + inputPdfPath);
        }

        try (PDDocument document = PDDocument.load(file)) {
            PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "signature");

            for (com.bsi.signflow.dto.SignRequest.Placement p : placements) {
                int pageNum = p.getPage() != null ? p.getPage() : 1;
                if (pageNum < 1 || pageNum > document.getNumberOfPages()) continue;
                
                PDPage page = document.getPage(pageNum - 1);
                
                org.apache.pdfbox.pdmodel.common.PDRectangle cropBox = page.getCropBox();
                float pdfWidth = cropBox.getWidth();
                float pdfHeight = cropBox.getHeight();
                float lowerLeftX = cropBox.getLowerLeftX();
                float lowerLeftY = cropBox.getLowerLeftY();

                float targetWidth = (float) (p.getWidth() * pdfWidth);
                float imgScale = targetWidth / pdImage.getWidth();
                float targetHeight = pdImage.getHeight() * imgScale;

                float xPoint = lowerLeftX + (float) (p.getX() * pdfWidth);
                float yPoint = lowerLeftY + pdfHeight - (float) (p.getY() * pdfHeight) - targetHeight;

                try (PDPageContentStream contentStream = new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    contentStream.drawImage(pdImage, xPoint, yPoint, targetWidth, targetHeight);
                }
            }

            document.save(outputPdfPath);
        }
    }
}
