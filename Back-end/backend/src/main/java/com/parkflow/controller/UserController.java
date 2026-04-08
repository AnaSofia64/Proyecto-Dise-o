package com.parkflow.controller;

import com.parkflow.entity.TicketEntity;
import com.parkflow.entity.UserEntity;
import com.parkflow.entity.UserPlateEntity;
import com.parkflow.repository.jpa.TicketJpaRepository;
import com.parkflow.repository.jpa.UserJpaRepository;
import com.parkflow.repository.jpa.UserPlateJpaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserJpaRepository userRepo;
    private final TicketJpaRepository ticketRepo;
    private final UserPlateJpaRepository plateRepo;

    public UserController(UserJpaRepository userRepo,
                          TicketJpaRepository ticketRepo,
                          UserPlateJpaRepository plateRepo) {
        this.userRepo   = userRepo;
        this.ticketRepo = ticketRepo;
        this.plateRepo  = plateRepo;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication auth) {
        return userRepo.findByUsername(auth.getName()).map(u -> {
            List<Map<String, String>> plates = plateRepo.findByUserId(u.getId())
                .stream()
                .map(p -> Map.of(
                    "plate",       p.getPlate(),
                    "vehicleType", p.getVehicleType()
                )).toList();

            return ResponseEntity.ok(Map.of(
                "id",            u.getId(),
                "username",      u.getUsername(),
                "email",         u.getEmail(),
                "fullName",      u.getFullName(),
                "role",          u.getRole(),
                "licensePlates", plates
            ));
        }).orElse(ResponseEntity.status(404).build());
    }

    @PostMapping("/plates")
    public ResponseEntity<?> addPlate(@RequestBody Map<String, String> body,
                                      Authentication auth) {
        String rawPlate     = body.get("plate");
        String vehicleType  = body.get("vehicleType");

        if (rawPlate == null || rawPlate.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Placa requerida"));
        }
        if (vehicleType == null || vehicleType.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo de vehículo requerido"));
        }

        final String plate = rawPlate.toUpperCase().trim();
        final List<String> validTypes = List.of("CAR", "MOTORCYCLE", "TRUCK");
        if (!validTypes.contains(vehicleType.toUpperCase())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo inválido. Use CAR, MOTORCYCLE o TRUCK"));
        }

        return userRepo.findByUsername(auth.getName()).map(user -> {
            if (plateRepo.existsByUserIdAndPlate(user.getId(), plate)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Esa placa ya está registrada"));
            }

            plateRepo.save(new UserPlateEntity(user.getId(), plate, vehicleType.toUpperCase()));

            List<Map<String, String>> plates = plateRepo.findByUserId(user.getId())
                .stream()
                .map(p -> Map.of("plate", p.getPlate(), "vehicleType", p.getVehicleType()))
                .toList();

            return ResponseEntity.ok(Map.of("message", "Placa agregada", "plates", plates));
        }).orElse(ResponseEntity.status(404).build());
    }

    @Transactional
    @DeleteMapping("/plates/{plate}")
    public ResponseEntity<?> removePlate(@PathVariable String plate,
                                          Authentication auth) {
        return userRepo.findByUsername(auth.getName()).map(user -> {
            plateRepo.deleteByUserIdAndPlate(user.getId(), plate.toUpperCase());

            List<Map<String, String>> plates = plateRepo.findByUserId(user.getId())
                .stream()
                .map(p -> Map.of("plate", p.getPlate(), "vehicleType", p.getVehicleType()))
                .toList();

            return ResponseEntity.ok(Map.of("message", "Placa eliminada", "plates", plates));
        }).orElse(ResponseEntity.status(404).build());
    }

    @GetMapping("/tickets")
    public ResponseEntity<?> getMyTickets(Authentication auth) {
        return userRepo.findByUsername(auth.getName()).map(user -> {
            List<String> plates = plateRepo.findByUserId(user.getId())
                .stream()
                .map(UserPlateEntity::getPlate)
                .toList();

            if (plates.isEmpty()) return ResponseEntity.ok(List.of());

            LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
            List<TicketEntity> tickets = ticketRepo
                .findByLicensePlateInAndCreatedAtAfter(plates, cutoff);

            List<Map<String, Object>> response = tickets.stream()
                .map(t -> Map.<String, Object>of(
                    "id",           t.getId(),
                    "licensePlate", t.getLicensePlate(),
                    "spotId",       t.getSpotId(),
                    "entryTime",    t.getEntryTime().toString(),
                    "exitTime",     t.getExitTime() != null ? t.getExitTime().toString() : "",
                    "status",       t.isPaid() ? "PAID" : "ACTIVE",
                    "amount",       t.getAmount(),
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

    @GetMapping("/plates/check/{plate}")
    public ResponseEntity<?> checkPlate(@PathVariable String plate) {
        String upperPlate = plate.toUpperCase().trim();
        boolean exists = plateRepo.existsByPlate(upperPlate);
        if (!exists) {
            return ResponseEntity.status(404).body(Map.of(
                "error", "Placa no registrada en el sistema",
                "plate", upperPlate
            ));
        }
        UserPlateEntity found = plateRepo.findByPlate(upperPlate).orElseThrow();
        return ResponseEntity.ok(Map.of(
            "plate",       found.getPlate(),
            "vehicleType", found.getVehicleType(),
            "exists",      true
        ));
    }
}