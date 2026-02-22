package repository;

import domain.User;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryUserRepository {
    private final Map<String, User> users = new ConcurrentHashMap<>();
    public void save(User u) { users.put(u.getId(), u); }
    public Optional<User> findById(String id) { return Optional.ofNullable(users.get(id)); }
}