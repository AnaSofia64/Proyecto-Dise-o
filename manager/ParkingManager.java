package manager;

import domain.ParkingSlot;
import service.CashPaymentService;
import service.HourlyPricingService;
import service.PaymentService;
import service.PricingService;
import service.SpotAssignmentService;
import service.TicketService;
import java.util.ArrayList;
import java.util.List;

public class ParkingManager {

    private static ParkingManager instance;

    private List<ParkingSlot> slots;
    private PricingService pricingService;
    private PaymentService paymentService;
    private TicketService ticketService;
    private SpotAssignmentService spotAssignmentService;

    private ParkingManager() {
        this.slots = new ArrayList<>();
        this.pricingService = new HourlyPricingService();
        this.paymentService = new CashPaymentService();
        this.ticketService = new TicketService();
        this.spotAssignmentService = new SpotAssignmentService();

        for (int i = 1; i <= 10; i++) {
            slots.add(new ParkingSlot(i));
        }
    }

    public static ParkingManager getInstance() {
        if (instance == null) {
            instance = new ParkingManager();
        }
        return instance;
    }

    public int getSlotCount() {
        return slots.size();
    }

    public PricingService getPricingService() {
        return pricingService;
    }

    public PaymentService getPaymentService() {
        return paymentService;
    }

    public TicketService getTicketService() {
        return ticketService;
    }

    public SpotAssignmentService getSpotAssignmentService() {
        return spotAssignmentService;
    }
}
