package domain;

public class Motorcycle extends Vehicle {
    public Motorcycle(String plate, String ownerId) { super(plate, ownerId); }
    @Override public VehicleType getType() { return VehicleType.MOTORCYCLE; }
}