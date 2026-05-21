package com.parkflow;

import com.parkflow.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret",
            "parkflow-super-secret-key-2024-must-be-long-enough-for-hs256");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 86400000L);
    }

    @Test
    void generateToken_debeRetornarTokenNoNulo() {
        String token = jwtUtil.generateToken("celador", "ATTENDANT");
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void extractUsername_debeRetornarUsernameCorrect() {
        String token = jwtUtil.generateToken("celador", "ATTENDANT");
        assertEquals("celador", jwtUtil.extractUsername(token));
    }

    @Test
    void extractRole_debeRetornarRolCorrecto() {
        String token = jwtUtil.generateToken("admin", "ADMIN");
        assertEquals("ADMIN", jwtUtil.extractRole(token));
    }

    @Test
    void isTokenValid_tokenValido_debeRetornarTrue() {
        String token = jwtUtil.generateToken("usuario", "USER");
        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void isTokenValid_tokenInvalido_debeRetornarFalse() {
        assertFalse(jwtUtil.isTokenValid("token.invalido.fake"));
    }

    @Test
    void isTokenValid_tokenModificado_debeRetornarFalse() {
        String token = jwtUtil.generateToken("celador", "ATTENDANT");
        String tokenModificado = token + "modificado";
        assertFalse(jwtUtil.isTokenValid(tokenModificado));
    }
}