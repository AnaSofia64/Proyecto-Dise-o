package com.parkflow.controller;

import com.parkflow.domain.ParkingSlot;
import com.parkflow.service.ParkingFacade;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/spots")
public class SpotController {

    private final ParkingFacade facade;

    public SpotController(ParkingFacade facade) {
        this.facade = facade;
    }

    /** GET /api/spots — todas las plazas con resumen */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getSpots() {
        return ResponseEntity.ok(buildSpotsResponse(facade.getAvailableSpots()));
    }

    /** GET /api/spots/available?type=CAR — plazas disponibles filtradas por tipo */
    @GetMapping("/available")
    public ResponseEntity<?> getAvailable(@RequestParam(required = false) String type) {
        List<ParkingSlot> spots = facade.getAvailableSpots();

        if (type != null && !type.isBlank()) {
            // Mapear tipo del front al SpotType del dominio
            String spotTypeSuffix = switch (type.toUpperCase()) {
                case "CAR"        -> "CAR_SPOT";
                case "MOTORCYCLE" -> "MOTORCYCLE_SPOT";
                case "TRUCK"      -> "TRUCK_SPOT";
                default           -> null;
            };
            if (spotTypeSuffix != null) {
                final String filter = spotTypeSuffix;
                spots = spots.stream()
                    .filter(s -> s.getType().name().equals(filter))
                    .toList();
            }
        }

        // El front espera: [{ id, code, type, status, hourlyRate }]
        List<Map<String, Object>> result = spots.stream().map(s -> Map.<String, Object>of(
            "id",         s.getId(),
            "code",       s.getId(),
            "type",       s.getType().name().replace("_SPOT", ""),
            "status",     s.isOccupied() ? "OCCUPIED" : "AVAILABLE",
            "hourlyRate", 3000
        )).toList();

        return ResponseEntity.ok(result);
    }

    /** GET /api/spots/stats — métricas para el dashboard */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
            "totalSpots",     facade.getTotalSlots(),
            "occupiedSpots",  facade.getOccupiedCount(),
            "availableSpots", facade.getAvailableCount(),
            "activeTickets",  facade.getOccupiedCount(),
            "todayRevenue",   0,
            "occupancyRate",  facade.getTotalSlots() == 0 ? 0 :
                              (double) facade.getOccupiedCount() / facade.getTotalSlots() * 100
        ));
    }

    private Map<String, Object> buildSpotsResponse(List<ParkingSlot> spots) {
        return Map.of(
            "total",     facade.getTotalSlots(),
            "available", facade.getAvailableCount(),
            "occupied",  facade.getOccupiedCount(),
            "spots",     spots.stream().map(s -> Map.of(
                "id",   s.getId(),
                "code", s.getId(),
                "type", s.getType().name().replace("_SPOT", ""),
                "status", s.isOccupied() ? "OCCUPIED" : "AVAILABLE",
                "hourlyRate", 3000
            )).toList()
        );
    }
}