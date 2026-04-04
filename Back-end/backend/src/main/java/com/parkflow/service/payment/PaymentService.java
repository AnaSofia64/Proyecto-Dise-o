package com.parkflow.service.payment;

/**
 * Strategy para métodos de pago.
 */
public interface PaymentService {
    boolean pay(String reference, double amount);
}