import gui.MainWindow;
import gui.ThemeManager;
import manager.ParkingManager;

public class Main {
    public static void main(String[] args) {
        ParkingManager manager = ParkingManager.getInstance();
        System.out.println("Parking system started with " + manager.getSlotCount() + " slots.");

        // Load saved preference (if any), then parse optional theme argument: --theme=green|orange
        ThemeManager.loadPreference();
        for (String a : args) {
            if (a.startsWith("--theme=")) {
                String val = a.substring("--theme=".length()).toLowerCase();
                if (val.equals("green")) ThemeManager.setTheme(ThemeManager.Theme.GREEN);
                else if (val.equals("orange")) ThemeManager.setTheme(ThemeManager.Theme.ORANGE);
            }
        }
        MainWindow.showGui();
    }
}
