# Resiliencia — ParkFlow
 
## Patrones Implementados
 
ParkFlow implementa tres patrones de resiliencia: **Circuit Breaker**, **Retry con backoff exponencial** y **Timeout**. Los tres se aplican al flujo de pagos, que es el punto más crítico del sistema.
 
---
 
## 1. Circuit Breaker
 
### ¿Qué es?
 
El Circuit Breaker es un patrón que evita que un sistema siga intentando ejecutar operaciones que tienen alta probabilidad de fallar. Actúa como un interruptor: cuando detecta demasiados fallos seguidos, "abre el circuito" y responde inmediatamente con un error controlado, en lugar de saturar el sistema con intentos fallidos.
 
### Estados
 
```
         5 fallos consecutivos          30 segundos
  CLOSED ─────────────────────► OPEN ──────────────► CLOSED
  (normal)                    (cortado)              (recuperado)
     ▲                            │
     └────────────────────────────┘
         reset manual (éxito)
```
 
### Implementación en ParkFlow
 
Archivo: `Back-end/backend/src/main/java/com/parkflow/controller/PaymentController.java`
 
```java
private final AtomicInteger failureCount = new AtomicInteger(0);
private volatile long circuitOpenedAt    = 0;
private static final int  FAILURE_THRESHOLD = 5;   // umbral de fallos
private static final long CIRCUIT_TIMEOUT   = 30_000; // 30 segundos
 
@PostMapping
public ResponseEntity<?> processPayment(...) {
 
    // 1. Verificar si el circuito está abierto
    if (isCircuitOpen()) {
        return ResponseEntity.status(503).body(Map.of(
            "error",        "Servicio de pagos temporalmente no disponible",
            "circuit",      "OPEN",
            "retryAfterMs", remainingCircuitTime()  // informa cuándo reintentar
        ));
    }
 
    // ... lógica de pago con Retry ...
 
    // 2. Si todos los intentos fallan, incrementar contador
    int failures = failureCount.incrementAndGet();
    if (failures >= FAILURE_THRESHOLD) {
        circuitOpenedAt = System.currentTimeMillis(); // abrir circuito
        failureCount.set(0);
    }
}
 
private boolean isCircuitOpen() {
    if (circuitOpenedAt == 0) return false;
    return (System.currentTimeMillis() - circuitOpenedAt) < CIRCUIT_TIMEOUT;
}
 
private long remainingCircuitTime() {
    return CIRCUIT_TIMEOUT - (System.currentTimeMillis() - circuitOpenedAt);
}
```
 
### Endpoints donde aplica
 
- `POST /api/payments` — protección principal del procesador de pagos
 
### Comportamiento observable
 
Cuando el circuito está abierto, la respuesta es inmediata:
```json
{
  "error": "Servicio de pagos temporalmente no disponible",
  "circuit": "OPEN",
  "retryAfterMs": 18432
}
```
 
---
 
## 2. Retry con Backoff Exponencial
 
### ¿Qué es?
 
El patrón Retry reintenta automáticamente una operación fallida. El backoff exponencial aumenta el tiempo de espera entre intentos para no saturar el servicio.
 
### Implementación en ParkFlow
 
```java
long[] backoffs = {1000, 2000, 4000}; // 1s, 2s, 4s
Exception lastException = null;
 
for (int attempt = 0; attempt < backoffs.length; attempt++) {
    try {
        // intento de procesar el pago
        boolean paid = facade.exitAndPay(auth.getName(), role, ticketId);
        if (paid) {
            failureCount.set(0); // éxito: resetear contador del CB
            return ResponseEntity.ok(Map.of(
                "status",  "SUCCESS",
                "attempt", attempt + 1  // informa en qué intento tuvo éxito
            ));
        }
    } catch (Exception e) {
        lastException = e;
        if (attempt < backoffs.length - 1) {
            Thread.sleep(backoffs[attempt]); // espera antes del siguiente intento
        }
    }
}
// si llega aquí: todos los intentos fallaron → incrementar CB
```
 
### Flujo de tiempos
 
```
t=0s    Intento 1 → falla
t=1s    Intento 2 → falla
t=3s    Intento 3 → falla
t=7s    Todos fallaron → +1 al contador del Circuit Breaker
```
 
### Endpoints donde aplica
 
- `POST /api/payments` — hasta 3 intentos con esperas 1s, 2s, 4s
 
---
 
## 3. Timeout
 
### ¿Qué es?
 
El Timeout evita que una operación lenta bloquee el sistema indefinidamente. Si la respuesta no llega en el tiempo definido, la operación se cancela.
 
### Implementación en ParkFlow
 
**Backend** — `application.properties`:
```properties
spring.mvc.async.request-timeout=8000
```
Todas las requests que tomen más de 8 segundos son canceladas automáticamente por Spring.
 
**Frontend** — `api.ts`:
```typescript
const controller = new AbortController();
const timeoutId = window.setTimeout(() => controller.abort(), timeout);
 
const response = await fetch(url, {
    signal: controller.signal,  // vincula el abort al fetch
    ...
});
```
 
Tiempos configurados:
- **10 segundos** — timeout global para todas las llamadas
- **2 segundos** — timeout específico para `GET /api/spots/available` (no debe bloquear la UI al seleccionar plaza)
 
### Endpoints donde aplica
 
- `GET /api/spots/available` — timeout de 2s (crítico para UX)
- Todos los demás endpoints — timeout de 10s
 
---
 
## Resumen de cobertura
 
| Patrón | Endpoint principal | Endpoint secundario |
|---|---|---|
| Circuit Breaker | POST /api/payments | — |
| Retry (backoff exp.) | POST /api/payments | — |
| Timeout (backend) | Todos los endpoints | — |
| Timeout (frontend) | GET /api/spots/available (2s) | Todos los demás (10s) |