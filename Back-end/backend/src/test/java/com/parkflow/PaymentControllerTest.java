package com.parkflow;

import com.parkflow.controller.PaymentController;
import com.parkflow.dto.PaymentRequest;
import com.parkflow.entity.TicketEntity;
import com.parkflow.service.ParkingFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class PaymentControllerTest {

    @Mock
    private ParkingFacade facade;

    @InjectMocks
    private PaymentController controller;

    private Authentication auth;
    private PaymentRequest request;

    @BeforeEach
    void setUp() {
        auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("usuario");
        when(auth.getAuthorities()).thenAnswer(i ->
            List.of(new SimpleGrantedAuthority("ROLE_USER")));

        request = new PaymentRequest();
        request.setTicketId("T-001");
        request.setPaymentMethod("CASH");
    }

    @Test
    void processPayment_ticketNoExiste_debeRetornar404() {
        when(facade.findTicketEntity("T-001")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.processPayment(request, auth);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void processPayment_ticketYaPagado_debeRetornarSuccess() {
        TicketEntity ticket = new TicketEntity();
        ticket.setId("T-001");
        ticket.setPaid(true);
        ticket.setAmount(6000.0);

        when(facade.findTicketEntity("T-001")).thenReturn(Optional.of(ticket));

        ResponseEntity<?> response = controller.processPayment(request, auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("SUCCESS", body.get("status"));
    }

    @Test
    void processPayment_exitoEnPrimerIntento_debeRetornarSuccess() {
        TicketEntity ticket = new TicketEntity();
        ticket.setId("T-001");
        ticket.setPaid(false);
        ticket.setEntryTime(LocalDateTime.now().minusHours(1));
        ticket.setAmount(3000.0);

        TicketEntity ticketPagado = new TicketEntity();
        ticketPagado.setId("T-001");
        ticketPagado.setPaid(true);
        ticketPagado.setAmount(3000.0);

        when(facade.findTicketEntity("T-001"))
            .thenReturn(Optional.of(ticket))
            .thenReturn(Optional.of(ticketPagado));
        when(facade.exitAndPay(anyString(), anyString(), anyString())).thenReturn(true);

        ResponseEntity<?> response = controller.processPayment(request, auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("SUCCESS", body.get("status"));
    }

    @Test
    void processPayment_circuitoAbierto_debeRetornar503() {
        TicketEntity ticket = new TicketEntity();
        ticket.setId("T-FAIL");
        ticket.setPaid(false);
        ticket.setEntryTime(LocalDateTime.now().minusHours(1));

        when(facade.findTicketEntity(startsWith("T-FAIL")))
            .thenReturn(Optional.of(ticket));
        when(facade.exitAndPay(anyString(), anyString(), startsWith("T-FAIL")))
            .thenThrow(new RuntimeException("Fallo simulado"));

        // 5 fallos para abrir el circuito
        for (int i = 0; i < 5; i++) {
            PaymentRequest r = new PaymentRequest();
            r.setTicketId("T-FAIL");
            r.setPaymentMethod("CASH");
            controller.processPayment(r, auth);
        }

        // Ahora el circuito debería estar abierto
        ResponseEntity<?> response = controller.processPayment(request, auth);
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
    }
}