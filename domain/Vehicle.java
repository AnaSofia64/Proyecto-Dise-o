package domain;

/**
 * Vehicle - clase abstracta (Factory produce subclases)
 */
public abstract class Vehicle {
    private final String plate;
    private final String ownerId;

    public Vehicle(String plate, String ownerId) {
        this.plate = plate;
        this.ownerId = ownerId;
    }

    public String getPlate() { return plate; }
    public String getOwnerId() { return ownerId; }

    public abstract VehicleType getType();
}