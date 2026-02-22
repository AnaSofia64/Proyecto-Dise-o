package domain;

/**
 * ParkingSlot representa la plaza física.
 */
public class ParkingSlot {
    private final String id;
    private final SpotType type;
    private boolean occupied;

    public ParkingSlot(String id, SpotType type) {
        this.id = id;
        this.type = type;
        this.occupied = false;
    }

    public String getId() { return id; }
    public SpotType getType() { return type; }
    public boolean isOccupied() { return occupied; }
    public void setOccupied(boolean occupied) { this.occupied = occupied; }
}