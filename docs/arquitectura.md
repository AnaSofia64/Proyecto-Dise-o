# Arquitectura del Sistema — ParkFlow
 
## 1. Descripción del Sistema
 
ParkFlow es un sistema de gestión de parqueadero universitario que permite registrar entradas y salidas de vehículos, asignar plazas, calcular tarifas y procesar pagos. Está diseñado con roles diferenciados: administrador, celador y usuario.
 
El sistema sigue una **arquitectura orientada a servicios (SOA)** donde el backend actúa como servicio proveedor de una API REST y el frontend como servicio consumidor.
 
---
 
## 2. Arquitectura Inicial (Entrega 1)
 
La primera entrega implementó la lógica de negocio con persistencia en memoria, aplicando patrones de diseño clásicos:
 
```
┌─────────────────────────────────────────────────┐
│                  gui/ (MainWindow)               │
└─────────────────────────┬───────────────────────┘
                          │
┌─────────────────────────▼───────────────────────┐
│            manager/ (ParkingManager)             │
│                   <<Singleton>>                  │
└──┬──────────────┬──────────────┬────────────────┘
   │              │              │
┌──▼───┐    ┌────▼────┐   ┌─────▼──────┐
│Ticket│    │Pricing  │   │Payment     │
│Svc   │    │Service  │   │Service     │
│      │    │<<iface>>│   │<<iface>>   │
└──────┘    └─────────┘   └────────────┘
   │
┌──▼──────────────────┐
│ repository/ InMemory │
│ Spots, Tickets, Users│
└──────────────────────┘
```
 
**Componentes Entrega 1:**
- `domain/` — entidades `Vehicle`, `Ticket`, `ParkingSlot`, `User`
- `factory/` — `VehicleFactory` (patrón Factory Method)
- `service/` — `PricingService`, `PaymentService`, `TicketService`, `SpotAssignmentService` (patrón Strategy)
- `manager/` — `ParkingManager` (patrón Singleton)
- `repository/` — repositorios en memoria
 
---
 
## 3. Arquitectura Evolucionada (Entrega 2)
 
La segunda entrega evoluciona el sistema hacia una arquitectura orientada a servicios completa, agregando persistencia real, seguridad, resiliencia y observabilidad.
 
```
┌──────────────────────────────────────────────────────────┐
│              Frontend (TypeScript + Vite)                 │
│         Servicio Consumidor — puerto 3000                 │
│  LoginPage | Dashboard | TicketPage | AdminPanel ...      │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP REST + JWT
                          │ AbortController (timeout)
┌─────────────────────────▼────────────────────────────────┐
│            Backend (Spring Boot 3.5 — Java 17)            │
│              Servicio Proveedor — puerto 8080             │
│                                                           │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │JwtFilter    │  │Controllers │  │GlobalException   │  │
│  │SecurityCfg  │→ │Auth|Spot   │→ │Handler           │  │
│  │JwtUtil      │  │Ticket|Pay  │  └──────────────────┘  │
│  └─────────────┘  │User        │                         │
│                   └─────┬──────┘                         │
│                         │                                 │
│                   ┌─────▼──────┐                         │
│                   │ParkingFacade│                        │
│                   │<<Facade>>  │                         │
│                   └─────┬──────┘                         │
│                         │                                 │
│         ┌───────────────┼───────────────┐                │
│   ┌─────▼─────┐  ┌──────▼─────┐  ┌─────▼──────┐        │
│   │UserJpa    │  │SpotJpa     │  │TicketJpa   │        │
│   │Repository │  │Repository  │  │Repository  │        │
│   └─────┬─────┘  └──────┬─────┘  └─────┬──────┘        │
└─────────┼───────────────┼──────────────┼────────────────┘
          │               │              │
┌─────────▼───────────────▼──────────────▼────────────────┐
│              Supabase PostgreSQL (Nube)                   │
│         users | user_plates | spots | tickets            │
└──────────────────────────────────────────────────────────┘
 
┌──────────────────────────────────────────────────────────┐
│             Observabilidad (Docker)                       │
│  Prometheus:9090 → Grafana:3001 | Jaeger:16686           │
└──────────────────────────────────────────────────────────┘
```
 
### Comunicación entre servicios
 
| Rol | Componente | Tecnología |
|---|---|---|
| Proveedor | Spring Boot Backend | REST API JSON |
| Consumidor | TypeScript Frontend | Fetch API + AbortController |
| Intercambio | JWT en header `Authorization: Bearer` | HMAC-SHA256 |
 
**Endpoints de comunicación (muestra):**
 
```
POST /api/auth/login       → devuelve JWT + perfil de usuario
POST /api/tickets          → crea ticket, devuelve objeto ticket
POST /api/payments         → procesa pago con Circuit Breaker
GET  /api/spots/available  → plazas disponibles por tipo
GET  /api/users/tickets    → historial de tickets del usuario
```
 
### Capas de la arquitectura evolucionada
 
```
Controller Layer   → recibe HTTP, valida JWT, delega a Facade
Facade Layer       → orquesta lógica de negocio, accede a JPA repos
Repository Layer   → JPA (Entrega 2) + InMemory (Entrega 1, preservado)
Entity Layer       → UserEntity, SpotEntity, TicketEntity, UserPlateEntity
Security Layer     → JwtUtil, JwtFilter, SecurityConfig
Observability      → Micrometer + Prometheus + Grafana + Jaeger (OTLP)
```
 
---
 
## 4. Diagrama de Componentes
 
Ver archivo `diagramas/parkflow-uml-entrega2.xml` (importable en draw.io)  
Ver archivo `diagramas/parkflow-secuencia-pago.xml` (diagrama de secuencia del flujo de pago)
 
---
 
## 5. Decisiones Arquitectónicas
 
| Decisión | Justificación |
|---|---|
| REST sobre SOAP | Más liviano, compatible con frontend TypeScript, ampliamente adoptado |
| JWT stateless | No requiere sesiones en servidor, escala horizontalmente |
| Facade pattern | Desacopla controllers de repositorios, facilita pruebas |
| Circuit Breaker manual | Demuestra comprensión profunda del patrón sin dependencia de librerías |
| Supabase como BD | PostgreSQL en la nube con pool de conexiones, sin infraestructura propia |
| Docker para observabilidad | Prometheus + Grafana + Jaeger sin afectar el stack principal |