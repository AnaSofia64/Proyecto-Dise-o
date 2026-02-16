package domain;

import java.time.LocalDateTime;

public class Ticket {

    private final String id;
    private final Vehicle vehicle;
    private final LocalDateTime entryTime;
    private LocalDateTime exitTime;

    public Ticket(String id, Vehicle vehicle) {
        this.id = id;
        this.vehicle = vehicle;
        this.entryTime = LocalDateTime.now();
        this.exitTime = null;
    }

    public void closeTicket() {
        this.exitTime = LocalDateTime.now();
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public LocalDateTime getEntryTime() {
        return entryTime;
    }

    public LocalDateTime getExitTime() {
        return exitTime;
    }

    public String getId() {
        return id;
    }
}
