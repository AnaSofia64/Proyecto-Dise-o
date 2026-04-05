package com.parkflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
public class TicketEntity {

    @Id
    private String id;

    @Column(name = "license_plate", nullable = false)
    private String licensePlate;

    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType;

    @Column(name = "spot_id", nullable = false)
    private String spotId;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "entry_time", nullable = false)
    private LocalDateTime entryTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @Column(nullable = false)
    private boolean paid = false;

    @Column
    private double amount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public TicketEntity() {}

    public String getId() { return id; }
    public String getLicensePlate() { return licensePlate; }
    public String getVehicleType() { return vehicleType; }
    public String getSpotId() { return spotId; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getEntryTime() { return entryTime; }
    public LocalDateTime getExitTime() { return exitTime; }
    public boolean isPaid() { return paid; }
    public double getAmount() { return amount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setId(String id) { this.id = id; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public void setSpotId(String spotId) { this.spotId = spotId; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public void setEntryTime(LocalDateTime entryTime) { this.entryTime = entryTime; }
    public void setExitTime(LocalDateTime exitTime) { this.exitTime = exitTime; }
    public void setPaid(boolean paid) { this.paid = paid; }
    public void setAmount(double amount) { this.amount = amount; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}