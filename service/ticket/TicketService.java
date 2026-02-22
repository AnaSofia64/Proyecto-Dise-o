package service.ticket;

import domain.Ticket;
import domain.Vehicle;
import repository.InMemoryTicketRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * SRP: TicketService sólo crea y cierra tickets; usa el repositorio.
 */
public class TicketService {
    private final InMemoryTicketRepository repo;

    public TicketService(InMemoryTicketRepository repo) {
        this.repo = repo;
    }

    public Ticket createTicket(Vehicle v, String spotId, String createdBy) {
        String id = "T-" + UUID.randomUUID().toString().substring(0,8).toUpperCase();
        Ticket t = new Ticket(id, v, spotId, createdBy, LocalDateTime.now());
        repo.save(t);
        return t;
    }

    public Optional<Ticket> find(String id) { return repo.findById(id); }

    public void closeTicket(String ticketId) {
        var opt = repo.findById(ticketId);
        if (opt.isEmpty()) throw new IllegalArgumentException("Ticket no encontrado");
        Ticket t = opt.get();
        t.setExitTime(LocalDateTime.now());
        repo.save(t);
    }
}