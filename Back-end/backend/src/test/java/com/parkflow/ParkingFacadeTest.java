package com.parkflow;

import com.parkflow.entity.SpotEntity;
import com.parkflow.entity.TicketEntity;
import com.parkflow.repository.jpa.SpotJpaRepository;
import com.parkflow.repository.jpa.TicketJpaRepository;
import com.parkflow.service.ParkingFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParkingFacadeTest {

    @Mock
    private SpotJpaRepository spotJpaRepo;

    @Mock
    private TicketJpaRepository ticketJpaRepo;

    @InjectMocks
    private ParkingFacade facade;

    private SpotEntity spotLibre;
    private SpotEntity spotOcupado;

    @BeforeEach
    void setUp() {
        spotLibre = new SpotEntity("C-01", "CAR");
        spotLibre.setOccupied(false);

        spotOcupado = new SpotEntity("C-02", "CAR");
        spotOcupado.setOccupied(true);

        // Simular que ya hay plazas en DB para evitar el @PostConstruct
        when(spotJpaRepo.count()).thenReturn(9L);
        when(spotJpaRepo.findAll()).thenReturn(List.of(spotLibre, spotOcupado));
        facade.init();
    }

    // ── admitVehicle ──────────────────────────────────────────

    @Test
    void admitVehicle_plazaLibre_debeCrearTicket() {
        when(spotJpaRepo.findById("C-01")).thenReturn(Optional.of(spotLibre));
        when(ticketJpaRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        TicketEntity ticket = facade.admitVehicle(
            "celador", "ATTENDANT", "ABC123", "CAR", "C-01");

        assertNotNull(ticket);
        assertEquals("ABC123", ticket.getLicensePlate());
        assertEquals("CAR", ticket.getVehicleType());
        assertEquals("C-01", ticket.getSpotId());
        assertFalse(ticket.isPaid());
        verify(spotJpaRepo).save(spotLibre);
        assertTrue(spotLibre.isOccupied());
    }

    @Test
    void admitVehicle_plazaOcupada_debeLanzarExcepcion() {
        when(spotJpaRepo.findById("C-02")).thenReturn(Optional.of(spotOcupado));

        assertThrows(IllegalStateException.class, () ->
            facade.admitVehicle("celador", "ATTENDANT", "XYZ999", "CAR", "C-02"));
    }

    @Test
    void admitVehicle_plazaNoExiste_debeLanzarExcepcion() {
        when(spotJpaRepo.findById("NOEXISTE")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
            facade.admitVehicle("celador", "ATTENDANT", "ABC123", "CAR", "NOEXISTE"));
    }

    // ── exitAndPay ────────────────────────────────────────────

    @Test
    void exitAndPay_ticketActivo_debePagarYNoLiberarPlaza() {
        TicketEntity ticket = new TicketEntity();
        ticket.setId("T-001");
        ticket.setSpotId("C-01");
        ticket.setEntryTime(LocalDateTime.now().minusHours(2));
        ticket.setPaid(false);

        when(ticketJpaRepo.findById("T-001")).thenReturn(Optional.of(ticket));
        when(ticketJpaRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        boolean result = facade.exitAndPay("usuario", "USER", "T-001");

        assertTrue(result);
        assertTrue(ticket.isPaid());
        assertFalse(ticket.isReleased());
        assertNotNull(ticket.getExitTime());
        assertTrue(ticket.getAmount() > 0);
        // La plaza NO debe liberarse aquí
        verify(spotJpaRepo, never()).save(any());
    }

    @Test
    void exitAndPay_ticketYaPagado_debeRetornarTrueSinModificar() {
        TicketEntity ticket = new TicketEntity();
        ticket.setId("T-002");
        ticket.setPaid(true);
        ticket.setAmount(6000.0);

        when(ticketJpaRepo.findById("T-002")).thenReturn(Optional.of(ticket));

        boolean result = facade.exitAndPay("usuario", "USER", "T-002");

        assertTrue(result);
        verify(ticketJpaRepo, never()).save(any());
    }

    @Test
    void exitAndPay_ticketNoExiste_debeLanzarExcepcion() {
        when(ticketJpaRepo.findById("NOEXISTE")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
            facade.exitAndPay("usuario", "USER", "NOEXISTE"));
    }

    @Test
    void exitAndPay_calcularMonto_minimoCobra1Hora() {
        TicketEntity ticket = new TicketEntity();
        ticket.setId("T-003");
        ticket.setSpotId("C-01");
        ticket.setEntryTime(LocalDateTime.now().minusMinutes(15));
        ticket.setPaid(false);

        when(ticketJpaRepo.findById("T-003")).thenReturn(Optional.of(ticket));
        when(ticketJpaRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        facade.exitAndPay("usuario", "USER", "T-003");

        assertEquals(3000.0, ticket.getAmount());
    }

    // ── releaseSpot ───────────────────────────────────────────

    @Test
    void releaseSpot_debeMarcarReleasedYLiberarPlaza() {
        TicketEntity ticket = new TicketEntity();
        ticket.setId("T-001");
        ticket.setPaid(true);
        ticket.setReleased(false);

        SpotEntity spot = new SpotEntity("C-01", "CAR");
        spot.setOccupied(true);

        when(ticketJpaRepo.findById("T-001")).thenReturn(Optional.of(ticket));
        when(spotJpaRepo.findById("C-01")).thenReturn(Optional.of(spot));
        when(ticketJpaRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(spotJpaRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        facade.releaseSpot("C-01", "T-001");

        assertTrue(ticket.isReleased());
        assertFalse(spot.isOccupied());
    }

    // ── getActiveTickets ──────────────────────────────────────

    @Test
    void getActiveTickets_debeRetornarSoloNoPagados() {
        TicketEntity t1 = new TicketEntity();
        t1.setPaid(false);
        TicketEntity t2 = new TicketEntity();
        t2.setPaid(false);

        when(ticketJpaRepo.findByPaid(false)).thenReturn(List.of(t1, t2));

        List<TicketEntity> activos = facade.getActiveTickets();

        assertEquals(2, activos.size());
        verify(ticketJpaRepo).findByPaid(false);
    }
}