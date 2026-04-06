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

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSpots() {
        List<ParkingSlot> spots = facade.getAvailableSpots();
        return ResponseEntity.ok(Map.of(
            "available", facade.getAvailableCount(),
            "occupied",  facade.getOccupiedCount(),
            "spots", spots.stream().map(s -> Map.of(
                "id",         s.getId(),
                "code",       s.getId(),
                "type",       s.getType().name().replace("_SPOT", ""),
                "status",     s.isOccupied() ? "OCCUPIED" : "AVAILABLE",
                "hourlyRate", 3000
            )).toList()
        ));
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAvailable(@RequestParam(required = false) String type) {
        List<ParkingSlot> spots = facade.getAvailableSpots();
        if (type != null && !type.isBlank()) {
            String filter = switch (type.toUpperCase()) {
                case "CAR"        -> "CAR_SPOT";
                case "MOTORCYCLE" -> "MOTORCYCLE_SPOT";
                case "TRUCK"      -> "TRUCK_SPOT";
                default           -> null;
            };
            if (filter != null) {
                spots = spots.stream()
                    .filter(s -> s.getType().name().equals(filter))
                    .toList();
            }
        }
        List<Map<String, Object>> result = spots.stream().map(s -> Map.<String, Object>of(
            "id",         s.getId(),
            "code",       s.getId(),
            "type",       s.getType().name().replace("_SPOT", ""),
            "status",     "AVAILABLE",
            "hourlyRate", 3000
        )).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        int total     = facade.getTotalSlots();
        int occupied  = facade.getOccupiedCount();
        int available = facade.getAvailableCount();
        return ResponseEntity.ok(Map.of(
            "totalSpots",     total,
            "occupiedSpots",  occupied,
            "availableSpots", available,
            "activeTickets",  occupied,
            "todayRevenue",   facade.getTodayRevenue(),
            "occupancyRate",  total == 0 ? 0 : (double) occupied / total * 100
        ));
    }
}