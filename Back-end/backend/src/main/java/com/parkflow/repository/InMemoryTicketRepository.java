package com.parkflow.repository;

import com.parkflow.domain.Ticket;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class InMemoryTicketRepository {

    private final Map<String, Ticket> storage = new ConcurrentHashMap<>();

    public void save(Ticket t) { storage.put(t.getId(), t); }

    public Optional<Ticket> findById(String id) { return Optional.ofNullable(storage.get(id)); }

    public List<Ticket> findAll() { return new ArrayList<>(storage.values()); }

    public List<Ticket> findActive() {
        return storage.values().stream()
            .filter(t -> t.getExitTime() == null)
            .collect(Collectors.toList());
    }

    public List<Ticket> findByOwner(String username) {
        return storage.values().stream()
            .filter(t -> username.equals(t.getCreatedBy()))
            .collect(Collectors.toList());
    }

    public Optional<Ticket> findActiveBySpot(String spotId) {
        return storage.values().stream()
            .filter(t -> t.getExitTime() == null && t.getSpotId().equals(spotId))
            .findFirst();
    }

    public double sumTodayRevenue() {
        return storage.values().stream()
            .filter(t -> t.isPaid())
            .mapToDouble(t -> t.getAmount())
            .sum();
    }
}