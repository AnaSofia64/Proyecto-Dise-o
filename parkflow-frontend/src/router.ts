import { auth } from './auth.js';

type RouteHandler = () => void;

interface Route {
  path: string;
  handler: RouteHandler;
  roles?: string[];
}

const pages = {
  login: () => import('./pages/LoginPage.js').then(m => m.LoginPage),
  register: () => import('./pages/RegisterPage.js').then(m => m.RegisterPage),
  attendantDashboard: () => import('./pages/AttendantDashboard.js').then(m => m.AttendantDashboard),
  registerEntry: () => import('./pages/RegisterEntryPage.js').then(m => m.RegisterEntryPage),
  processPayment: () => import('./pages/ProcessPaymentPage.js').then(m => m.ProcessPaymentPage),
  userDashboard: () => import('./pages/UserDashboard.js').then(m => m.UserDashboard),
  ticket: () => import('./pages/TicketPage.js').then(m => m.TicketPage),
  adminPanel: () => import('./pages/AdminPanel.js').then(m => m.AdminPanel)
};

class Router {
  private routes: Route[] = [];
  private currentPage: string = '';

  constructor() {
    this.setupEventListeners();
    this.defineRoutes();
  }

  private defineRoutes(): void {
    this.routes = [
      { path: '/login', handler: () => this.renderPage('login') },
      { path: '/register', handler: () => this.renderPage('register') },
      { 
        path: '/attendant/dashboard', 
        handler: () => this.renderPage('attendantDashboard'),
        roles: ['ATTENDANT']
      },
      { 
        path: '/attendant/entry', 
        handler: () => this.renderPage('registerEntry'),
        roles: ['ATTENDANT']
      },
      { 
        path: '/attendant/payment', 
        handler: () => this.renderPage('processPayment'),
        roles: ['ATTENDANT']
      },
      { 
        path: '/user/dashboard', 
        handler: () => this.renderPage('userDashboard'),
        roles: ['USER']
      },
      { 
        path: '/user/ticket', 
        handler: () => this.renderPage('ticket'),
        roles: ['USER']
      },
      { 
        path: '/admin/panel', 
        handler: () => this.renderPage('adminPanel'),
        roles: ['ADMIN']
      },
      { path: '/', handler: () => this.redirect('/login') },
      { path: '*', handler: () => this.redirect('/login') }
    ];
  }

  private setupEventListeners(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-link]');
      
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) this.navigate(href);
      }
    });

    window.addEventListener('popstate', () => {
      this.handleRoute();
    });
  }

  navigate(path: string): void {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  redirect(path: string): void {
    window.history.replaceState({}, '', path);
    this.handleRoute();
  }

  private async handleRoute(): Promise<void> {
    const path = window.location.pathname;
    const route = this.routes.filter(r => {
      if (r.path === '*') return false;
      return this.matchRoute(r.path, path);
    })[0] || this.routes.filter(r => r.path === '*')[0];

    if (!route) return;

    if (route.roles && !auth.isAuthenticated()) {
      this.redirect('/login');
      return;
    }

    if (route.roles && !route.roles.some(r => auth.hasRole(r))) {
      this.redirect('/unauthorized');
      return;
    }

    route.handler();
  }

  private matchRoute(routePath: string, actualPath: string): boolean {
    if (routePath === actualPath) return true;
    
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');
    
    if (routeParts.length !== actualParts.length) return false;
    
    return routeParts.every((part, i) => {
      if (part.indexOf(':') === 0) return true;
      return part === actualParts[i];
    });
  }

  private async renderPage(pageName: keyof typeof pages): Promise<void> {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = '<div class="loading-spinner" style="margin: auto;"></div>';

    try {
      const PageClass = await pages[pageName]();
      const page = new PageClass();
      app.innerHTML = '';
      const rendered = page.render();
      if (rendered instanceof Promise) {
        app.appendChild(await rendered);
      } else {
        app.appendChild(rendered);
      }
      this.currentPage = pageName;
    } catch (error) {
      console.error('Error loading page:', error);
      app.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--red);">Error cargando la página</div>';
    }
  }

  init(): void {
    this.handleRoute();
  }
}

export const router = new Router();