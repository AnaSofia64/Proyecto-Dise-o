package gui;

import java.awt.Color;
import java.awt.Component;
import java.awt.Container;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Properties;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;

public class ThemeManager {

    public enum Theme { ORANGE, GREEN }

    private static Theme current = Theme.ORANGE;
    private static final File CONFIG = new File("theme.properties");

    public static void setTheme(Theme t) {
        setTheme(t, true);
    }

    // set theme and optionally persist
    public static void setTheme(Theme t, boolean persist) {
        current = t;
        if (persist) savePreference();
    }

    public static Theme getTheme() {
        return current;
    }

    public static Color background() {
        return Color.WHITE;
    }

    public static Color accent() {
        if (current == Theme.ORANGE) return new Color(255, 127, 0);
        return new Color(0, 153, 51);
    }

    public static Color foreground() {
        return Color.DARK_GRAY;
    }

    // Apply theme recursively to components in a container
    public static void applyTheme(Container root) {
        root.setBackground(background());
        for (Component c : root.getComponents()) {
            if (c instanceof JPanel) {
                c.setBackground(background());
                applyTheme((Container) c);
            } else if (c instanceof JLabel) {
                c.setBackground(background());
                ((JLabel) c).setForeground(foreground());
            } else if (c instanceof JButton) {
                JButton b = (JButton) c;
                b.setBackground(accent());
                b.setForeground(Color.WHITE);
            } else if (c instanceof Container) {
                c.setBackground(background());
                applyTheme((Container) c);
            }
        }
    }

    public static void loadPreference() {
        if (!CONFIG.exists()) return;
        Properties p = new Properties();
        try (FileInputStream in = new FileInputStream(CONFIG)) {
            p.load(in);
            String t = p.getProperty("theme");
            if (t != null) {
                try {
                    Theme theme = Theme.valueOf(t.toUpperCase());
                    setTheme(theme, false);
                } catch (IllegalArgumentException ex) {
                    // ignore invalid value
                }
            }
        } catch (IOException e) {
            // ignore read errors
        }
    }

    public static void savePreference() {
        Properties p = new Properties();
        p.setProperty("theme", current.name());
        try (FileOutputStream out = new FileOutputStream(CONFIG)) {
            p.store(out, "User theme preference");
        } catch (IOException e) {
            // ignore write errors
        }
    }
}

