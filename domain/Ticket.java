package domain;

import java.time.LocalDateTime;

public class Ticket {
    private final String id;
    private final Vehicle vehicle;
    private final String spotId;
    private final String createdBy;
    private final LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private double amount;
    private boolean paid;

    public Ticket(String id, Vehicle vehicle, String spotId, String createdBy, LocalDateTime entryTime) {
        this.id = id;
        this.vehicle = vehicle;
        this.spotId = spotId;
        this.createdBy = createdBy;
        this.entryTime = entryTime;
    }

    public String getId() { return id; }
    public Vehicle getVehicle() { return vehicle; }
    public String getSpotId() { return spotId; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getEntryTime() { return entryTime; }
    public LocalDateTime getExitTime() { return exitTime; }
    public void setExitTime(LocalDateTime exitTime) { this.exitTime = exitTime; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public boolean isPaid() { return paid; }
    public void setPaid(boolean paid) { this.paid = paid; }
}