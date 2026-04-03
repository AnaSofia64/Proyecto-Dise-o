package com.parkflow.controller;

import com.parkflow.dto.TicketRequest;
import com.parkflow.dto.TicketResponse;
import com.parkflow.service.ParkingFacade;
import com.parkflow.domain.Ticket;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final ParkingFacade facade;

    public TicketController(ParkingFacade facade) {
        this.facade = facade;
    }

    /** POST /api/tickets — admitir vehículo */
    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody TicketRequest request,
                                           Authentication auth) {
        try {
            // El rol viene del JWT via SecurityConfig
            String role = auth.getAuthorities().iterator().next()
                              .getAuthority().replace("ROLE_", "");

            Ticket ticket = facade.admitVehicle(
                auth.getName(),
                role,
                request.getLicensePlate(),
                request.getVehicleType(),
                request.getSpotId()          // ← añadir este campo al DTO
            );

            return ResponseEntity.ok(toResponse(ticket));

        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/tickets/{id} — consultar ticket */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTicket(@PathVariable String id) {
        Optional<Ticket> opt = facade.findTicket(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Ticket no encontrado"));
        }
        return ResponseEntity.ok(toResponse(opt.get()));
    }

    /** POST /api/tickets/{id}/exit — registrar salida y pagar */
    @PostMapping("/{id}/exit")
    public ResponseEntity<?> exitTicket(@PathVariable String id,
                                         Authentication auth) {
        try {
            String role = auth.getAuthorities().iterator().next()
                              .getAuthority().replace("ROLE_", "");

            boolean paid = facade.exitAndPay(auth.getName(), role, id);

            return ResponseEntity.ok(Map.of(
                "ticketId", id,
                "paid",     paid,
                "message",  paid ? "Salida procesada correctamente" : "Pago fallido"
            ));

        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Helper ────────────────────────────────────────────────
    private TicketResponse toResponse(Ticket t) {
        return new TicketResponse(
            t.getId(),
            t.getVehicle().getPlate(),
            t.getSpotId(),
            t.getEntryTime().toString(),
            t.isPaid() ? "PAID" : "ACTIVE"
        );
    }
}