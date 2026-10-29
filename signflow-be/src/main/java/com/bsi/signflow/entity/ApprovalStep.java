package com.bsi.signflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "approval_steps")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalStep {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document;
    
    @ManyToOne
    @JoinColumn(name = "approver_id")
    private User approver;
    
    private Integer stepOrder;
    
    private String status; // "Menunggu", "Disetujui", "Ditolak"
    
    private LocalDateTime actionDate;
    
    @Column(columnDefinition = "TEXT")
    private String comments;
    
    // Menyimpan data posisi TTD (Drag & Drop dari Frontend)
    private Double signaturePosX;
    private Double signaturePosY;
    private Double signatureWidth;
    
    @Builder.Default
    private Integer signaturePage = 1;
}
