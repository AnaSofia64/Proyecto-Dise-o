package com.parkflow.dto;

public class TicketRequest {
    private String licensePlate;
    private String vehicleType;   // CAR, TRUCK, MOTORCYCLE
    private String ownerName;
    private String spotId;        // ← NUEVO campo

    // getters y setters
    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getSpotId() { return spotId; }
    public void setSpotId(String spotId) { this.spotId = spotId; }
}