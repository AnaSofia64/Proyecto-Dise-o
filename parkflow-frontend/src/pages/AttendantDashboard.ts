import { Sidebar } from '../components/Sidebar.js';
import { Header } from '../components/Header.js';
import { spotApi, ticketApi } from '../api.js';
import { formatCurrency, formatDuration } from '../utils.js';

const icons = {
  car: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`,
  clock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`,
  dollar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  alert: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};

export class AttendantDashboard {
  private container: HTMLDivElement;
  private stats: any = null;
  private tickets: any[] = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    const sidebar = new Sidebar();
    this.container.appendChild(sidebar.render());

    const main = document.createElement('div');
    main.className = 'main-content';

    const header = new Header({ title: 'Panel de Control' });
    main.appendChild(header.render());

    const content = document.createElement('main');
    content.style.padding = '2rem';

    await this.loadData();

    content.appendChild(this.renderStats());

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1.5rem;';

    grid.appendChild(this.renderChart());
    grid.appendChild(this.renderSpotStatus());

    content.appendChild(grid);
    content.appendChild(this.renderRecentTickets());

    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }

  private async loadData(): Promise<void> {
    try {
      const [stats, tickets] = await Promise.all([
        spotApi.getStats(),
        ticketApi.getActive()
      ]);
      this.stats = stats;
      this.tickets = tickets.slice(0, 5);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  private renderStats(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'stats-grid';

    const stats = [
      {
        icon: icons.car,
        iconClass: 'primary',
        value: `${this.stats?.occupancyRate || 0}%`,
        label: 'Ocupación',
        sublabel: `${this.stats?.occupiedSpots || 0}/${this.stats?.totalSpots || 0} plazas`,
        trend: '+5%',
        trendUp: true
      },
      {
        icon: icons.clock,
        iconClass: 'cyan',
        value: String(this.stats?.activeTickets || 0),
        label: 'Tickets Activos',
        sublabel: 'En este momento',
        trend: '+12%',
        trendUp: true
      },
      {
        icon: icons.dollar,
        iconClass: 'green',
        value: formatCurrency(this.stats?.todayRevenue || 0),
        label: 'Ingresos Hoy',
        sublabel: 'Total recaudado',
        trend: '+8%',
        trendUp: true
      },
      {
        icon: icons.alert,
        iconClass: 'orange',
        value: '3',
        label: 'Pagos Pendientes',
        sublabel: 'Requieren atención',
        trend: '-2',
        trendUp: false
      }
    ];

    stats.forEach(stat => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <div class="stat-header">
          <div class="stat-icon ${stat.iconClass}">
            ${stat.icon}
          </div>
          <span class="stat-trend ${stat.trendUp ? 'up' : 'down'}">
            ${stat.trendUp ? '↑' : '↓'} ${stat.trend}
          </span>
        </div>
        <div class="stat-value">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
        <div class="stat-sublabel">${stat.sublabel}</div>
      `;
      grid.appendChild(card);
    });

    return grid;
  }

  private renderChart(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600;">Ocupación por Hora</h3>
        <select style="background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.5rem 0.75rem; color: var(--text-secondary); font-size: 0.875rem;">
          <option>Hoy</option>
          <option>Esta semana</option>
        </select>
      </div>
      <div style="height: 200px; display: flex; align-items: flex-end; justify-content: space-between; gap: 0.5rem;">
        ${[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <div style="width: 100%; height: ${h * 2}px; background: linear-gradient(to top, var(--primary), var(--primary-light)); border-radius: 4px 4px 0 0; opacity: 0.8;"></div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${i + 8}h</span>
          </div>
        `).join('')}
      </div>
    `;
    return card;
  }

  private renderSpotStatus(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Estado de Plazas</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
        ${[
          { type: 'Carros', occupied: 15, total: 20, color: 'var(--primary)' },
          { type: 'Motos', occupied: 8, total: 12, color: 'var(--cyan)' },
          { type: 'Buses', occupied: 2, total: 5, color: 'var(--orange)' }
        ].map(s => {
          const pct = (s.occupied / s.total) * 100;
          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
                <span style="color: var(--text-secondary);">${s.type}</span>
                <span style="color: var(--text-muted);">${s.occupied}/${s.total}</span>
              </div>
              <div style="height: 8px; background: var(--bg-input); border-radius: 4px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: ${s.color}; border-radius: 4px; transition: width 0.5s ease;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="padding-top: 1.5rem; border-top: 1px solid var(--border);">
        <h4 style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.75rem;">Leyenda</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 12px; height: 12px; background: var(--green); border-radius: 50%;"></div>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Disponible</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 12px; height: 12px; background: var(--red); border-radius: 50%;"></div>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Ocupado</span>
          </div>
        </div>
      </div>
    `;
    return card;
  }

  private renderRecentTickets(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = '1.5rem';

    const table = document.createElement('div');
    table.className = 'table-container';

    table.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600;">Tickets Activos Recientes</h3>
        <a href="/attendant/entry" data-link style="color: var(--primary); text-decoration: none; font-size: 0.875rem; font-weight: 500;">Ver todos</a>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Placa</th>
            <th>Entrada</th>
            <th>Tiempo</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${this.tickets.map(t => {
            const duration = Math.floor((Date.now() - new Date(t.entryTime).getTime()) / 60000);
            return `
              <tr>
                <td style="font-family: monospace;">#${t.id.slice(-6)}</td>
                <td>${t.vehicle.licensePlate}</td>
                <td style="color: var(--text-muted);">${new Date(t.entryTime).toLocaleTimeString()}</td>
                <td style="color: var(--text-muted);">${formatDuration(duration)}</td>
                <td><span class="badge badge-success">Activo</span></td>
                <td><a href="/attendant/payment?ticket=${t.id}" data-link style="color: var(--primary); text-decoration: none; font-weight: 500;">Procesar Salida</a></td>
              </tr>
            `;
          }).join('') || '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No hay tickets activos</td></tr>'}
        </tbody>
      </table>
    `;

    card.appendChild(table);
    return card;
  }
}