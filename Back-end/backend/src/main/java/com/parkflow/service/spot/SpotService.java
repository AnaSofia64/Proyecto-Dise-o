package com.parkflow.service.spot;

import com.parkflow.domain.ParkingSlot;
import com.parkflow.domain.Vehicle;

import java.util.List;
import java.util.Optional;

/**
 * Interfaz para manejo de plazas (DIP).
 * Interfaz para manejo de plazas (DIP).
 * Implementaciones pueden ser manuales o automáticas.
 */
public interface SpotService {
    List<ParkingSlot> listAll();
    List<ParkingSlot> listAvailable();
    Optional<ParkingSlot> findById(String id);
    void occupy(String spotId);
    void release(String spotId);
}