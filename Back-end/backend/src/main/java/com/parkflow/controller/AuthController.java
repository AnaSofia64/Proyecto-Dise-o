package com.parkflow.controller;

import com.parkflow.dto.LoginRequest;
import com.parkflow.entity.UserEntity;
import com.parkflow.repository.jpa.UserJpaRepository;
import com.parkflow.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final UserJpaRepository userRepo;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthController(JwtUtil jwtUtil, UserJpaRepository userRepo) {
        this.jwtUtil = jwtUtil;
        this.userRepo = userRepo;
        this.passwordEncoder = new BCryptPasswordEncoder();
        initDefaultUsers();
    }

    private void initDefaultUsers() {
        if (!userRepo.existsByUsername("celador")) {
            userRepo.save(new UserEntity(
                "celador", "celador@parkflow.com",
                passwordEncoder.encode("1234"),
                "ATTENDANT", "Celador Principal"
            ));
        }
        if (!userRepo.existsByUsername("admin")) {
            userRepo.save(new UserEntity(
                "admin", "admin@parkflow.com",
                passwordEncoder.encode("admin123"),
                "ADMIN", "Administrador"
            ));
        }
        if (!userRepo.existsByUsername("usuario")) {
            userRepo.save(new UserEntity(
                "usuario", "usuario@parkflow.com",
                passwordEncoder.encode("user123"),
                "USER", "Usuario Demo"
            ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<UserEntity> userOpt = userRepo.findByUsername(request.getUsername());

        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales inválidas"));
        }

        UserEntity user = userOpt.get();
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", Map.of(
                "id",       user.getId(),
                "username", user.getUsername(),
                "email",    user.getEmail(),
                "fullName", user.getFullName(),
                "role",     user.getRole()
            )
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String email    = request.get("email");
        String password = request.get("password");
        String fullName = request.get("fullName");
        String role     = request.getOrDefault("role", "USER");

        if (username == null || email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Faltan campos requeridos"));
        }
        if (userRepo.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "El usuario ya existe"));
        }
        if (userRepo.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "El email ya está registrado"));
        }
        if (!"USER".equals(role) && !"ATTENDANT".equals(role)) {
            role = "USER";
        }

        userRepo.save(new UserEntity(
            username, email,
            passwordEncoder.encode(password),
            role,
            fullName != null ? fullName : username
        ));

        return ResponseEntity.ok(Map.of(
            "message", "Usuario registrado exitosamente",
            "username", username,
            "role",     role
        ));
    }

    @GetMapping("/workers")
    public ResponseEntity<?> listWorkers() {
        List<Map<String, Object>> workers = userRepo.findAll().stream()
            .filter(u -> "ATTENDANT".equals(u.getRole()))
            .map(u -> Map.<String, Object>of(
                "id",       u.getId(),
                "username", u.getUsername(),
                "fullName", u.getFullName(),
                "email",    u.getEmail(),
                "role",     u.getRole()
            )).toList();
        return ResponseEntity.ok(workers);
    }

    @DeleteMapping("/workers/{username}")
    public ResponseEntity<?> deleteWorker(@PathVariable String username) {
        if ("celador".equals(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se puede eliminar el celador base"));
        }
        return userRepo.findByUsername(username).map(u -> {
            userRepo.delete(u);
            return ResponseEntity.ok(Map.of("deleted", username));
        }).orElse(ResponseEntity.status(404).build());
    }
}