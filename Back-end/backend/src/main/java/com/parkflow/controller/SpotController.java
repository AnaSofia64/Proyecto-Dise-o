package com.parkflow.controller;

import com.parkflow.entity.SpotEntity;
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
        return ResponseEntity.ok(buildResponse(facade.getAvailableSpots()));
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAvailable(@RequestParam(required = false) String type) {
        List<SpotEntity> spots = type != null && !type.isBlank()
            ? facade.getAvailableSpotsByType(type)
            : facade.getAvailableSpots();

        return ResponseEntity.ok(spots.stream().map(s -> Map.of(
            "id",         s.getId(),
            "code",       s.getId(),
            "type",       s.getType(),
            "status",     s.isOccupied() ? "OCCUPIED" : "AVAILABLE",
            "hourlyRate", s.getHourlyRate()
        )).toList());
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
            "todayRevenue",   0,
            "occupancyRate",  total == 0 ? 0 : (double) occupied / total * 100
        ));
    }

    private Map<String, Object> buildResponse(List<SpotEntity> spots) {
        return Map.of(
            "total",     facade.getTotalSlots(),
            "available", facade.getAvailableCount(),
            "occupied",  facade.getOccupiedCount(),
            "spots",     spots.stream().map(s -> Map.of(
                "id",         s.getId(),
                "code",       s.getId(),
                "type",       s.getType(),
                "status",     s.isOccupied() ? "OCCUPIED" : "AVAILABLE",
                "hourlyRate", s.getHourlyRate()
            )).toList()
        );
    }
}