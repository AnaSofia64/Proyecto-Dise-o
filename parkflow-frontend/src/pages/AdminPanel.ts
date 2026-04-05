import { Sidebar } from '../components/Sidebar.js';
import { spotApi, ticketApi } from '../api.js';
import { formatCurrency } from '../utils.js';

const icons = {
  users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  ticket: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>`,
  dollar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  chart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
};

export class AdminPanel {
  private container: HTMLDivElement;
  private stats: any = null;
  private activeTickets: any[] = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    try {
      const [stats, tickets] = await Promise.all([
        spotApi.getStats(),
        ticketApi.getActive()
      ]);
      this.stats = stats;
      this.activeTickets = tickets as any[];
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

    const adminStats = document.createElement('div');
    adminStats.className = 'stats-grid';

    const occupancyRate = this.stats?.occupancyRate?.toFixed(1) || '0';
    const occupied = this.stats?.occupiedSpots || 0;
    const total = this.stats?.totalSpots || 0;
    const activeCount = this.activeTickets.length;

    const statsData = [
      { icon: icons.users, value: `${occupied}/${total}`, label: 'Plazas Ocupadas', color: 'primary' },
      { icon: icons.ticket, value: String(activeCount), label: 'Tickets Activos', color: 'cyan' },
      { icon: icons.dollar, value: formatCurrency(this.stats?.todayRevenue || 0), label: 'Ingresos Hoy', color: 'green' },
      { icon: icons.chart, value: `${occupancyRate}%`, label: 'Ocupación Actual', color: 'orange' }
    ];

    statsData.forEach(s => {
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

    // Tabla de tickets activos
    const ticketsCard = document.createElement('div');
    ticketsCard.className = 'card';
    ticketsCard.style.marginTop = '1.5rem';
    ticketsCard.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Tickets Activos en el Sistema</h3>
      ${this.activeTickets.length === 0 ? `
        <p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay tickets activos</p>
      ` : `
        <table class="data-table">
          <thead>
            <tr><th>Ticket ID</th><th>Placa</th><th>Tipo</th><th>Plaza</th><th>Entrada</th><th>Celador</th></tr>
          </thead>
          <tbody>
            ${this.activeTickets.map((t: any) => `
              <tr>
                <td style="font-family: monospace;">#${t.id.slice(-6)}</td>
                <td>${t.vehicle?.licensePlate || t.licensePlate || '-'}</td>
                <td>${t.vehicle?.type || t.vehicleType || '-'}</td>
                <td style="color: var(--cyan);">${t.spot?.code || t.spotId || '-'}</td>
                <td style="color: var(--text-muted);">${new Date(t.entryTime).toLocaleTimeString('es-CO')}</td>
                <td style="color: var(--text-muted);">${t.createdBy || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    `;
    content.appendChild(ticketsCard);

    // Estado de plazas por tipo
    const spotsCard = document.createElement('div');
    spotsCard.className = 'card';
    spotsCard.style.marginTop = '1.5rem';
    spotsCard.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Estado del Parqueadero</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
        <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="font-size: 2rem; font-weight: 700; color: var(--primary);">${total}</p>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Total Plazas</p>
        </div>
        <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="font-size: 2rem; font-weight: 700; color: var(--green);">${total - occupied}</p>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Disponibles</p>
        </div>
        <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="font-size: 2rem; font-weight: 700; color: var(--red);">${occupied}</p>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Ocupadas</p>
        </div>
      </div>
    `;
    content.appendChild(spotsCard);

    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }
}