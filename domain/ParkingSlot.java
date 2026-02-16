package domain;

public class ParkingSlot {

    private int slotId;
    private boolean occupied;
    private Vehicle vehicle;

    public ParkingSlot(int slotId) {
        this.slotId = slotId;
        this.occupied = false;
    }

    public void assignVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
        this.occupied = true;
    }

    public void removeVehicle() {
        this.vehicle = null;
        this.occupied = false;
    }

    public boolean isOccupied() {
        return occupied;
    }

    public int getSlotId() {
        return slotId;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }
}
