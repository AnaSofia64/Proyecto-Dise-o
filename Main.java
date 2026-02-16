import manager.ParkingManager;

public class Main {
    public static void main(String[] args) {
        ParkingManager manager = ParkingManager.getInstance();
        System.out.println("Parking system started with " + manager.getSlotCount() + " slots.");
    }
}
