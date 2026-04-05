package com.parkflow.controller;

import com.parkflow.entity.TicketEntity;
import com.parkflow.entity.UserEntity;
import com.parkflow.repository.jpa.TicketJpaRepository;
import com.parkflow.repository.jpa.UserJpaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserJpaRepository userRepo;
    private final TicketJpaRepository ticketRepo;

    public UserController(UserJpaRepository userRepo, TicketJpaRepository ticketRepo) {
        this.userRepo = userRepo;
        this.ticketRepo = ticketRepo;
    }

    /** GET /api/users/me — perfil del usuario actual */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication auth) {
        return userRepo.findByUsername(auth.getName())
            .map(u -> ResponseEntity.ok(Map.of(
                "id",            u.getId(),
                "username",      u.getUsername(),
                "email",         u.getEmail(),
                "fullName",      u.getFullName(),
                "role",          u.getRole(),
                "licensePlates", u.getLicensePlates()
            )))
            .orElse(ResponseEntity.status(404).build());
    }

    /** POST /api/users/plates — agregar placa */
    @PostMapping("/plates")
    public ResponseEntity<?> addPlate(@RequestBody Map<String, String> body,
                                    Authentication auth) {
        String rawPlate = body.get("plate");
        if (rawPlate == null || rawPlate.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Placa requerida"));
        }

        final String plate = rawPlate.toUpperCase().trim();

        return userRepo.findByUsername(auth.getName()).map(user -> {
            if (!user.getLicensePlates().contains(plate)) {
                user.getLicensePlates().add(plate);
                userRepo.save(user);
            }
            return ResponseEntity.ok(Map.of(
                "message", "Placa agregada",
                "plates",  user.getLicensePlates()
            ));
        }).orElse(ResponseEntity.status(404).build());
    }

    /** DELETE /api/users/plates/{plate} — quitar placa */
    @DeleteMapping("/plates/{plate}")
    public ResponseEntity<?> removePlate(@PathVariable String plate,
                                          Authentication auth) {
        return userRepo.findByUsername(auth.getName()).map(user -> {
            user.getLicensePlates().remove(plate.toUpperCase());
            userRepo.save(user);
            return ResponseEntity.ok(Map.of(
                "message", "Placa eliminada",
                "plates",  user.getLicensePlates()
            ));
        }).orElse(ResponseEntity.status(404).build());
    }

    /** GET /api/users/tickets — tickets del usuario (últimos 30 días) */
    @GetMapping("/tickets")
    public ResponseEntity<?> getMyTickets(Authentication auth) {
        return userRepo.findByUsername(auth.getName()).map(user -> {
            if (user.getLicensePlates().isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
            List<TicketEntity> tickets = ticketRepo
                .findByLicensePlateInAndCreatedAtAfter(user.getLicensePlates(), cutoff);

            List<Map<String, Object>> response = tickets.stream()
                .map(t -> Map.<String, Object>of(
                    "id",          t.getId(),
                    "licensePlate", t.getLicensePlate(),
                    "spotId",      t.getSpotId(),
                    "entryTime",   t.getEntryTime().toString(),
                    "exitTime",    t.getExitTime() != null ? t.getExitTime().toString() : "",
                    "status",      t.isPaid() ? "PAID" : "ACTIVE",
                    "amount",      t.getAmount(),
                    "vehicle", Map.of(
                        "licensePlate", t.getLicensePlate(),
                        "type",         t.getVehicleType()
                    ),
                    "spot", Map.of(
                        "id",         t.getSpotId(),
                        "code",       t.getSpotId(),
                        "hourlyRate", 3000
                    )
                )).toList();

            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.status(404).build());
    }
}