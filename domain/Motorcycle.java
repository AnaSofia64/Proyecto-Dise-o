package domain;

public class Motorcycle extends Vehicle {

    public Motorcycle(String plate) {
        super(plate);
    }

    @Override
    public String getType() {
        return "Motorcycle";
    }
}
