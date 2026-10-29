package com.bsi.signflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    
    private String category;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String projectName;
    
    private String fileName;
    
    private String filePath; // Lokasi fisik file PDF disimpan
    
    private String status; // "Diproses", "Disetujui", "Ditolak"
    
    private LocalDateTime createdAt;
    
    @ManyToOne
    @JoinColumn(name = "creator_id")
    private User creator;
}
