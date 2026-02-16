package service;

import domain.ParkingSlot;
import domain.Vehicle;
import java.util.List;

public class SpotAssignmentService {

    public ParkingSlot assignSlot(Vehicle vehicle, List<ParkingSlot> slots) {
        for (ParkingSlot slot : slots) {
            if (!slot.isOccupied()) {
                slot.assignVehicle(vehicle);
                return slot;
            }
        }
        return null;
    }
}
