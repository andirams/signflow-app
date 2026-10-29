package com.bsi.signflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @Column(unique = true)
    private String email;
    
    private String department;
    
    private String role; // "Admin", "Approver", "Initiator"
    
    private String status; // "Aktif", "Nonaktif"
}
