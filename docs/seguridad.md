# Seguridad — ParkFlow
 
## Mecanismo Implementado: JWT + Spring Security
 
ParkFlow implementa autenticación basada en **JSON Web Tokens (JWT)** con **Spring Security**, protegiendo todos los endpoints relevantes del sistema.
 
---
 
## Arquitectura de Seguridad
 
```
Cliente                     Backend
  │                            │
  │  POST /api/auth/login       │
  │  { username, password }    │
  │ ──────────────────────────► │
  │                            │  1. Busca usuario en BD
  │                            │  2. Valida BCrypt password
  │                            │  3. Genera JWT firmado HS256
  │  { token, user }           │
  │ ◄────────────────────────── │
  │                            │
  │  GET /api/tickets/active   │
  │  Authorization: Bearer JWT  │
  │ ──────────────────────────► │
  │                            │  4. JwtFilter intercepta
  │                            │  5. Valida firma + expiración
  │                            │  6. Inyecta Authentication
  │                            │  7. Ejecuta lógica de negocio
  │  200 OK { tickets... }     │
  │ ◄────────────────────────── │
```
 
---
 
## 1. JwtUtil — Generación y Validación
 
Archivo: `security/JwtUtil.java`
 
```java
@Component
public class JwtUtil {
 
    @Value("${jwt.secret}")
    private String secret;          // clave configurable en application.properties
 
    @Value("${jwt.expiration}")
    private long expiration;        // 86400000ms = 24 horas
 
    // Genera el token con username y role en el payload
    public String generateToken(String username, String role) {
        return Jwts.builder()
                .subject(username)
                .claim("role", role)        // ADMIN | ATTENDANT | USER
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())         // HMAC-SHA256
                .compact();
    }
 
    // Valida firma y expiración
    public boolean isTokenValid(String token) {
        try {
            getClaims(token);   // lanza excepción si el token es inválido
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```
 
**Características del token:**
- Algoritmo: `HMAC-SHA256` — firma simétrica con clave secreta
- Payload: `username` + `role` + `iat` (issued at) + `exp` (expiration)
- Expiración: 24 horas
- Clave: configurable vía `application.properties`, no hardcodeada
 
---
 
## 2. JwtFilter — Interceptor de Requests
 
Archivo: `security/JwtFilter.java`
 
El filtro se ejecuta en cada request antes de llegar al controller:
 
```java
// Flujo del filtro:
// 1. Extraer header Authorization
// 2. Verificar formato "Bearer <token>"
// 3. Validar token con JwtUtil
// 4. Extraer username y role
// 5. Crear UsernamePasswordAuthenticationToken
// 6. Inyectar en SecurityContextHolder
// 7. Continuar la cadena de filtros
 
extends OncePerRequestFilter  // garantiza ejecución exactamente una vez por request
```
 
---
 
## 3. SecurityConfig — Reglas de Acceso
 
Archivo: `security/SecurityConfig.java`
 
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/login").permitAll()      // login público
    .requestMatchers("/api/auth/register").permitAll()   // registro público
    .requestMatchers("/actuator/health").permitAll()     // health check público
    .requestMatchers("/actuator/prometheus").permitAll() // métricas públicas
    .anyRequest().authenticated()                        // TODO lo demás requiere JWT
)
.sessionManagement(session ->
    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS) // sin sesiones
)
```
 
**Política:** el servidor no guarda estado de sesión. Cada request debe incluir el JWT.
 
**CORS configurado:**
```java
config.setAllowedOrigins(List.of(
    "http://localhost:3000",   // frontend desarrollo
    "http://localhost:5173",   // Vite dev server
    "http://localhost:5174"
));
```
 
---
 
## 4. Control de Acceso por Roles
 
El sistema tiene tres roles con acceso diferenciado:
 
| Rol | Rutas frontend | Capacidades |
|---|---|---|
| `ADMIN` | `/admin/*` | Panel global, CRUD de celadores, stats |
| `ATTENDANT` | `/attendant/*` | Registrar entradas, reportes, dar salida |
| `USER` | `/user/*` | Ver ticket activo, pagar, gestionar placas |
 
El rol viaja dentro del JWT y es extraído en cada request:
 
```java
// En los controllers:
String role = auth.getAuthorities().iterator().next()
                  .getAuthority().replace("ROLE_", "");
// → "ADMIN" | "ATTENDANT" | "USER"
```
 
El **Sidebar del frontend** también filtra los elementos de navegación según el rol guardado en `localStorage`, evitando que el usuario vea rutas a las que no tiene acceso.
 
---
 
## 5. Protección de Contraseñas
 
Las contraseñas se almacenan con **BCrypt** — nunca en texto plano:
 
```java
// Al registrar usuario:
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String hashedPassword = encoder.encode(rawPassword);
// → "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LRaB8ppxzm."
 
// Al hacer login:
encoder.matches(rawPassword, hashedPassword) // → true/false
```
 
BCrypt incluye salt automático — dos hashes del mismo password son siempre diferentes.
 
---
 
## Endpoints protegidos (muestra)
 
| Endpoint | Requiere JWT | Rol mínimo |
|---|---|---|
| `POST /api/auth/login` | No | — |
| `POST /api/auth/register` | No | — |
| `GET /api/spots` | Sí | Cualquiera |
| `POST /api/tickets` | Sí | ATTENDANT |
| `POST /api/payments` | Sí | USER |
| `DELETE /api/auth/workers/{u}` | Sí | ADMIN |
| `GET /api/users/me` | Sí | Cualquiera |
| `GET /actuator/prometheus` | No | — (solo métricas) |
 
**Total de endpoints protegidos:** 13 de 15 endpoints requieren JWT válido.
 
Cumple ampliamente la condición mínima de proteger al menos 2 endpoints relevantes.
 
---
 
## Prueba de seguridad en vivo
 
```bash
# 1. Sin token → 401 Unauthorized
curl http://localhost:8080/api/spots
 
# 2. Obtener token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"celador","password":"1234"}'
# → { "token": "eyJhbGc..." }
 
# 3. Con token → 200 OK
curl http://localhost:8080/api/spots \
  -H "Authorization: Bearer eyJhbGc..."
 
# 4. Token de celador en endpoint de admin → acceso denegado
curl -X DELETE http://localhost:8080/api/auth/workers/test \
  -H "Authorization: Bearer eyJhbGc..."
# → 403 F