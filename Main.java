import domain.*;
import factory.VehicleFactory;
import manager.ParkingManager;
import repository.*;
import service.auth.AuthService;
import service.payment.CardPaymentService;
import service.pricing.HourlyPricingService;
import service.spot.ManualSpotService;
import service.ticket.TicketService;

import java.util.UUID;

/**
 * Demo minimal para mostrar patrones ejecutables desde consola.
 */
public class Main {
    public static void main(String[] args) {
        // Repositorios en memoria
        InMemorySpotRepository spotRepo = new InMemorySpotRepository();
        InMemoryTicketRepository ticketRepo = new InMemoryTicketRepository();
        InMemoryUserRepository userRepo = new InMemoryUserRepository();

        // Poblar plazas
        spotRepo.save(new ParkingSlot("S1", SpotType.CAR_SPOT));
        spotRepo.save(new ParkingSlot("S2", SpotType.CAR_SPOT));
        spotRepo.save(new ParkingSlot("S3", SpotType.MOTORCYCLE_SPOT));

        // Servicios
        ManualSpotService spotService = new ManualSpotService(spotRepo);
        TicketService ticketService = new TicketService(ticketRepo);
        HourlyPricingService pricing = new HourlyPricingService(2000.0); // tarifa ejemplo
        CardPaymentService payment = new CardPaymentService();
        AuthService auth = new AuthService();

        // Usuarios demo
        User attendant = new User("u1", "Juan Celador", Role.ATTENDANT);
        User admin = new User("u2", "María Admin", Role.ADMIN);
        userRepo.save(attendant); userRepo.save(admin);

        // Inicializar ParkingManager (Singleton)
        ParkingManager.init(spotService, ticketService, pricing, payment, auth);
        ParkingManager pm = ParkingManager.getInstance();

        // Factory: crear un vehículo
        Vehicle v = VehicleFactory.createVehicle("CAR", "ABC-123", attendant.getId());

        // Celador admite vehículo en S1
        System.out.println("Admitiendo vehículo...");
        var ticket = pm.admitVehicleByAttendant(attendant, v, "S1");

        // Simular espera (en demo real esperaríamos tiempo)
        try { Thread.sleep(800); } catch (InterruptedException e) { /* no-op */ }

        // Celador procesa salida y pago
        System.out.println("Procesando salida y pago...");
        boolean ok = pm.exitAndPayByAttendant(attendant, ticket.getId());
        System.out.println("Pago OK: " + ok);
    }
}