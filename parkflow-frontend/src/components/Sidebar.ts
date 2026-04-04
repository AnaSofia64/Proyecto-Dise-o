import { auth } from '../auth.js';

const icons: Record<string, string> = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`,
  ticket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v14"/><path d="M11 5v14"/></svg>`,
  payment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  report: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
};

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

export class Sidebar {
  private element: HTMLElement;

  constructor() {
    this.element = this.create();
  }

  private create(): HTMLElement {
    const user = auth.getUser();
    if (!user) return document.createElement('div');

    const aside = document.createElement('aside');
    aside.className = 'sidebar';

    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.innerHTML = `
      <div class="logo">
        <div class="logo-icon">
          ${icons.car}
        </div>
        <div class="logo-text">
          <h1>ParkFlow</h1>
          <span>Sistema Inteligente</span>
        </div>
      </div>
    `;
    aside.appendChild(header);

    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav';

    const navItems: NavItem[] = [
      { path: '/attendant/dashboard', label: 'Panel', icon: icons.dashboard, roles: ['ATTENDANT'] },
      { path: '/attendant/entry', label: 'Registrar Entrada', icon: icons.car, roles: ['ATTENDANT'] },
      { path: '/attendant/payment', label: 'Procesar Pagos', icon: icons.payment, roles: ['ATTENDANT'] },
      { path: '/attendant/reports', label: 'Reportes', icon: icons.report, roles: ['ATTENDANT'] },
      { path: '/user/dashboard', label: 'Mi Parqueo', icon: icons.car, roles: ['USER'] },
      { path: '/user/ticket', label: 'Ticket & Pago', icon: icons.ticket, roles: ['USER'] },
      { path: '/admin/panel', label: 'Panel Admin', icon: icons.chart, roles: ['ADMIN'] },
      { path: '/admin/workers', label: 'Trabajadores', icon: icons.users, roles: ['ADMIN'] },
    ];

    const filteredItems = navItems.filter(item => item.roles.indexOf(user.role) !== -1);

    filteredItems.forEach(item => {
      const link = document.createElement('a');
      link.href = item.path;
      link.className = 'nav-item';
      link.setAttribute('data-link', '');
      link.innerHTML = `${item.icon}<span>${item.label}</span>`;
      
      if (window.location.pathname === item.path) {
        link.classList.add('active');
      }
      
      nav.appendChild(link);
    });

    aside.appendChild(nav);

    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.innerHTML = `
      <div class="user-info">
        <div class="user-avatar">${user.fullName.charAt(0)}</div>
        <div class="user-details">
          <div class="user-name">${user.fullName}</div>
          <div class="user-role">${user.role.toLowerCase()}</div>
        </div>
      </div>
      <button class="btn-logout" id="btn-logout">
        ${icons.logout}
        <span>Cerrar Sesión</span>
      </button>
    `;

    const btnLogout = footer.querySelector('#btn-logout');
    btnLogout?.addEventListener('click', () => {
      auth.logout();
    });

    aside.appendChild(footer);

    this.element = aside;
    return aside;
  }

  render(): HTMLElement {
    return this.element;
  }

  updateActive(path: string): void {
    const items = this.element.querySelectorAll('.nav-item');
    items.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === path) {
        item.classList.add('active');
      }
    });
  }
}