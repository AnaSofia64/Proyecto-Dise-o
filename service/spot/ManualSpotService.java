package service.spot;

import domain.ParkingSlot;
import repository.InMemorySpotRepository;

import java.util.List;
import java.util.Optional;

/**
 * Implementación simple que actúa sobre el repositorio en memoria.
 * SRP: sólo maneja estado de plazas.
 */
public class ManualSpotService implements SpotService {
    private final InMemorySpotRepository repo;

    public ManualSpotService(InMemorySpotRepository repo) {
        this.repo = repo;
    }

    @Override public List<ParkingSlot> listAll() { return repo.findAll(); }
    @Override public List<ParkingSlot> listAvailable() { return repo.findAvailable(); }
    @Override public Optional<ParkingSlot> findById(String id) { return repo.findById(id); }

    @Override
    public synchronized void occupy(String spotId) {
        var opt = repo.findById(spotId);
        if (opt.isEmpty()) throw new IllegalArgumentException("Spot no existe");
        ParkingSlot s = opt.get();
        if (s.isOccupied()) throw new IllegalStateException("Spot ya ocupado");
        s.setOccupied(true);
        repo.save(s);
    }

    @Override
    public synchronized void release(String spotId) {
        var opt = repo.findById(spotId);
        if (opt.isEmpty()) throw new IllegalArgumentException("Spot no existe");
        ParkingSlot s = opt.get();
        s.setOccupied(false);
        repo.save(s);
    }
}