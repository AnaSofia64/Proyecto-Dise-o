# Modelo de Vistas 4+1 — ParkFlow

## Vista Lógica
Describe la funcionalidad del sistema desde la perspectiva del usuario final.

### Componentes principales
- **AuthController** — maneja login y registro, genera JWT
- **TicketController** — crea y gestiona tickets de entrada/salida
- **PaymentController** — procesa pagos con Circuit Breaker y Retry
- **SpotController** — gestiona plazas y disponibilidad
- **UserController** — gestiona perfil y placas del usuario
- **ParkingFacade** — orquesta la lógica de negocio entre controllers y repositorios

### Diagrama de clases principales
UserEntity ──── UserPlateEntity
│
└──── TicketEntity ──── SpotEntity
### Roles y responsabilidades
| Rol | Responsabilidad |
|---|---|
| ADMIN | Gestionar celadores, ver estadísticas globales |
| ATTENDANT | Registrar entradas, dar salidas, ver reportes |
| USER | Ver ticket activo, pagar, gestionar placas |

---

## Vista de Procesos
Describe los procesos del sistema en tiempo de ejecución.

### Flujo de login
1. Usuario envía username + password
2. JwtFilter intercepta y valida credenciales
3. Backend genera JWT con rol embebido
4. Frontend guarda JWT en localStorage
5. Cada request siguiente envía JWT en header Authorization

### Flujo de pago
1. Usuario hace clic en "Pagar ahora"
2. Frontend llama POST /api/payments con ticketId y método
3. PaymentController verifica Circuit Breaker
4. Si circuito cerrado → intenta pago (hasta 3 veces con backoff)
5. Si pago exitoso → ticket se marca como paid=true
6. Celador ve ticket como pagado en reportes
7. Celador da salida → plaza se libera

### Flujo de registro de entrada
1. Celador selecciona tipo de vehículo y placa
2. Sistema busca plaza disponible del tipo correcto
3. Se crea ticket con entryTime y spotId
4. Plaza se marca como occupied=true
5. Ticket aparece en reportes del celador

---

## Vista de Desarrollo
Describe la organización del código fuente.

### Estructura del backend
com.parkflow/
├── controller/     ← endpoints REST
├── service/        ← ParkingFacade + lógica de negocio
├── entity/         ← entidades JPA (tablas BD)
├── repository/jpa/ ← repositorios Spring Data
├── security/       ← JWT + Spring Security
├── config/         ← CORS
├── exception/      ← manejo global de errores
├── domain/         ← entrega 1 (preservado)
├── factory/        ← entrega 1 (preservado)
└── manager/        ← entrega 1 (preservado)
### Estructura del frontend
parkflow-frontend/src/
├── pages/      ← una clase por página
├── components/ ← Sidebar, Header, Button, Input
├── api.ts      ← todos los endpoints
├── auth.ts     ← manejo JWT
├── router.ts   ← SPA router con protección de roles
└── utils.ts    ← utilidades compartidas
### Patrones de diseño aplicados
| Patrón | Dónde se usa |
|---|---|
| Singleton | ParkingManager (entrega 1) |
| Factory Method | VehicleFactory (entrega 1) |
| Strategy | PricingService, PaymentService (entrega 1) |
| Facade | ParkingFacade (entrega 2) |
| Circuit Breaker | PaymentController (entrega 2) |

---

## Vista Física
Describe el despliegue del sistema en infraestructura.

### Nodos de despliegue
┌─────────────────────┐     ┌─────────────────────┐
│  Máquina local       │     │  Supabase (Nube)     │
│                     │     │                     │
│  Frontend :3000     │────▶│  PostgreSQL          │
│  Backend  :8080     │     │  users               │
│                     │     │  spots               │
│  Docker:            │     │  tickets             │
│  Prometheus :9090   │     │  user_plates         │
│  Grafana    :3001   │     └─────────────────────┘
│  Jaeger     :16686  │
└─────────────────────┘
### Comunicación entre nodos
| Origen | Destino | Protocolo |
|---|---|---|
| Frontend | Backend | HTTP REST + JWT |
| Backend | Supabase | JDBC sobre SSL |
| Backend | Jaeger | OTLP gRPC :4317 |
| Prometheus | Backend | HTTP scrape /actuator/prometheus |
| Grafana | Prometheus | HTTP query |

---

## Vista de Escenarios
Casos de uso principales que validan las otras vistas.

### Escenario 1 — Usuario paga su parqueo
1. Celador registra entrada con placa del usuario
2. Usuario ve ticket activo en "Ticket & Pago"
3. Usuario selecciona método de pago y hace clic en pagar
4. Sistema procesa pago con reintentos automáticos
5. Plaza se libera automáticamente

### Escenario 2 — Servicio de pagos falla
1. Usuario intenta pagar
2. PaymentController lanza excepción
3. Sistema reintenta 3 veces (1s, 2s, 4s)
4. Tras 5 fallos consecutivos el Circuit Breaker se abre
5. Siguientes intentos responden instantáneamente con error 503
6. Tras 30 segundos el circuito se cierra solo

### Escenario 3 — Celador gestiona reportes
1. Celador ve lista de tickets activos en tiempo real
2. Cuando usuario paga, ticket aparece como "Pagado"
3. Celador puede dar salida manual o automática
4. Plaza queda disponible para el siguiente vehículo

### Escenario 4 — Admin gestiona celadores
1. Admin accede a panel de trabajadores
2. Crea nuevo celador con username y contraseña
3. Celador puede hacer login inmediatamente
4. Admin puede eliminar celadores desde el panel