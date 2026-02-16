package domain;

public class Truck extends Vehicle {

    public Truck(String plate) {
        super(plate);
    }

    @Override
    public String getType() {
        return "Truck";
    }
}
