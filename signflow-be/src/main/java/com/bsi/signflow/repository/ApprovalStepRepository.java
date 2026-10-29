package com.bsi.signflow.repository;

import com.bsi.signflow.entity.ApprovalStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, Long> {
    List<ApprovalStep> findByDocumentIdOrderByStepOrderAsc(Long documentId);
    List<ApprovalStep> findByApproverIdAndStatus(Long approverId, String status);
}
