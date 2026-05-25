# Modelo C4 — ParkFlow

## Nivel 1 — Contexto del Sistema

Muestra cómo ParkFlow se relaciona con usuarios y sistemas externos.
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [Usuario]──────────────────────────▶[ParkFlow]           │
│   Ve ticket activo, paga su parqueo   Sistema de gestión   │
│                                       de parqueadero       │
│   [Celador]──────────────────────────▶[ParkFlow]           │
│   Registra entradas y salidas                              │
│                                                             │
│   [Admin]────────────────────────────▶[ParkFlow]           │
│   Gestiona celadores y estadísticas                        │
│                                                             │
│                         [ParkFlow]──▶[Supabase PostgreSQL] │
│                                       Base de datos en     │
│                                       la nube              │
│                                                             │
│                         [ParkFlow]──▶[Stripe API]          │
│                                       Pagos con tarjeta    │
│                                       (modo test)          │
└─────────────────────────────────────────────────────────────┘
---

## Nivel 2 — Contenedores

Muestra los contenedores que componen ParkFlow.
┌─────────────────────────────────────────────────────────────┐
│  ParkFlow                                                   │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │ Frontend             │    │ Backend                  │  │
│  │ TypeScript + Vite    │───▶│ Spring Boot 3.5          │  │
│  │ Puerto 3000          │    │ Java 17 — Puerto 8080    │  │
│  │                      │    │                          │  │
│  │ SPA con router       │    │ REST API + JWT           │  │
│  │ propio sin framework │    │ Circuit Breaker + Retry  │  │
│  └──────────────────────┘    └────────────┬─────────────┘  │
│                                           │                 │
│  ┌──────────────────────┐                 │                 │
│  │ Observabilidad       │    ┌────────────▼─────────────┐  │
│  │ Docker Compose       │    │ Supabase PostgreSQL      │  │
│  │                      │    │ Nube — AWS us-east-2     │  │
│  │ Prometheus :9090     │◀───│                          │  │
│  │ Grafana    :3001     │    │ users, spots             │  │
│  │ Jaeger     :16686    │    │ tickets, user_plates     │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
---

## Nivel 3 — Componentes del Backend

Muestra los componentes internos del contenedor Backend.
┌─────────────────────────────────────────────────────────────┐
│  Backend — Spring Boot                                      │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ JwtFilter  │  │ Auth       │  │ GlobalException    │   │
│  │ Security   │  │ Controller │  │ Handler            │   │
│  │ Config     │  └─────┬──────┘  └────────────────────┘   │
│  └─────┬──────┘        │                                   │
│        │         ┌─────▼──────┐  ┌────────────────────┐   │
│        │         │ Ticket     │  │ Payment            │   │
│        ▼         │ Controller │  │ Controller         │   │
│  Valida JWT      └─────┬──────┘  │ Circuit Breaker    │   │
│  en cada request       │         │ Retry + Backoff    │   │
│                        │         └────────┬───────────┘   │
│                  ┌─────▼──────────────────▼───────────┐   │
│                  │         ParkingFacade               │   │
│                  │         <<Facade Pattern>>          │   │
│                  └─────┬──────────────────┬───────────┘   │
│                        │                  │               │
│             ┌──────────▼──┐    ┌──────────▼──┐           │
│             │ UserJpa     │    │ TicketJpa   │           │
│             │ Repository  │    │ Repository  │           │
│             └─────────────┘    └─────────────┘           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Observabilidad                                       │  │
│  │ Micrometer → /actuator/prometheus                    │  │
│  │ OpenTelemetry → Jaeger :4317 (OTLP gRPC)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
---

## Nivel 3 — Componentes del Frontend

Muestra los componentes internos del contenedor Frontend.
┌─────────────────────────────────────────────────────────────┐
│  Frontend — TypeScript + Vite                               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ router.ts    │  │ auth.ts      │  │ api.ts           │ │
│  │ SPA routing  │  │ JWT storage  │  │ Fetch + Timeout  │ │
│  │ por roles    │  │ localStorage │  │ AbortController  │ │
│  └──────┬───────┘  └──────────────┘  └──────────────────┘ │
│         │                                                   │
│  ┌──────▼───────────────────────────────────────────────┐  │
│  │  Pages                                               │  │
│  │  LoginPage | RegisterPage | AttendantDashboard       │  │
│  │  RegisterEntryPage | AttendantReportsPage            │  │
│  │  UserDashboard | TicketPage                          │  │
│  │  AdminPanel | AdminWorkersPage                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Components                                          │  │
│  │  Sidebar (filtra por rol) | Header | Button | Input  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
