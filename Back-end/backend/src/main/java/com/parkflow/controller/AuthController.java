package com.parkflow.controller;

import com.parkflow.dto.LoginRequest;
import com.parkflow.dto.LoginResponse;
import com.parkflow.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    // Workers creados dinámicamente por el admin (en memoria)
    private static final ConcurrentHashMap<String, String[]> dynamicUsers = new ConcurrentHashMap<>();

    public AuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Usuarios base hardcodeados
        Map<String, String[]> baseUsers = Map.of(
            "celador",  new String[]{"1234",     "ATTENDANT", "Celador Demo"},
            "admin",    new String[]{"admin123",  "ADMIN",     "Administrador"},
            "usuario",  new String[]{"user123",   "USER",      "Usuario Demo"}
        );

        String[] credentials = baseUsers.get(request.getUsername());
        if (credentials == null) {
            credentials = dynamicUsers.get(request.getUsername());
        }

        if (credentials == null || !credentials[0].equals(request.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales inválidas"));
        }

        String role     = credentials[1];
        String fullName = credentials.length > 2 ? credentials[2] : request.getUsername();
        String token    = jwtUtil.generateToken(request.getUsername(), role);

        Map<String, Object> user = Map.of(
            "id",       request.getUsername(),
            "username", request.getUsername(),
            "fullName", fullName,
            "email",    request.getUsername() + "@parkflow.com",
            "role",     role
        );

        return ResponseEntity.ok(Map.of("token", token, "user", user));
    }

    // POST /api/auth/workers — admin crea un celador
    @PostMapping("/workers")
    public ResponseEntity<?> createWorker(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String fullName = body.get("fullName");

        if (username == null || password == null || fullName == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "username, password y fullName son requeridos"));
        }

        if (dynamicUsers.containsKey(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "El usuario ya existe"));
        }

        dynamicUsers.put(username, new String[]{password, "ATTENDANT", fullName});

        return ResponseEntity.ok(Map.of(
            "username", username,
            "fullName", fullName,
            "role",     "ATTENDANT",
            "email",    username + "@parkflow.com"
        ));
    }

    // GET /api/auth/workers — admin lista celadores
    @GetMapping("/workers")
    public ResponseEntity<?> listWorkers() {
        List<Map<String, String>> workers = new ArrayList<>();

        // Celador base
        workers.add(Map.of(
            "username", "celador",
            "fullName", "Celador Demo",
            "role",     "ATTENDANT",
            "email",    "celador@parkflow.com"
        ));

        // Celadores creados dinámicamente
        dynamicUsers.forEach((username, creds) -> {
            if ("ATTENDANT".equals(creds[1])) {
                workers.add(Map.of(
                    "username", username,
                    "fullName", creds.length > 2 ? creds[2] : username,
                    "role",     "ATTENDANT",
                    "email",    username + "@parkflow.com"
                ));
            }
        });

        return ResponseEntity.ok(workers);
    }

    // DELETE /api/auth/workers/{username} — admin elimina celador
    @DeleteMapping("/workers/{username}")
    public ResponseEntity<?> deleteWorker(@PathVariable String username) {
        if ("celador".equals(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se puede eliminar el celador base"));
        }
        dynamicUsers.remove(username);
        return ResponseEntity.ok(Map.of("deleted", username));
    }
}