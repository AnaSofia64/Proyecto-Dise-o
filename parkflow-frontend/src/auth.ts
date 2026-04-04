import { storage } from './utils.js';
import { authApi, type User } from './api.js';

export const auth = {
  async login(username: string, password: string): Promise<User> {
    const response = await authApi.login(username, password);
    
    storage.set('jwt_token', response.token);
    storage.set('user', response.user);
    storage.set('trace_id', `session-${Date.now()}`);
    
    return response.user;
  },

  async register(data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<User> {
    return await authApi.register(data);
  },

  logout(): void {
    storage.remove('jwt_token');
    storage.remove('user');
    storage.remove('trace_id');
    window.location.href = '/login';
  },

  getUser(): User | null {
    return storage.get<User>('user');
  },

  getToken(): string | null {
    return storage.get<string>('jwt_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  },

  checkAuth(): boolean {
    if (!this.isAuthenticated()) {
      window.location.href = '/login';
      return false;
    }
    return true;
  }
};