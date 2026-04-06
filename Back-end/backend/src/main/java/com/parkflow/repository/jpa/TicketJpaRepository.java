package com.parkflow.repository.jpa;

import com.parkflow.entity.TicketEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketJpaRepository extends JpaRepository<TicketEntity, String> {
    List<TicketEntity> findByPaid(boolean paid);
    List<TicketEntity> findByCreatedBy(String createdBy);
    List<TicketEntity> findByLicensePlate(String licensePlate);
    List<TicketEntity> findByLicensePlateIn(List<String> plates);
    List<TicketEntity> findByLicensePlateInAndCreatedAtAfter(
        List<String> plates, LocalDateTime after);

    @Modifying
    @Query("DELETE FROM TicketEntity t WHERE t.paid = true AND t.createdAt < :cutoff")
    void deleteOldPaidTickets(LocalDateTime cutoff);
}