package com.bsi.signflow.repository;

import com.bsi.signflow.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);
}
