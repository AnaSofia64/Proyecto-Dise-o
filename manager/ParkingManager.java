package manager;

import domain.*;
import repository.*;
import service.auth.AuthService;
import service.payment.PaymentService;
import service.pricing.PricingService;
import service.spot.SpotService;
import service.ticket.TicketService;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Singleton que orquesta las operaciones.
 * Depende de interfaces/abstracciones (DIP).
 */
public class ParkingManager {
    private static ParkingManager instance;

    private final SpotService spotService;
    private final TicketService ticketService;
    private final PricingService pricingService;
    private final PaymentService paymentService;
    private final AuthService authService;

    private ParkingManager(SpotService spotService,
                           TicketService ticketService,
                           PricingService pricingService,
                           PaymentService paymentService,
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
        if (instance == null) instance = new ParkingManager(spotService, ticketService, pricingService, paymentService, authService);
        return instance;
    }

    public static ParkingManager getInstance() {
        if (instance == null) throw new IllegalStateException("ParkingManager no inicializado");
        return instance;
    }

    /**
     * Proceso de admisión hecho por celador (manual).
     */
    public synchronized Ticket admitVehicleByAttendant(User attendant, Vehicle v, String spotId) {
        if (!authService.canRegisterEntry(attendant)) throw new SecurityException("Sin permiso");
        // marcar plaza ocupada
        spotService.occupy(spotId);
        // crear ticket
        Ticket ticket = ticketService.createTicket(v, spotId, attendant.getId());
        System.out.printf("Ticket creado: %s para plaza %s%n", ticket.getId(), spotId);
        return ticket;
    }

    /**
     * Procesa salida, calcula tarifa y cobra usando el PaymentService (Strategy).
     */
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
            System.out.printf("Salida procesada y plaza liberada: %s (monto=%.2f)%n", ticketId, amount);
        } else {
            System.out.printf("Pago fallido: %s%n", ticketId);
        }
        // persistencia ya realizada por TicketService/Repo en esta demo cuando corresponde
        return paid;
    }
    /** Total de plazas del sistema */
    public int getTotalSlots() {
        return spotService.listAll().size();
    }

    /** Plazas disponibles */
    public int getAvailableSlots() {
        return spotService.listAvailable().size();
    }

    /** Plazas ocupadas */
    public int getOccupiedSlots() {
        return getTotalSlots() - getAvailableSlots();
    }
}