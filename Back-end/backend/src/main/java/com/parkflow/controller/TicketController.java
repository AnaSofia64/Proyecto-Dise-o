package com.parkflow.controller;

import com.parkflow.dto.TicketRequest;
import com.parkflow.service.ParkingFacade;
import com.parkflow.domain.Ticket;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final ParkingFacade facade;

    public TicketController(ParkingFacade facade) {
        this.facade = facade;
    }

    /** POST /api/tickets */
    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody TicketRequest request,
                                           Authentication auth) {
        try {
            String role = auth.getAuthorities().iterator().next()
                              .getAuthority().replace("ROLE_", "");
            Ticket ticket = facade.admitVehicle(
                auth.getName(), role,
                request.getLicensePlate(),
                request.getVehicleType(),
                request.getSpotId()
            );
            return ResponseEntity.ok(toFrontendResponse(ticket));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/tickets/active */
    @GetMapping("/active")
    public ResponseEntity<?> getActive() {
        // Por ahora retorna lista vacía — el repo no tiene listAll expuesto
        return ResponseEntity.ok(List.of());
    }

    /** GET /api/tickets/my-tickets */
    @GetMapping("/my-tickets")
    public ResponseEntity<?> getMyTickets() {
        return ResponseEntity.ok(List.of());
    }

    /** GET /api/tickets/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTicket(@PathVariable String id) {
        Optional<Ticket> opt = facade.findTicket(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Ticket no encontrado"));
        }
        return ResponseEntity.ok(toFrontendResponse(opt.get()));
    }

    /** POST /api/tickets/{id}/exit */
    @PostMapping("/{id}/exit")
    public ResponseEntity<?> exitTicket(@PathVariable String id, Authentication auth) {
        try {
            String role = auth.getAuthorities().iterator().next()
                              .getAuthority().replace("ROLE_", "");
            boolean paid = facade.exitAndPay(auth.getName(), role, id);
            return ResponseEntity.ok(Map.of("ticketId", id, "paid", paid,
                "status", paid ? "PAID" : "FAILED"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // Estructura que el front espera
    private Map<String, Object> toFrontendResponse(Ticket t) {
        return Map.of(
            "id",        t.getId(),
            "entryTime", t.getEntryTime().toString(),
            "exitTime",  t.getExitTime() != null ? t.getExitTime().toString() : "",
            "status",    t.isPaid() ? "PAID" : "ACTIVE",
            "qrCode",    t.getId(),
            "vehicle", Map.of(
                "id",           t.getVehicle().getPlate(),
                "licensePlate", t.getVehicle().getPlate(),
                "type",         t.getVehicle().getType().name()
            ),
            "spot", Map.of(
                "id",         t.getSpotId(),
                "code",       t.getSpotId(),
                "type",       "CAR",
                "status",     t.isPaid() ? "AVAILABLE" : "OCCUPIED",
                "hourlyRate", 3000
            )
        );
    }
}