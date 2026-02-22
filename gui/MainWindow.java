package gui;

import manager.ParkingManager;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;

public class MainWindow extends JFrame {

    private final ParkingManager manager = ParkingManager.getInstance();
    private JLabel slotsLabel;

    public MainWindow() {
        setTitle("Parking System");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setPreferredSize(new Dimension(480, 240));

        initComponents();

        pack();
        setLocationRelativeTo(null);
    }

    private void initComponents() {
        JPanel root = new JPanel(new BorderLayout(10, 10));

        JLabel header = new JLabel("Parking System", SwingConstants.CENTER);
        header.setFont(new Font("SansSerif", Font.BOLD, 20));

        slotsLabel = new JLabel(  "Disponibles: " + manager.getAvailableSlots() + " / Total: " + manager.getTotalSlots(), SwingConstants.CENTER);
        slotsLabel.setFont(new Font("SansSerif", Font.PLAIN, 16));

        JPanel center = new JPanel(new BorderLayout());
        center.add(slotsLabel, BorderLayout.CENTER);

        JPanel bottom = new JPanel();
        JButton toggle = new JButton("Alternar tema");
        toggle.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                ThemeManager.Theme next = ThemeManager.getTheme() == ThemeManager.Theme.ORANGE
                        ? ThemeManager.Theme.GREEN : ThemeManager.Theme.ORANGE;
                ThemeManager.setTheme(next); // persists preference
                ThemeManager.applyTheme(getContentPane());
                repaint();
            }
        });

        JButton exit = new JButton("Salir");
        exit.addActionListener(ae -> System.exit(0));

        bottom.add(toggle);
        bottom.add(exit);

        root.add(header, BorderLayout.NORTH);
        root.add(center, BorderLayout.CENTER);
        root.add(bottom, BorderLayout.SOUTH);

        setContentPane(root);
        ThemeManager.applyTheme(getContentPane());
    }

    public static void showGui() {
        SwingUtilities.invokeLater(() -> {
            MainWindow w = new MainWindow();
            w.setVisible(true);
        });
    }
}
