package com.parkflow.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.parkflow.domain.Ticket;
import com.parkflow.dto.TicketRequest;
import com.parkflow.service.ParkingFacade;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final ParkingFacade facade;

    public TicketController(ParkingFacade facade) {
        this.facade = facade;
    }

    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody TicketRequest request, Authentication auth) {
        try {
            String role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
            Ticket ticket = facade.admitVehicle(
                auth.getName(), role,
                request.getLicensePlate(), request.getVehicleType(), request.getSpotId()
            );
            return ResponseEntity.ok(toFrontendResponse(ticket));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/active")
    public ResponseEntity<?> getActive() {
        List<Ticket> active = facade.getActiveTickets();
        List<Map<String, Object>> result = active.stream()
            .map(this::toFrontendResponse)
            .toList();
        return ResponseEntity.ok(result);
    }

   @GetMapping("/my-tickets")
    public ResponseEntity<?> getMyTickets(Authentication auth) {
    List<Ticket> active = facade.getActiveTickets();
    List<Map<String, Object>> result = active.stream()
        .map(this::toFrontendResponse)
        .toList();
    return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicket(@PathVariable String id) {
        Optional<Ticket> opt = facade.findTicket(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Ticket no encontrado"));
        return ResponseEntity.ok(toFrontendResponse(opt.get()));
    }

    @PostMapping("/{id}/exit")
    public ResponseEntity<?> exitTicket(@PathVariable String id, Authentication auth) {
        try {
            String role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
            boolean paid = facade.exitAndPay(auth.getName(), role, id);
            return ResponseEntity.ok(Map.of("ticketId", id, "paid", paid,
                "status", paid ? "PAID" : "FAILED"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

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