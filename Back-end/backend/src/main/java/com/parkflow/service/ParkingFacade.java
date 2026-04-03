package com.parkflow.service;

import com.parkflow.domain.*;
import com.parkflow.factory.VehicleFactory;
import com.parkflow.manager.ParkingManager;
import com.parkflow.repository.InMemorySpotRepository;
import com.parkflow.repository.InMemoryTicketRepository;
import com.parkflow.service.auth.AuthService;
import com.parkflow.service.payment.CardPaymentService;
import com.parkflow.service.payment.PaymentService;
import com.parkflow.service.pricing.HourlyPricingService;
import com.parkflow.service.pricing.PricingService;
import com.parkflow.service.spot.ManualSpotService;
import com.parkflow.service.spot.SpotService;
import com.parkflow.service.ticket.TicketService;
import org.springframework.stereotype.Service;
import com.parkflow.domain.ParkingSlot;
import com.parkflow.domain.SpotType;

import java.util.List;
import java.util.Optional;

@Service
public class ParkingFacade {

    private final ParkingManager manager;
    private final TicketService ticketService;
    private final SpotService spotService;

    public ParkingFacade() {
    InMemoryTicketRepository ticketRepo = new InMemoryTicketRepository();
    InMemorySpotRepository spotRepo     = new InMemorySpotRepository();

    // ── Precargar plazas ──────────────────────────────────────
    spotRepo.save(new ParkingSlot("C-01", SpotType.CAR_SPOT));
    spotRepo.save(new ParkingSlot("C-02", SpotType.CAR_SPOT));
    spotRepo.save(new ParkingSlot("C-03", SpotType.CAR_SPOT));
    spotRepo.save(new ParkingSlot("C-04", SpotType.CAR_SPOT));
    spotRepo.save(new ParkingSlot("C-05", SpotType.CAR_SPOT));
    spotRepo.save(new ParkingSlot("M-01", SpotType.MOTORCYCLE_SPOT));
    spotRepo.save(new ParkingSlot("M-02", SpotType.MOTORCYCLE_SPOT));
    spotRepo.save(new ParkingSlot("T-01", SpotType.TRUCK_SPOT));
    spotRepo.save(new ParkingSlot("H-01", SpotType.HANDICAPPED_SPOT));

    this.ticketService = new TicketService(ticketRepo);
    this.spotService   = new ManualSpotService(spotRepo);

    PricingService pricingService = new HourlyPricingService(3000.0);
    PaymentService paymentService = new CardPaymentService();
    AuthService    authService    = new AuthService();

    this.manager = ParkingManager.init(
        spotService, ticketService, pricingService, paymentService, authService
    );
}

    // ── Spots ─────────────────────────────────────────────────
    public List<ParkingSlot> getAvailableSpots() {
        return spotService.listAvailable();
    }

    public int getTotalSlots()     { return manager.getTotalSlots(); }
    public int getAvailableCount() { return manager.getAvailableSlots(); }
    public int getOccupiedCount()  { return manager.getOccupiedSlots(); }

    // ── Tickets ───────────────────────────────────────────────
    public Ticket admitVehicle(String username, String role,
                               String plate, String vehicleType,
                               String spotId) {
        User attendant = buildUser(username, role);
        Vehicle vehicle = VehicleFactory.createVehicle(vehicleType, plate, username);
        return manager.admitVehicleByAttendant(attendant, vehicle, spotId);
    }

    public Optional<Ticket> findTicket(String ticketId) {
        return ticketService.find(ticketId);
    }

    // ── Exit & Payment ────────────────────────────────────────
    public boolean exitAndPay(String username, String role, String ticketId) {
        User attendant = buildUser(username, role);
        return manager.exitAndPayByAttendant(attendant, ticketId);
    }

    // ── Helper ────────────────────────────────────────────────
    private User buildUser(String username, String role) {
        Role domainRole = switch (role.toUpperCase()) {
            case "ADMIN"     -> Role.ADMIN;
            case "ATTENDANT" -> Role.ATTENDANT;
            default          -> Role.USER;
        };
        return new User(username, username, domainRole);
    }
}