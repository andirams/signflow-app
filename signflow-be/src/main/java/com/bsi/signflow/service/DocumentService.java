package com.bsi.signflow.service;

import com.bsi.signflow.entity.ApprovalStep;
import com.bsi.signflow.entity.Document;
import com.bsi.signflow.repository.ApprovalStepRepository;
import com.bsi.signflow.repository.DocumentRepository;
import com.bsi.signflow.dto.SignRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DocumentService {

    @Autowired 
    private DocumentRepository documentRepository;
    
    @Autowired 
    private ApprovalStepRepository approvalStepRepository;

    @Autowired
    private PdfStamperService pdfStamperService;

    public List<Document> getAllDocuments() {
        return documentRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
    }

    public Document getDocumentById(Long id) {
        return documentRepository.findById(id).orElseThrow(() -> new RuntimeException("Dokumen tidak ditemukan"));
    }

    public List<ApprovalStep> getApprovalStepsByDocumentId(Long documentId) {
        return approvalStepRepository.findByDocumentIdOrderByStepOrderAsc(documentId);
    }

    public List<ApprovalStep> getPendingApprovals(Long approverId) {
        return approvalStepRepository.findByApproverIdAndStatus(approverId, "Menunggu");
    }

    @Transactional
    public String signDocument(Long documentId, SignRequest request) {
        List<ApprovalStep> steps = approvalStepRepository.findByDocumentIdOrderByStepOrderAsc(documentId);
        ApprovalStep currentStep = steps.stream()
            .filter(s -> s.getApprover().getId().equals(request.getApproverId()))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Gagal: Anda tidak memiliki akses ke dokumen ini."));

        if ("Disetujui".equals(currentStep.getStatus())) {
            // Untuk keperluan testing/demo, kita izinkan menimpa tanda tangan lama
            System.out.println("Info: Dokumen ini sudah disetujui sebelumnya, menimpa tanda tangan lama...");
        }

        currentStep.setStatus("Disetujui");
        currentStep.setActionDate(LocalDateTime.now());
        currentStep.setComments(request.getNotes());
        currentStep.setSignaturePosX(request.getSignaturePosX());
        currentStep.setSignaturePosY(request.getSignaturePosY());
        currentStep.setSignatureWidth(request.getSignatureWidth());
        currentStep.setSignaturePage(request.getPageNumber() != null ? request.getPageNumber() : 1);
        approvalStepRepository.save(currentStep);

        try {
            String originalPdfPath = "/Users/andirams/GAWE/BSI/RnD/signflow-app/dokumen_asli_" + documentId + ".pdf";
            String signedPdfPath = "/Users/andirams/GAWE/BSI/RnD/signflow-app/dokumen_signed_" + documentId + ".pdf";
            
            // Jika dokumen sudah pernah ditandatangani sebelumnya (oleh approver pertama), gunakan itu sebagai input
            String inputPdfPath = new File(signedPdfPath).exists() ? signedPdfPath : originalPdfPath;
            
            if (request.getPlacements() != null && !request.getPlacements().isEmpty()) {
                pdfStamperService.stampSignatures(inputPdfPath, signedPdfPath, request.getSignatureBase64(), request.getPlacements());
            } else {
                int pageToStamp = request.getPageNumber() != null ? request.getPageNumber() : 1;
                pdfStamperService.stampSignature(inputPdfPath, signedPdfPath, request.getSignatureBase64(), request.getSignaturePosX(), request.getSignaturePosY(), request.getSignatureWidth(), pageToStamp);
            }
            currentStep.getDocument().setFilePath(signedPdfPath);
        } catch (Exception e) {
            System.err.println("Peringatan: Gagal memproses file PDF fisik. Error: " + e.getMessage());
        }

        boolean allApproved = steps.stream().allMatch(s -> s.getStatus().equals("Disetujui"));
        if (allApproved) {
            Document doc = currentStep.getDocument();
            doc.setStatus("Disetujui");
            documentRepository.save(doc);
        }
        return "Dokumen berhasil ditandatangani dan stempel PDF telah diproses!";
    }

    @Transactional
    public String rejectDocument(Long documentId, SignRequest request) {
        List<ApprovalStep> steps = approvalStepRepository.findByDocumentIdOrderByStepOrderAsc(documentId);
        ApprovalStep currentStep = steps.stream()
            .filter(s -> s.getApprover().getId().equals(request.getApproverId()))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Gagal: Anda tidak memiliki akses ke dokumen ini."));

        currentStep.setStatus("Ditolak");
        currentStep.setActionDate(LocalDateTime.now());
        currentStep.setComments(request.getNotes());
        approvalStepRepository.save(currentStep);

        Document doc = currentStep.getDocument();
        doc.setStatus("Ditolak");
        documentRepository.save(doc);

        return "Dokumen berhasil ditolak.";
    }

    // Proses penandatanganan mandiri dengan parameter pageNumber dan persentase
    public byte[] quickSignDocument(MultipartFile file, String signatureBase64, double xPercent, double yPercent, double widthPercent, int pageNumber) throws Exception {
        File tempInput = File.createTempFile("upload_", ".pdf");
        file.transferTo(tempInput);
        File tempOutput = File.createTempFile("signed_", ".pdf");

        try {
            pdfStamperService.stampSignature(
                tempInput.getAbsolutePath(), 
                tempOutput.getAbsolutePath(), 
                signatureBase64, 
                xPercent, yPercent, widthPercent, pageNumber
            );
            return Files.readAllBytes(tempOutput.toPath());
        } finally {
            tempInput.delete();
            tempOutput.delete();
        }
    }
    
    public byte[] quickSignDocumentMultiple(MultipartFile file, String signatureBase64, List<com.bsi.signflow.dto.SignRequest.Placement> placements) throws Exception {
        File tempInput = File.createTempFile("upload_", ".pdf");
        file.transferTo(tempInput);
        File tempOutput = File.createTempFile("signed_", ".pdf");

        try {
            pdfStamperService.stampSignatures(
                tempInput.getAbsolutePath(), 
                tempOutput.getAbsolutePath(), 
                signatureBase64, 
                placements
            );
            return Files.readAllBytes(tempOutput.toPath());
        } finally {
            tempInput.delete();
            tempOutput.delete();
        }
    }

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Transactional
    public Document createDocument(MultipartFile file, String title, String category, String description, String projectName, Long initiatorId, List<Long> approverIds) throws Exception {
        // Fix sequence desync caused by hardcoded data.sql inserts
        try {
            entityManager.createNativeQuery("SELECT setval('documents_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM documents), false)").getResultList();
            entityManager.createNativeQuery("SELECT setval('approval_steps_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM approval_steps), false)").getResultList();
        } catch (Exception e) {
            System.err.println("Sequence fix skipped: " + e.getMessage());
        }

        Document doc = new Document();
        doc.setTitle(title);
        doc.setCategory(category);
        doc.setDescription(description);
        doc.setProjectName(projectName);
        doc.setStatus("Diproses");
        doc.setCreatedAt(LocalDateTime.now());
        
        doc = documentRepository.save(doc);

        String filePath = "/Users/andirams/GAWE/BSI/RnD/signflow-app/dokumen_asli_" + doc.getId() + ".pdf";
        File targetFile = new File(filePath);
        file.transferTo(targetFile);
        
        doc.setFilePath(filePath);
        documentRepository.save(doc);

        int step = 1;
        for (Long approverId : approverIds) {
            ApprovalStep approvalStep = new ApprovalStep();
            approvalStep.setDocument(doc);
            
            com.bsi.signflow.entity.User approver = new com.bsi.signflow.entity.User();
            approver.setId(approverId);
            
            approvalStep.setApprover(approver);
            approvalStep.setStepOrder(step++);
            approvalStep.setStatus("Menunggu");
            approvalStepRepository.save(approvalStep);
        }

        return doc;
    }
}
