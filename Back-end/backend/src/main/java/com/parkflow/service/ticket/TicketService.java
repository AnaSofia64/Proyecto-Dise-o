package com.parkflow.service.ticket;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.parkflow.domain.Ticket;
import com.parkflow.domain.Vehicle;
import com.parkflow.repository.InMemoryTicketRepository;

public class TicketService {
    private final InMemoryTicketRepository repo;

    public TicketService(InMemoryTicketRepository repo) {
        this.repo = repo;
    }

    public Ticket createTicket(Vehicle v, String spotId, String createdBy) {
        String id = "T-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Ticket t = new Ticket(id, v, spotId, createdBy, LocalDateTime.now());
        repo.save(t);
        return t;
    }

    public Optional<Ticket> find(String id) { return repo.findById(id); }

    public List<Ticket> findActive() { return repo.findActive(); }

    public List<Ticket> findByOwner(String username) { return repo.findByOwner(username); }

    public double getTodayRevenue() { return repo.sumTodayRevenue(); }

    public void closeTicket(String ticketId) {
        var opt = repo.findById(ticketId);
        if (opt.isEmpty()) throw new IllegalArgumentException("Ticket no encontrado");
        Ticket t = opt.get();
        t.setExitTime(LocalDateTime.now());
        repo.save(t);
    }
    public java.util.List<Ticket> listActive() {
    return repo.findActive();
    }
}