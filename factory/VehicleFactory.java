package factory;

import domain.*;

public class VehicleFactory {
    /**
     * Factory simple que crea Vehicle concretos a partir de tipo string.
     * Devuelve la abstracción Vehicle.
     */
    public static Vehicle createVehicle(String type, String plate, String ownerId) {
        switch (type.toUpperCase()) {
            case "CAR": return new Car(plate, ownerId);
            case "TRUCK": return new Truck(plate, ownerId);
            case "MOTORCYCLE": return new Motorcycle(plate, ownerId);
            default: throw new IllegalArgumentException("Tipo no soportado: " + type);
        }
    }
}