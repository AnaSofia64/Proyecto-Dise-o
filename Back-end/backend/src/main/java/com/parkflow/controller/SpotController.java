package com.parkflow.controller;

import com.parkflow.service.ParkingFacade;
import com.parkflow.domain.ParkingSlot;
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

    /** GET /api/spots — lista plazas disponibles con resumen */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getSpots() {
        List<ParkingSlot> available = facade.getAvailableSpots();

        Map<String, Object> response = Map.of(
            "total",     facade.getTotalSlots(),
            "available", facade.getAvailableCount(),
            "occupied",  facade.getOccupiedCount(),
            "spots",     available.stream().map(s -> Map.of(
                "id",   s.getId(),
                "type", s.getType().toString()
            )).toList()
        );

        return ResponseEntity.ok(response);
    }
}