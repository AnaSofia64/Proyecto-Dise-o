import { generateTraceId, generateRequestId, storage } from './utils.js';

const API_BASE_URL = 'http://localhost:8080/api';

// Tipos
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiError {
  message: string;
  code: string;
  timestamp: string;
  traceId?: string;
}

// Cliente HTTP
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string, defaultTimeout = 10000) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': generateRequestId(),
      'X-Trace-ID': storage.get<string>('trace_id') || generateTraceId()
    };

    const token = storage.get<string>('jwt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    timeout?: number
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || this.defaultTimeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          storage.remove('jwt_token');
          storage.remove('user');
          window.location.href = '/login';
          throw new Error('Sesión expirada');
        }

        if (response.status === 503) {
          throw new Error('Servicio temporalmente no disponible. Intente más tarde.');
        }

        const error: ApiError = await response.json();
        throw new Error(error.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('La solicitud tardó demasiado. Verifique su conexión.');
        }
        throw error;
      }

      throw new Error('Error desconocido');
    }
  }

  get<T>(endpoint: string, timeout?: number): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, timeout);
  }

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }

  put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, body);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

export const api = new ApiClient(API_BASE_URL);

// Endpoints específicos
export const authApi = {
  login: (username: string, password: string) => 
    api.post<{ token: string; user: User }>('/auth/login', { username, password }),
  
  register: (data: RegisterData) => 
    api.post<User>('/auth/register', data)
};

export const ticketApi = {
  create: (data: CreateTicketData) =>
    api.post<Ticket>('/tickets', data),

  getActive: () =>
    api.get<Ticket[]>('/tickets/active'),

  getById: (id: string) =>
    api.get<Ticket>(`/tickets/${id}`),

  close: (id: string) =>
    api.post<Ticket>(`/tickets/${id}/exit`, {}),

  getUserTickets: () =>
    api.get<Ticket[]>('/users/tickets')
};

export const spotApi = {
  getAll: () => 
    api.get<Spot[]>('/spots', 2000),
  
  getAvailable: (type?: string) => 
    api.get<Spot[]>(`/spots/available${type ? `?type=${type}` : ''}`, 2000),
  
  getStats: () => 
    api.get<DashboardStats>('/spots/stats')
};

export const paymentApi = {
  process: (ticketId: string, method: string) => 
    api.post<Payment>('/payments', { ticketId, method }),
  
  getStatus: (id: string) => 
    api.get<Payment>(`/payments/${id}/status`)
};

export const userApi = {
  getMe: () =>
    api.get<User>('/users/me'),

  addPlate: (plate: string, vehicleType: string) =>
  api.post<{ message: string; plates: any[] }>('/users/plates', { plate, vehicleType }),

  removePlate: (plate: string) =>
    api.delete<{ message: string; plates: string[] }>(`/users/plates/${plate}`),

  getMyTickets: () =>
    api.get<Ticket[]>('/users/tickets')
};
// Tipos exportados
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ATTENDANT' | 'ADMIN';
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  type: 'CAR' | 'MOTORCYCLE' | 'BUS';
  color?: string;
}

export interface Spot {
  id: string;
  code: string;
  type: 'CAR' | 'MOTORCYCLE' | 'BUS';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  hourlyRate: number;
}

export interface Ticket {
  id: string;
  vehicle: Vehicle;
  spot: Spot;
  entryTime: string;
  exitTime?: string;
  status: 'ACTIVE' | 'PAID' | 'PENDING';
  totalAmount?: number;
  qrCode: string;
}

export interface Payment {
  id: string;
  ticketId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'QR';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
  retryCount?: number;
}

export interface DashboardStats {
  totalSpots: number;
  occupiedSpots: number;
  availableSpots: number;
  activeTickets: number;
  todayRevenue: number;
  occupancyRate: number;
}
export const workersApi = {
  list: () => api.get<Record<string, string>>('/workers'),
  create: (username: string, password: string) =>
    api.post<{ username: string; role: string; status: string }>('/workers', { username, password }),
  delete: (username: string) => api.delete<{ status: string }>(`/workers/${username}`)
};

export interface CreateTicketData {
  licensePlate: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'BUS';
  spotId?: string;
}