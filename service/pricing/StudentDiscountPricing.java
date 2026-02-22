package service.pricing;

import domain.Ticket;
import domain.Role;

/**
 * Composición: aplica descuento si el dueño es estudiante (ejemplo).
 * Demuestra OCP: extender sin cambiar implementaciones previas.
 */
public class StudentDiscountPricing implements PricingService {
    private final PricingService base;
    private final double discount; // ex: 0.5 -> 50%

    public StudentDiscountPricing(PricingService base, double discount) {
        this.base = base; this.discount = discount;
    }

    @Override
    public double calculateFee(Ticket ticket) {
        double baseAmount = base.calculateFee(ticket);
        // Aquí asumimos que Vehicle.ownerId permite recuperarlo y saber su role si se tuviera repo.
        // Para demo, no accederemos a repositorio: este wrapper ilustra la extensión.
        return baseAmount * (1.0 - discount);
    }
}