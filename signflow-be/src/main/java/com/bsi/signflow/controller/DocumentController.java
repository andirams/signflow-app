package com.bsi.signflow.controller;

import com.bsi.signflow.service.DocumentService;
import com.bsi.signflow.dto.SignRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @GetMapping
    public ResponseEntity<?> getAllDocuments() {
        java.util.List<com.bsi.signflow.entity.Document> docs = documentService.getAllDocuments();
        java.util.List<java.util.Map<String, Object>> response = new java.util.ArrayList<>();
        
        for (com.bsi.signflow.entity.Document doc : docs) {
            java.util.Map<String, Object> docMap = new java.util.HashMap<>();
            docMap.put("document", doc);
            docMap.put("approvalSteps", documentService.getApprovalStepsByDocumentId(doc.getId()));
            response.add(docMap);
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocumentDetails(@PathVariable Long id) {
        try {
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            com.bsi.signflow.entity.Document doc = documentService.getDocumentById(id);
            java.util.List<com.bsi.signflow.entity.ApprovalStep> steps = documentService.getApprovalStepsByDocumentId(id);
            
            response.put("document", doc);
            response.put("approvalSteps", steps);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/pending/{approverId}")
    public ResponseEntity<?> getPendingApprovals(@PathVariable Long approverId) {
        return ResponseEntity.ok(documentService.getPendingApprovals(approverId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long id) {
        try {
            java.nio.file.Path signedPath = java.nio.file.Paths.get("/Users/andirams/GAWE/BSI/RnD/signflow-app/dokumen_signed_" + id + ".pdf");
            java.nio.file.Path originalPath = java.nio.file.Paths.get("/Users/andirams/GAWE/BSI/RnD/signflow-app/dokumen_asli_" + id + ".pdf");
            
            java.nio.file.Path targetPath = java.nio.file.Files.exists(signedPath) ? signedPath : originalPath;
            byte[] pdfBytes;
            
            if (!java.nio.file.Files.exists(targetPath)) {
                // Generate Dummy PDF in-memory using PDFBox if file doesn't exist
                try (org.apache.pdfbox.pdmodel.PDDocument dummyDoc = new org.apache.pdfbox.pdmodel.PDDocument()) {
                    for (int i = 1; i <= 3; i++) {
                        org.apache.pdfbox.pdmodel.PDPage dummyPage = new org.apache.pdfbox.pdmodel.PDPage(org.apache.pdfbox.pdmodel.common.PDRectangle.A4);
                        dummyDoc.addPage(dummyPage);
                        try (org.apache.pdfbox.pdmodel.PDPageContentStream contentStream = new org.apache.pdfbox.pdmodel.PDPageContentStream(dummyDoc, dummyPage)) {
                            contentStream.beginText();
                            contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 16);
                            contentStream.newLineAtOffset(50, 750);
                            contentStream.showText("MEMO INTERNAL - BANK SYARIAH INDONESIA");
                            contentStream.newLineAtOffset(0, -30);
                            contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 12);
                            contentStream.showText("Ini adalah Halaman " + i + " dari dokumen Dummy.");
                            contentStream.newLineAtOffset(0, -30);
                            contentStream.showText("Gunakan halaman ini untuk mencoba fitur Tanda Tangan.");
                            contentStream.endText();
                        }
                    }
                    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                    dummyDoc.save(baos);
                    pdfBytes = baos.toByteArray();
                    
                    // Simpan file dummy ini agar bisa di-stamp nanti oleh DocumentService
                    java.nio.file.Files.write(targetPath, pdfBytes);
                }
            } else {
                pdfBytes = java.nio.file.Files.readAllBytes(targetPath);
            }
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"dokumen_" + id + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<String> signDocument(@PathVariable Long id, @RequestBody SignRequest request) {
        try {
            String result = documentService.signDocument(id, request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Gagal memproses penandatanganan: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> rejectDocument(@PathVariable Long id, @RequestBody SignRequest request) {
        try {
            String result = documentService.rejectDocument(id, request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Gagal menolak dokumen: " + e.getMessage());
        }
    }

    @PostMapping(value = "/quick-sign", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> quickSign(
            @RequestParam("file") MultipartFile file,
            @RequestParam("signatureBase64") String signatureBase64,
            @RequestParam(value = "signaturePosX", required = false) Double signaturePosX,
            @RequestParam(value = "signaturePosY", required = false) Double signaturePosY,
            @RequestParam(value = "signatureWidth", required = false) Double signatureWidth,
            @RequestParam(value = "pageNumber", defaultValue = "1") Integer pageNumber,
            @RequestParam(value = "placementsJson", required = false) String placementsJson) {
        try {
            byte[] signedPdf;
            if (placementsJson != null && !placementsJson.isEmpty()) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.List<com.bsi.signflow.dto.SignRequest.Placement> placements = 
                    mapper.readValue(placementsJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<com.bsi.signflow.dto.SignRequest.Placement>>() {});
                signedPdf = documentService.quickSignDocumentMultiple(file, signatureBase64, placements);
            } else {
                signedPdf = documentService.quickSignDocument(file, signatureBase64, signaturePosX, signaturePosY, signatureWidth, pageNumber);
            }
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Dokumen_Tertanda_Tangan.pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(signedPdf);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Gagal memproses dokumen: " + e.getMessage());
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam(value = "projectName", required = false) String projectName,
            @RequestParam("initiatorId") Long initiatorId,
            @RequestParam("approverIds") String approverIdsJson) {
        try {
            // Parse array of approvers manually (misal: "[1, 2, 3]")
            java.util.List<Long> approverIds = new java.util.ArrayList<>();
            String cleaned = approverIdsJson.replaceAll("[\\[\\]\"]", "").trim();
            if (!cleaned.isEmpty()) {
                for (String idStr : cleaned.split(",")) {
                    approverIds.add(Long.valueOf(idStr.trim()));
                }
            }

            com.bsi.signflow.entity.Document doc = documentService.createDocument(file, title, category, description, projectName, initiatorId, approverIds);
            return ResponseEntity.ok(doc);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Gagal membuat dokumen: " + e.getMessage());
        }
    }

    @GetMapping("/projects")
    public ResponseEntity<java.util.List<String>> getProjects() {
        java.util.List<com.bsi.signflow.entity.Document> docs = documentService.getAllDocuments();
        java.util.Set<String> projects = new java.util.HashSet<>();
        for (com.bsi.signflow.entity.Document doc : docs) {
            if (doc.getProjectName() != null && !doc.getProjectName().trim().isEmpty()) {
                projects.add(doc.getProjectName());
            }
        }
        return ResponseEntity.ok(new java.util.ArrayList<>(projects));
    }
}
