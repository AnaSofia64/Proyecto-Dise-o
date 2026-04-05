package com.parkflow.controller;

import com.parkflow.dto.TicketRequest;
import com.parkflow.entity.TicketEntity;
import com.parkflow.service.ParkingFacade;
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

    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody TicketRequest request,
                                           Authentication auth) {
        try {
            String role = auth.getAuthorities().iterator().next()
                              .getAuthority().replace("ROLE_", "");
            TicketEntity ticket = facade.admitVehicle(
                auth.getName(), role,
                request.getLicensePlate(),
                request.getVehicleType(),
                request.getSpotId()
            );
            return ResponseEntity.ok(toResponse(ticket));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActive() {
        List<Map<String, Object>> tickets = facade.getActiveTickets()
            .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<?> getMyTickets(Authentication auth) {
        // Redirige al UserController — devuelve vacío si no tiene placas registradas
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicket(@PathVariable String id) {
        Optional<TicketEntity> opt = facade.findTicket(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Ticket no encontrado"));
        }
        return ResponseEntity.ok(toResponse(opt.get()));
    }

    @PostMapping("/{id}/exit")
    public ResponseEntity<?> exitTicket(@PathVariable String id, Authentication auth) {
        try {
            String role = auth.getAuthorities().iterator().next()
                              .getAuthority().replace("ROLE_", "");
            boolean paid = facade.exitAndPay(auth.getName(), role, id);
            return ResponseEntity.ok(Map.of("ticketId", id, "paid", paid,
                "status", paid ? "PAID" : "FAILED"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> toResponse(TicketEntity t) {
        return Map.of(
            "id",        t.getId(),
            "entryTime", t.getEntryTime().toString(),
            "exitTime",  t.getExitTime() != null ? t.getExitTime().toString() : "",
            "status",    t.isPaid() ? "PAID" : "ACTIVE",
            "qrCode",    t.getId(),
            "vehicle", Map.of(
                "id",           t.getLicensePlate(),
                "licensePlate", t.getLicensePlate(),
                "type",         t.getVehicleType()
            ),
            "spot", Map.of(
                "id",         t.getSpotId(),
                "code",       t.getSpotId(),
                "type",       t.getVehicleType(),
                "status",     t.isPaid() ? "AVAILABLE" : "OCCUPIED",
                "hourlyRate", 3000
            )
        );
    }
}