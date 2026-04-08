package com.parkflow.service;

import com.parkflow.domain.*;
import com.parkflow.entity.SpotEntity;
import com.parkflow.entity.TicketEntity;
import com.parkflow.factory.VehicleFactory;
import com.parkflow.manager.ParkingManager;
import com.parkflow.repository.InMemorySpotRepository;
import com.parkflow.repository.InMemoryTicketRepository;
import com.parkflow.repository.jpa.SpotJpaRepository;
import com.parkflow.repository.jpa.TicketJpaRepository;
import com.parkflow.service.auth.AuthService;
import com.parkflow.service.payment.CardPaymentService;
import com.parkflow.service.payment.PaymentService;
import com.parkflow.service.pricing.HourlyPricingService;
import com.parkflow.service.pricing.PricingService;
import com.parkflow.service.spot.ManualSpotService;
import com.parkflow.service.spot.SpotService;
import com.parkflow.service.ticket.TicketService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ParkingFacade {

    private final SpotJpaRepository spotJpaRepo;
    private final TicketJpaRepository ticketJpaRepo;

    private ParkingManager manager;
    private TicketService ticketService;
    private SpotService spotService;

    public ParkingFacade(SpotJpaRepository spotJpaRepo,
                         TicketJpaRepository ticketJpaRepo) {
        this.spotJpaRepo   = spotJpaRepo;
        this.ticketJpaRepo = ticketJpaRepo;
    }

    @PostConstruct
    public void init() {
        // Inicializar plazas en DB si no existen
        if (spotJpaRepo.count() == 0) {
            spotJpaRepo.saveAll(List.of(
                new SpotEntity("C-01", "CAR"),
                new SpotEntity("C-02", "CAR"),
                new SpotEntity("C-03", "CAR"),
                new SpotEntity("C-04", "CAR"),
                new SpotEntity("C-05", "CAR"),
                new SpotEntity("M-01", "MOTORCYCLE"),
                new SpotEntity("M-02", "MOTORCYCLE"),
                new SpotEntity("T-01", "TRUCK"),
                new SpotEntity("H-01", "HANDICAPPED")
            ));
        }

        // Repositorios en memoria para ParkingManager (dominio original intacto)
        InMemoryTicketRepository ticketRepo = new InMemoryTicketRepository();
        InMemorySpotRepository   spotRepo   = new InMemorySpotRepository();

        // Cargar plazas de DB al repositorio en memoria
        spotJpaRepo.findAll().forEach(s -> {
            ParkingSlot slot = new ParkingSlot(s.getId(),
                SpotType.valueOf(s.getType() + "_SPOT"));
            slot.setOccupied(s.isOccupied());
            spotRepo.save(slot);
        });

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
    public List<SpotEntity> getAvailableSpots() {
        return spotJpaRepo.findByOccupied(false);
    }

    public List<SpotEntity> getAvailableSpotsByType(String type) {
        return spotJpaRepo.findByTypeAndOccupied(type, false);
    }

    public int getTotalSlots()     { return (int) spotJpaRepo.count(); }
    public int getAvailableCount() { return spotJpaRepo.findByOccupied(false).size(); }
    public int getOccupiedCount()  { return spotJpaRepo.findByOccupied(true).size(); }
    public double getTodayRevenue(){ return 0; }

    // ── Tickets ───────────────────────────────────────────────
    public TicketEntity admitVehicle(String username, String role,
                                     String plate, String vehicleType,
                                     String spotId) {
        User attendant = buildUser(username, role);
        VehicleFactory.createVehicle(vehicleType, plate, username); // valida el tipo

        SpotEntity spot = spotJpaRepo.findById(spotId)
            .orElseThrow(() -> new IllegalArgumentException("Plaza no encontrada: " + spotId));
        if (spot.isOccupied()) throw new IllegalStateException("Plaza ya ocupada");
        spot.setOccupied(true);
        spotJpaRepo.save(spot);

        String ticketId = "T-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        TicketEntity ticket = new TicketEntity();
        ticket.setId(ticketId);
        ticket.setLicensePlate(plate);
        ticket.setVehicleType(vehicleType);
        ticket.setSpotId(spotId);
        ticket.setCreatedBy(username);
        ticket.setEntryTime(LocalDateTime.now());
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setPaid(false);
        ticketJpaRepo.save(ticket);

        return ticket;
    }

    public Optional<Ticket> findTicket(String ticketId) {
        // Para compatibilidad con código legacy del dominio
        return ticketJpaRepo.findById(ticketId).map(t -> {
            Vehicle v = VehicleFactory.createVehicle(
                t.getVehicleType(), t.getLicensePlate(), t.getCreatedBy());
            Ticket ticket = new com.parkflow.domain.Ticket(
                t.getId(), v, t.getSpotId(), t.getCreatedBy(), t.getEntryTime());
            ticket.setExitTime(t.getExitTime());
            ticket.setAmount(t.getAmount());
            ticket.setPaid(t.isPaid());
            return ticket;
        });
    }

    public Optional<TicketEntity> findTicketEntity(String ticketId) {
        return ticketJpaRepo.findById(ticketId);
    }

    public List<TicketEntity> getActiveTickets() {
        return ticketJpaRepo.findByPaid(false);
    }

    // ── Exit & Payment ────────────────────────────────────────
    public boolean exitAndPay(String username, String role, String ticketId) {
        TicketEntity ticket = ticketJpaRepo.findById(ticketId)
            .orElseThrow(() -> new IllegalArgumentException("Ticket no encontrado: " + ticketId));

        if (ticket.isPaid()) return true;

        LocalDateTime exit = LocalDateTime.now();
        ticket.setExitTime(exit);

        long minutes = java.time.Duration.between(ticket.getEntryTime(), exit).toMinutes();
        double hours = Math.ceil(minutes / 60.0);
        if (hours < 1) hours = 1;
        double amount = hours * 3000.0;
        ticket.setAmount(amount);
        ticket.setPaid(true);
        ticket.setReleased(false); // plaza NO se libera aún
        ticketJpaRepo.save(ticket);

        // NO liberar plaza aquí — el celador lo hace manualmente o automáticamente
        return true;
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

    public void releaseSpot(String spotId, String ticketId) {
        ticketJpaRepo.findById(ticketId).ifPresent(ticket -> {
            ticket.setReleased(true);
            ticketJpaRepo.save(ticket);
        });
        spotJpaRepo.findById(spotId).ifPresent(spot -> {
            spot.setOccupied(false);
            spotJpaRepo.save(spot);
        });
    }
    public List<TicketEntity> getPaidPendingRelease() {
        return ticketJpaRepo.findByPaidAndReleased(true, false);
    }
}