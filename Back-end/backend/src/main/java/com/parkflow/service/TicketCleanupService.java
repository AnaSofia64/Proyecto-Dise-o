package com.parkflow.service;

import com.parkflow.repository.jpa.TicketJpaRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class TicketCleanupService {

    private final TicketJpaRepository ticketRepo;

    public TicketCleanupService(TicketJpaRepository ticketRepo) {
        this.ticketRepo = ticketRepo;
    }

    // Corre todos los días a medianoche
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanOldTickets() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        ticketRepo.deleteOldPaidTickets(cutoff);
        System.out.println("Tickets antiguos eliminados. Cutoff: " + cutoff);
    }
}