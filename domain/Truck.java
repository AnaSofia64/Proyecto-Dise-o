package domain;

public class Truck extends Vehicle {
    public Truck(String plate, String ownerId) { super(plate, ownerId); }
    @Override public VehicleType getType() { return VehicleType.TRUCK; }
}