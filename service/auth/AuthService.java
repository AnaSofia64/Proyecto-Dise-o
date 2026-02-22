package service.auth;

import domain.Role;
import domain.User;

/**
 * Servicio de autenticación/permiso mínimo para demo.
 * SRP: responsabilidades de auth separadas.
 */
public class AuthService {
    public boolean canRegisterEntry(User user) {
        return user != null && (user.getRole() == Role.ATTENDANT || user.getRole() == Role.ADMIN);
    }

    public boolean canProcessExit(User user) {
        return canRegisterEntry(user);
    }

    public boolean isAdmin(User user) {
        return user != null && user.getRole() == Role.ADMIN;
    }
}