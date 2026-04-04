package com.parkflow.controller;

import com.parkflow.dto.LoginRequest;
import com.parkflow.dto.LoginResponse;
import com.parkflow.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    public AuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Usuarios hardcodeados para la demo (sin base de datos)
        if ("celador".equals(request.getUsername()) && 
            "1234".equals(request.getPassword())) {
            String token = jwtUtil.generateToken("celador", "CELADOR");
            return ResponseEntity.ok(new LoginResponse(token, "celador", "CELADOR"));
        }
        if ("admin".equals(request.getUsername()) && 
            "admin123".equals(request.getPassword())) {
            String token = jwtUtil.generateToken("admin", "ADMIN");
            return ResponseEntity.ok(new LoginResponse(token, "admin", "ADMIN"));
        }
        return ResponseEntity.status(401).body("Credenciales incorrectas");
    }
}