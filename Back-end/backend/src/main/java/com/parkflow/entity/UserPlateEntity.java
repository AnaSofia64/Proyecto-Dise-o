package com.parkflow.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user_plates")
public class UserPlateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "plate", nullable = false)
    private String plate;

    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType;

    public UserPlateEntity() {}

    public UserPlateEntity(String userId, String plate, String vehicleType) {
        this.userId = userId;
        this.plate = plate;
        this.vehicleType = vehicleType;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getPlate() { return plate; }
    public String getVehicleType() { return vehicleType; }
}