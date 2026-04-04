// Formateadores
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
};

// Generar ID único para trazabilidad
export const generateTraceId = (): string => {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateRequestId = (): string => {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// LocalStorage helpers
export const storage = {
  get: <T>(key: string): T | null => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  set: <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(key);
  }
};

// Validadores
export const validators = {
  licensePlate: (plate: string): boolean => {
    // Formatos: ABC-123, ABC123, etc.
    return /^[A-Z]{3}[-]?[0-9]{3,4}$/i.test(plate);
  },
  
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};