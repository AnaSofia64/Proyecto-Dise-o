package domain;

public class Car extends Vehicle {

    public Car(String plate) {
        super(plate);
    }

    @Override
    public String getType() {
        return "Car";
    }
}
