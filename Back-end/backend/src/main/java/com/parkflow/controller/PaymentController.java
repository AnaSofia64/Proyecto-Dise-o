package com.parkflow.controller;

import com.parkflow.dto.PaymentRequest;
import com.parkflow.entity.TicketEntity;
import com.parkflow.service.ParkingFacade;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final ParkingFacade facade;

    private final AtomicInteger failureCount = new AtomicInteger(0);
    private volatile long circuitOpenedAt    = 0;
    private static final int  FAILURE_THRESHOLD = 5;
    private static final long CIRCUIT_TIMEOUT   = 30_000;

    public PaymentController(ParkingFacade facade) {
        this.facade = facade;
    }

    @PostMapping
    public ResponseEntity<?> processPayment(@RequestBody PaymentRequest request,
                                             Authentication auth) {
        if (isCircuitOpen()) {
            return ResponseEntity.status(503).body(Map.of(
                "error",        "Servicio de pagos temporalmente no disponible",
                "circuit",      "OPEN",
                "retryAfterMs", remainingCircuitTime()
            ));
        }

        long[] backoffs = {1000, 2000, 4000};
        Exception lastException = null;

        for (int attempt = 0; attempt < backoffs.length; attempt++) {
            try {
                String ticketId = request.getTicketId();
                String method   = request.getPaymentMethod();

                // Buscar en JPA directamente
                TicketEntity ticket = facade.findTicketEntity(ticketId).orElse(null);

                if (ticket == null) {
                    return ResponseEntity.status(404).body(
                        Map.of("error", "Ticket no encontrado: " + ticketId));
                }

                if (ticket.isPaid()) {
                    failureCount.set(0);
                    return ResponseEntity.ok(Map.of(
                        "id",        ticketId + "-pay",
                        "ticketId",  ticketId,
                        "amount",    ticket.getAmount(),
                        "method",    method != null ? method : "CASH",
                        "status",    "SUCCESS",
                        "timestamp", java.time.LocalDateTime.now().toString(),
                        "attempt",   attempt + 1
                    ));
                }

                String role = auth.getAuthorities().iterator().next()
                                  .getAuthority().replace("ROLE_", "");
                boolean paid = facade.exitAndPay(auth.getName(), role, ticketId);

                if (paid) {
                    failureCount.set(0);
                    TicketEntity updated = facade.findTicketEntity(ticketId).orElse(ticket);
                    return ResponseEntity.ok(Map.of(
                        "id",        ticketId + "-pay",
                        "ticketId",  ticketId,
                        "amount",    updated.getAmount(),
                        "method",    method != null ? method : "CASH",
                        "status",    "SUCCESS",
                        "timestamp", java.time.LocalDateTime.now().toString(),
                        "attempt",   attempt + 1
                    ));
                }

                return ResponseEntity.status(402).body(Map.of(
                    "ticketId", ticketId,
                    "status",   "FAILED"
                ));

            } catch (Exception e) {
                lastException = e;
                if (attempt < backoffs.length - 1) {
                    try { Thread.sleep(backoffs[attempt]); }
                    catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
        }

        int failures = failureCount.incrementAndGet();
        if (failures >= FAILURE_THRESHOLD) {
            circuitOpenedAt = System.currentTimeMillis();
            failureCount.set(0);
        }

        return ResponseEntity.status(500).body(Map.of(
            "error",   "Error procesando pago tras 3 intentos",
            "detail",  lastException != null ? lastException.getMessage() : "unknown",
            "circuit", failures >= FAILURE_THRESHOLD ? "OPEN" : "CLOSED"
        ));
    }

    private boolean isCircuitOpen() {
        if (circuitOpenedAt == 0) return false;
        return (System.currentTimeMillis() - circuitOpenedAt) < CIRCUIT_TIMEOUT;
    }

    private long remainingCircuitTime() {
        return CIRCUIT_TIMEOUT - (System.currentTimeMillis() - circuitOpenedAt);
    }
}