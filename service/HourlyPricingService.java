package service;

import domain.Ticket;
import java.time.Duration;

public class HourlyPricingService implements PricingService {

    private static final double RATE_PER_HOUR = 5.0;

    @Override
    public double calculateFee(Ticket ticket) {
        long hours = Duration.between(
                ticket.getEntryTime(),
                ticket.getExitTime()
        ).toHours();

        return hours * RATE_PER_HOUR;
    }
}
