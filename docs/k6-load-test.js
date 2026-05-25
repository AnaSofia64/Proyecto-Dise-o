import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 90,
  duration: '20s',
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  // 1. Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: 'celador', password: '1234' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'token recibido': (r) => r.json('token') !== undefined,
  });

  const token = loginRes.json('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  sleep(0.5);

  // 2. Consultar spots
  const spotsRes = http.get(`${BASE_URL}/api/spots/stats`, { headers });
  check(spotsRes, { 'spots status 200': (r) => r.status === 200 });

  sleep(0.5);

  // 3. Consultar tickets activos
  const ticketsRes = http.get(`${BASE_URL}/api/tickets/active`, { headers });
  check(ticketsRes, { 'tickets status 200': (r) => r.status === 200 });

  sleep(1);
}
