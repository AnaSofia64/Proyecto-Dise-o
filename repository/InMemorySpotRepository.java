package repository;

import domain.ParkingSlot;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Repositorio en memoria para plazas.
 * SRP: separa persistencia de lógica.
 */
public class InMemorySpotRepository {
    private final Map<String, ParkingSlot> storage = new ConcurrentHashMap<>();

    public void save(ParkingSlot slot) { storage.put(slot.getId(), slot); }
    public Optional<ParkingSlot> findById(String id) { return Optional.ofNullable(storage.get(id)); }
    public List<ParkingSlot> findAll() { return new ArrayList<>(storage.values()); }

    public List<ParkingSlot> findAvailable() {
        List<ParkingSlot> res = new ArrayList<>();
        for (ParkingSlot s : storage.values()) if (!s.isOccupied()) res.add(s);
        return res;
    }
}