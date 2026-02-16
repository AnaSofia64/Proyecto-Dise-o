package service;

import domain.Car;
import domain.Motorcycle;
import domain.Truck;
import domain.Vehicle;

public class VehicleFactory {

    public static Vehicle createVehicle(String type, String plate) {

        switch (type.toLowerCase()) {
            case "car":
                return new Car(plate);
            case "truck":
                return new Truck(plate);
            case "motorcycle":
                return new Motorcycle(plate);
            default:
                throw new IllegalArgumentException("Unknown vehicle type");
        }
    }
}
