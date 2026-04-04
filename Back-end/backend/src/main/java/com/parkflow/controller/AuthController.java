package com.parkflow.controller;

import com.parkflow.dto.LoginRequest;
import com.parkflow.dto.LoginResponse;
import com.parkflow.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    public AuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Usuarios hardcodeados para la demo
        Map<String, String[]> users = Map.of(
            "celador",  new String[]{"1234",    "ATTENDANT"},
            "admin",    new String[]{"admin123", "ADMIN"},
            "usuario",  new String[]{"user123",  "USER"}
        );

        String[] credentials = users.get(request.getUsername());
        if (credentials == null || !credentials[0].equals(request.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales inválidas"));
        }

        String role  = credentials[1];
        String token = jwtUtil.generateToken(request.getUsername(), role);

        // El front espera: { token, user: { username, role } }
        Map<String, Object> user = Map.of(
            "id",       request.getUsername(),
            "username", request.getUsername(),
            "fullName", request.getUsername(),
            "email",    request.getUsername() + "@parkflow.com",
            "role",     role
        );

        return ResponseEntity.ok(Map.of("token", token, "user", user));
    }
}