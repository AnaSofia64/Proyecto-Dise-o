package com.parkflow.service;

import com.parkflow.domain.*;
import com.parkflow.entity.SpotEntity;
import com.parkflow.entity.TicketEntity;
import com.parkflow.factory.VehicleFactory;
import com.parkflow.manager.ParkingManager;
import com.parkflow.repository.jpa.SpotJpaRepository;
import com.parkflow.repository.jpa.TicketJpaRepository;
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

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ParkingFacade {

    private final SpotJpaRepository spotJpaRepo;
    private final TicketJpaRepository ticketJpaRepo;

    private ParkingManager manager;
    private TicketService ticketService;
    private SpotService spotService;

    public ParkingFacade(SpotJpaRepository spotJpaRepo,
                         TicketJpaRepository ticketJpaRepo) {
        this.spotJpaRepo  = spotJpaRepo;
        this.ticketJpaRepo = ticketJpaRepo;
    }

    @PostConstruct
    public void init() {
        // Inicializar plazas en DB si no existen
        if (spotJpaRepo.count() == 0) {
            List<SpotEntity> spots = List.of(
                new SpotEntity("C-01", "CAR"),
                new SpotEntity("C-02", "CAR"),
                new SpotEntity("C-03", "CAR"),
                new SpotEntity("C-04", "CAR"),
                new SpotEntity("C-05", "CAR"),
                new SpotEntity("M-01", "MOTORCYCLE"),
                new SpotEntity("M-02", "MOTORCYCLE"),
                new SpotEntity("T-01", "TRUCK"),
                new SpotEntity("H-01", "HANDICAPPED")
            );
            spotJpaRepo.saveAll(spots);
        }

        // Repositorios en memoria para ParkingManager (dominio original)
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

    // ── Tickets ───────────────────────────────────────────────
    public TicketEntity admitVehicle(String username, String role,
                                     String plate, String vehicleType,
                                     String spotId) {
        User attendant = buildUser(username, role);
        Vehicle vehicle = VehicleFactory.createVehicle(vehicleType, plate, username);

        // Marcar plaza ocupada en DB
        SpotEntity spot = spotJpaRepo.findById(spotId)
            .orElseThrow(() -> new IllegalArgumentException("Plaza no encontrada: " + spotId));
        if (spot.isOccupied()) throw new IllegalStateException("Plaza ya ocupada");
        spot.setOccupied(true);
        spotJpaRepo.save(spot);

        // Crear ticket en DB
        String ticketId = "T-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        TicketEntity ticket = new TicketEntity();
        ticket.setId(ticketId);
        ticket.setLicensePlate(plate);
        ticket.setVehicleType(vehicleType);
        ticket.setSpotId(spotId);
        ticket.setCreatedBy(username);
        ticket.setEntryTime(LocalDateTime.now());
        ticket.setPaid(false);
        ticketJpaRepo.save(ticket);

        return ticket;
    }

    public Optional<TicketEntity> findTicket(String ticketId) {
        return ticketJpaRepo.findById(ticketId);
    }

    public List<TicketEntity> getActiveTickets() {
        return ticketJpaRepo.findByPaid(false);
    }

    // ── Exit & Payment ────────────────────────────────────────
    public boolean exitAndPay(String username, String role, String ticketId) {
        TicketEntity ticket = ticketJpaRepo.findById(ticketId)
            .orElseThrow(() -> new IllegalArgumentException("Ticket no encontrado: " + ticketId));

        if (ticket.isPaid()) return true; // ya pagado

        // Calcular tarifa
        LocalDateTime exit = LocalDateTime.now();
        ticket.setExitTime(exit);

        long minutes = java.time.Duration.between(ticket.getEntryTime(), exit).toMinutes();
        double hours = Math.ceil(minutes / 60.0);
        if (hours < 1) hours = 1; // mínimo 1 hora
        double amount = hours * 3000.0;
        ticket.setAmount(amount);
        ticket.setPaid(true);
        ticketJpaRepo.save(ticket);

        // Liberar plaza en DB
        spotJpaRepo.findById(ticket.getSpotId()).ifPresent(spot -> {
            spot.setOccupied(false);
            spotJpaRepo.save(spot);
        });

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
}