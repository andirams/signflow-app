package com.bsi.signflow.dto;

import lombok.Data;
import java.util.List;

@Data
public class SignRequest {
    private Long approverId;
    private String signatureBase64; // Gambar coretan/file PNG dalam bentuk base64
    
    // Backwards compatibility for single placement (can be left null)
    private Double signaturePosX;   
    private Double signaturePosY;   
    private Double signatureWidth;  
    private Integer pageNumber;     
    
    private String notes;           // Catatan opsional
    
    private List<Placement> placements; // Multiple TTD/Paraf support

    @Data
    public static class Placement {
        private Double x;
        private Double y;
        private Double width;
        private Integer page;
    }
}
