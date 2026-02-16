package service;

import domain.Ticket;

public interface PricingService {
    double calculateFee(Ticket ticket);
}
