package repository;

import domain.Ticket;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Repo en memoria para tickets.
 */
public class InMemoryTicketRepository {
    private final Map<String, Ticket> storage = new ConcurrentHashMap<>();

    public void save(Ticket t) { storage.put(t.getId(), t); }
    public Optional<Ticket> findById(String id) { return Optional.ofNullable(storage.get(id)); }
    public List<Ticket> findActive() {
        return storage.values().stream().filter(t -> t.getExitTime() == null).collect(Collectors.toList());
    }
    public Optional<Ticket> findActiveBySpot(String spotId) {
        return storage.values().stream().filter(t -> t.getExitTime() == null && t.getSpotId().equals(spotId)).findFirst();
    }
}