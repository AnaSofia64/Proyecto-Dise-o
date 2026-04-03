package com.parkflow.service.pricing;

import com.parkflow.domain.Ticket;

/**
 * Strategy pattern: PricingService define el algoritmo para calcular tarifas.
 */
public interface PricingService {
    double calculateFee(Ticket ticket);
}