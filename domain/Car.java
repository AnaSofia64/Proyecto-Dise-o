package domain;

public class Car extends Vehicle {
    public Car(String plate, String ownerId) { super(plate, ownerId); }
    @Override public VehicleType getType() { return VehicleType.CAR; }
}