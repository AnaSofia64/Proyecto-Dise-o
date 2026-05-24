# Observabilidad — ParkFlow
 
## Stack de Observabilidad
 
ParkFlow implementa las tres capas fundamentales de observabilidad moderna:
 
| Herramienta | Puerto | Función |
|---|---|---|
| Prometheus | 9090 | Recolección de métricas |
| Grafana | 3001 | Visualización de dashboards |
| Jaeger | 16686 | Trazas distribuidas |
 
> **Diferencia clave:**  
> Prometheus + Grafana responden *¿QUÉ está pasando en el sistema en general?*  
> Jaeger responde *¿CÓMO se comportó esta request específica paso a paso?*
 
---
 
## Arquitectura de Observabilidad
 
```
┌─────────────────────────────────────────┐
│     Spring Boot Backend (:8080)          │
│                                         │
│  Micrometer → /actuator/prometheus      │
│  OpenTelemetry → OTLP gRPC :4317        │
└────────┬────────────────────┬───────────┘
         │ scrape cada 15s    │ trazas en tiempo real
         ▼                    ▼
┌─────────────────┐  ┌────────────────────┐
│  Prometheus     │  │  Jaeger            │
│  :9090          │  │  :16686 (UI)       │
│  (métricas)     │  │  :4317 (OTLP)      │
└────────┬────────┘  └────────────────────┘
         │ datasource
         ▼
┌─────────────────┐
│  Grafana        │
│  :3001          │
│  (dashboard)    │
└─────────────────┘
```
 
---
 
## 1. Prometheus
 
### Configuración
 
Archivo: `prometheus.yml`
 
```yaml
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'parkflow-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8080']
```
 
El endpoint `/actuator/prometheus` es expuesto por Spring Boot con Micrometer y está configurado como público en `SecurityConfig.java`.
 
### Métricas disponibles
 
| Métrica | Descripción |
|---|---|
| `http_server_requests_seconds_count` | Número de requests HTTP por endpoint |
| `http_server_requests_seconds_sum` | Tiempo acumulado de respuesta |
| `jvm_memory_used_bytes` | Memoria usada por la JVM |
| `jvm_threads_live_threads` | Threads activos |
| `hikaricp_connections_active` | Conexiones activas a la BD |
 
### Queries útiles para verificar
 
```promql
# Tasa de requests en el último minuto
rate(http_server_requests_seconds_count[1m])
 
# Tiempo promedio de respuesta por endpoint
rate(http_server_requests_seconds_sum[1m]) / rate(http_server_requests_seconds_count[1m])
 
# Memoria heap usada
jvm_memory_used_bytes{area="heap"}
 
# Requests específicas al endpoint de pagos
rate(http_server_requests_seconds_count{uri="/api/payments"}[1m])
```
 
---
 
## 2. Grafana
 
### Acceso
 
- URL: `http://localhost:3001`
- Usuario: `admin`
- Contraseña: `parkflow123`
 
### Dashboard "ParkFlow Observabilidad"
 
El dashboard tiene 4 paneles configurados:
 
| Panel | Query | Qué muestra |
|---|---|---|
| Requests HTTP | `rate(http_server_requests_seconds_count[1m])` | Volumen de tráfico en tiempo real |
| Tiempo de Respuesta | `rate(...sum[1m]) / rate(...count[1m])` | Latencia promedio por endpoint |
| Memoria JVM | `jvm_memory_used_bytes{area="heap"}` | Salud de la JVM |
| Requests de Pago | filtrado por `/api/payments` | Monitoreo del endpoint crítico con CB |
 
### Interpretación
 
- **Picos en Requests HTTP** → corresponden a momentos de actividad en el sistema (logins, pagos, registros)
- **Tiempo de respuesta estable** → sistema funcionando correctamente
- **Memoria JVM plana** → sin memory leaks
- **Caída en requests de pago** → puede indicar que el Circuit Breaker está abierto
 
---
 
## 3. Jaeger — Trazas Distribuidas
 
### Configuración en Spring Boot
 
`application.properties`:
```properties
management.tracing.sampling.probability=1.0
otel.exporter.otlp.endpoint=http://localhost:4317
otel.exporter.otlp.protocol=grpc
otel.metrics.exporter=none
otel.logs.exporter=none
```
 
`sampling.probability=1.0` significa que el 100% de las requests generan una traza.
 
### Acceso
 
- URL: `http://localhost:16686`
- Servicio: `parkflow-backend`
 
### Cómo leer una traza
 
Cada traza representa el ciclo de vida completo de una request:
 
```
POST /api/payments ──────────────────── 245ms (traza raíz)
  ├── JwtFilter.doFilter ─────────────── 2ms
  ├── PaymentController.processPayment ── 240ms
  │     ├── ParkingFacade.findTicket ─── 45ms (query BD)
  │     └── ParkingFacade.exitAndPay ─── 180ms
  │           ├── TicketJpaRepo.save ─── 85ms (write BD)
  │           └── SpotJpaRepo.save ───── 90ms (write BD)
  └── Response serialization ─────────── 3ms
```
 
### Endpoints más relevantes para observar
 
| Endpoint | Por qué es interesante |
|---|---|
| `POST /api/payments` | Muestra Circuit Breaker, Retry, múltiples queries a BD |
| `POST /api/tickets` | Muestra asignación de plaza y creación de ticket |
| `POST /api/auth/login` | Muestra validación de credenciales y generación de JWT |
| `GET /api/spots/available` | Muestra el timeout de 2s y la query filtrada |
 
---
 
## Cómo levantar el stack
 
```bash
cd Proyecto-Diseño
docker compose up -d
```
 
Verificar que los tres contenedores estén corriendo:
 
```bash
docker ps
# parkflow-prometheus   → Up
# parkflow-grafana      → Up
# parkflow-jaeger       → Up
```
 
Verificar que Prometheus recibe datos del backend:
1. Abrir `http://localhost:9090/targets`
2. Confirmar que `parkflow-backend` aparece como `UP`
 
---
 
## Evidencia de cobertura
 
La observabilidad está activa en **todos los endpoints** del sistema (15+), incluyendo:
- `POST /api/auth/login` ✓
- `POST /api/payments` ✓ 
- `POST /api/tickets` ✓
- `GET /api/spots/available` ✓
- `GET /api/users/tickets` ✓
