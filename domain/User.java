package domain;

public class User {
    private final String id;
    private final String name;
    private final Role role;

    public User(String id, String name, Role role) {
        this.id = id;
        this.name = name;
        this.role = role;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public Role getRole() { return role; }
}