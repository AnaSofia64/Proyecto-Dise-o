package service.pricing;

import domain.Ticket;
import java.time.Duration;

/**
 * Cálculo por hora simple.
 */
public class HourlyPricingService implements PricingService {
    private final double ratePerHour;

    public HourlyPricingService(double ratePerHour) { this.ratePerHour = ratePerHour; }

    @Override
    public double calculateFee(Ticket ticket) {
        if (ticket.getExitTime() == null) throw new IllegalArgumentException("Ticket sin exitTime");
        long minutes = Duration.between(ticket.getEntryTime(), ticket.getExitTime()).toMinutes();
        double hours = Math.ceil(minutes / 60.0);
        return hours * ratePerHour;
    }
}