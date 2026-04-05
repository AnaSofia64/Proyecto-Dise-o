package com.parkflow.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "spots")
public class SpotEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String type; // CAR, MOTORCYCLE, TRUCK, HANDICAPPED

    @Column(nullable = false)
    private boolean occupied = false;

    @Column(name = "hourly_rate", nullable = false)
    private int hourlyRate = 3000;

    public SpotEntity() {}

    public SpotEntity(String id, String type) {
        this.id = id;
        this.type = type;
        this.occupied = false;
        this.hourlyRate = 3000;
    }

    public String getId() { return id; }
    public String getType() { return type; }
    public boolean isOccupied() { return occupied; }
    public int getHourlyRate() { return hourlyRate; }
    public void setId(String id) { this.id = id; }
    public void setType(String type) { this.type = type; }
    public void setOccupied(boolean occupied) { this.occupied = occupied; }
    public void setHourlyRate(int hourlyRate) { this.hourlyRate = hourlyRate; }
}