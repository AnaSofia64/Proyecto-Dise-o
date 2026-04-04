package com.parkflow.controller;

import com.parkflow.dto.PaymentRequest;
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

    // ── Circuit Breaker manual ────────────────────────────────
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private volatile long circuitOpenedAt    = 0;
    private static final int    FAILURE_THRESHOLD = 5;
    private static final long   CIRCUIT_TIMEOUT   = 30_000; // 30s

    public PaymentController(ParkingFacade facade) {
        this.facade = facade;
    }

    /** POST /api/payments */
    @PostMapping
    public ResponseEntity<?> processPayment(@RequestBody PaymentRequest request,
                                             Authentication auth) {
        // ── Circuit Breaker: ¿está abierto? ──────────────────
        if (isCircuitOpen()) {
            return ResponseEntity.status(503).body(Map.of(
                "error",   "Servicio de pagos temporalmente no disponible",
                "circuit", "OPEN",
                "retryAfterMs", remainingCircuitTime()
            ));
        }

        // ── Retry con backoff exponencial (3 intentos) ────────
        long[] backoffs = {1000, 2000, 4000};
        Exception lastException = null;

        for (int attempt = 0; attempt < backoffs.length; attempt++) {
            try {
                String role = auth.getAuthorities().iterator().next()
                                  .getAuthority().replace("ROLE_", "");

                boolean paid = facade.exitAndPay(
                    auth.getName(), role, request.getTicketId()
                );

                if (paid) {
                    failureCount.set(0); // reset circuit breaker en éxito
                    return ResponseEntity.ok(Map.of(
                        "ticketId", request.getTicketId(),
                        "status",   "PAID",
                        "attempt",  attempt + 1
                    ));
                } else {
                    // Pago rechazado (no es excepción, es fallo de negocio)
                    return ResponseEntity.status(402).body(Map.of(
                        "ticketId", request.getTicketId(),
                        "status",   "PAYMENT_FAILED",
                        "message",  "Pago rechazado por el servicio"
                    ));
                }

            } catch (Exception e) {
                lastException = e;
                if (attempt < backoffs.length - 1) {
                    try { Thread.sleep(backoffs[attempt]); }
                    catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
        }

        // Todos los intentos fallaron → incrementar circuit breaker
        int failures = failureCount.incrementAndGet();
        if (failures >= FAILURE_THRESHOLD) {
            circuitOpenedAt = System.currentTimeMillis();
            failureCount.set(0);
        }

        return ResponseEntity.status(500).body(Map.of(
            "error",    "Error procesando pago tras 3 intentos",
            "detail",   lastException != null ? lastException.getMessage() : "unknown",
            "circuit",  failures >= FAILURE_THRESHOLD ? "OPEN" : "CLOSED",
            "failures", failures
        ));
    }

    // ── Helpers Circuit Breaker ───────────────────────────────
    private boolean isCircuitOpen() {
        if (circuitOpenedAt == 0) return false;
        return (System.currentTimeMillis() - circuitOpenedAt) < CIRCUIT_TIMEOUT;
    }

    private long remainingCircuitTime() {
        return CIRCUIT_TIMEOUT - (System.currentTimeMillis() - circuitOpenedAt);
    }
}