package com.parkflow.manager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.parkflow.domain.Ticket;
import com.parkflow.domain.User;
import com.parkflow.domain.Vehicle;
import com.parkflow.service.auth.AuthService;
import com.parkflow.service.payment.PaymentService;
import com.parkflow.service.pricing.PricingService;
import com.parkflow.service.spot.SpotService;
import com.parkflow.service.ticket.TicketService;

public class ParkingManager {
    private static ParkingManager instance;

    private final SpotService spotService;
    private final TicketService ticketService;
    private final PricingService pricingService;
    private final PaymentService paymentService;
    private final AuthService authService;

    private ParkingManager(SpotService spotService, TicketService ticketService,
                           PricingService pricingService, PaymentService paymentService,
                           AuthService authService) {
        this.spotService = spotService;
        this.ticketService = ticketService;
        this.pricingService = pricingService;
        this.paymentService = paymentService;
        this.authService = authService;
    }

    public static synchronized ParkingManager init(SpotService spotService,
                                                   TicketService ticketService,
                                                   PricingService pricingService,
                                                   PaymentService paymentService,
                                                   AuthService authService) {
        if (instance == null)
            instance = new ParkingManager(spotService, ticketService, pricingService, paymentService, authService);
        return instance;
    }

    public static ParkingManager getInstance() {
        if (instance == null) throw new IllegalStateException("ParkingManager no inicializado");
        return instance;
    }

    public synchronized Ticket admitVehicleByAttendant(User attendant, Vehicle v, String spotId) {
        if (!authService.canRegisterEntry(attendant)) throw new SecurityException("Sin permiso");
        spotService.occupy(spotId);
        Ticket ticket = ticketService.createTicket(v, spotId, attendant.getId());
        System.out.printf("Ticket creado: %s para plaza %s%n", ticket.getId(), spotId);
        return ticket;
    }

    public synchronized boolean exitAndPayByAttendant(User attendant, String ticketId) {
        if (!authService.canProcessExit(attendant)) throw new SecurityException("Sin permiso");
        Optional<Ticket> opt = ticketService.find(ticketId);
        if (opt.isEmpty()) throw new IllegalArgumentException("Ticket no encontrado");
        Ticket t = opt.get();
        t.setExitTime(LocalDateTime.now());
        double amount = pricingService.calculateFee(t);
        t.setAmount(amount);
        boolean paid = paymentService.pay(ticketId, amount);
        if (paid) {
            t.setPaid(true);
            spotService.release(t.getSpotId());
        }
        return paid;
    }

    public int getTotalSlots() {
        return spotService.listAvailable().size() + getOccupiedSlots();
    }

    public int getAvailableSlots() { return spotService.listAvailable().size(); }

    public int getOccupiedSlots() {
        return ticketService.findActive().size();
    }

    public List<Ticket> getActiveTickets() { return ticketService.findActive(); }

    public List<Ticket> getTicketsByOwner(String username) { return ticketService.findByOwner(username); }

    public double getTodayRevenue() { return ticketService.getTodayRevenue(); }
}