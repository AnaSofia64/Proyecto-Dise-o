package service.pricing;

import domain.Ticket;

/**
 * Strategy pattern: PricingService define el algoritmo para calcular tarifas.
 */
public interface PricingService {
    double calculateFee(Ticket ticket);
}