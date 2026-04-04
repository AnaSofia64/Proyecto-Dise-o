import { Sidebar } from '../components/Sidebar.js';
import { spotApi } from '../api.js';
import { formatCurrency } from '../utils.js';

const icons = {
  users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  ticket: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v14"/><path d="M11 5v14"/></svg>`,
  dollar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  chart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
};

export class AdminPanel {
  private container: HTMLDivElement;
  private stats: any = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    try {
      this.stats = await spotApi.getStats();
    } catch (error) {
      console.error('Error cargando stats:', error);
    }

    const sidebar = new Sidebar();
    this.container.appendChild(sidebar.render());

    const main = document.createElement('div');
    main.className = 'main-content';

    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `<h2 class="header-title">Panel Administrativo</h2>`;
    main.appendChild(header);

    const content = document.createElement('main');
    content.style.padding = '2rem';

    // Stats específicos de admin
    const adminStats = document.createElement('div');
    adminStats.className = 'stats-grid';

    const stats = [
      { icon: icons.users, value: '12', label: 'Trabajadores Activos', color: 'primary' },
      { icon: icons.ticket, value: '156', label: 'Tickets Hoy', color: 'cyan' },
      { icon: icons.dollar, value: formatCurrency(this.stats?.todayRevenue || 0), label: 'Ingresos Totales', color: 'green' },
      { icon: icons.chart, value: '87%', label: 'Ocupación Promedio', color: 'orange' }
    ];

    stats.forEach(s => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <div class="stat-header">
          <div class="stat-icon ${s.color}">${s.icon}</div>
        </div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      `;
      adminStats.appendChild(card);
    });

    content.appendChild(adminStats);

    // Gráfico de ingresos semanales
    const chartCard = document.createElement('div');
    chartCard.className = 'card';
    chartCard.style.marginTop = '1.5rem';
    chartCard.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Ingresos Semanales</h3>
      <div style="height: 250px; display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem;">
        ${[45000, 52000, 48000, 61000, 58000, 72000, 65000].map((val, i) => {
          const max = 80000;
          const height = (val / max) * 100;
          const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
              <div style="width: 100%; height: ${height}%; background: linear-gradient(to top, var(--primary), var(--primary-light)); border-radius: 4px 4px 0 0; position: relative;">
                <span style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; font-weight: 600; color: var(--text-primary);">$${(val/1000).toFixed(0)}k</span>
              </div>
              <span style="font-size: 0.875rem; color: var(--text-muted);">${days[i]}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    content.appendChild(chartCard);

    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }
}