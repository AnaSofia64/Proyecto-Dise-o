package service;

import domain.Ticket;
import domain.Vehicle;
import java.util.UUID;

public class TicketService {

    public Ticket createTicket(Vehicle vehicle) {
        return new Ticket(UUID.randomUUID().toString(), vehicle);
    }

    public void closeTicket(Ticket ticket) {
        ticket.closeTicket();
    }
}
