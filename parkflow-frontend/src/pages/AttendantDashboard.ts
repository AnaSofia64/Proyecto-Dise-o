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
  private allSpots: any[] = [];
  private refreshInterval: number | null = null;

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
    content.id = 'dashboard-content';
    content.style.padding = '2rem';

    await this.loadData();
    this.buildContent(content);

    main.appendChild(content);
    this.container.appendChild(main);

    // Auto-refresh cada 30 segundos
    this.refreshInterval = window.setInterval(async () => {
      await this.loadData();
      this.refreshDynamicSections();
    }, 30000);

    // Limpiar intervalo al navegar
    window.addEventListener('popstate', () => {
      if (this.refreshInterval) clearInterval(this.refreshInterval);
    }, { once: true });

    return this.container;
  }

  private buildContent(content: HTMLElement): void {
    content.innerHTML = '';

    const statsEl = this.renderStats();
    statsEl.id = 'stats-section';
    content.appendChild(statsEl);

    const grid = document.createElement('div');
    grid.id = 'grid-section';
    grid.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1.5rem;';
    grid.appendChild(this.renderChart());
    grid.appendChild(this.renderSpotStatus());
    content.appendChild(grid);

    const ticketsEl = this.renderRecentTickets();
    ticketsEl.id = 'tickets-section';
    content.appendChild(ticketsEl);
  }

  private refreshDynamicSections(): void {
    const content = document.getElementById('dashboard-content');
    if (!content) return;
    this.buildContent(content);
  }

  private async loadData(): Promise<void> {
    try {
      const [stats, tickets, spotsData] = await Promise.all([
        spotApi.getStats(),
        ticketApi.getActive(),
        spotApi.getAll()
      ]);
      this.stats = stats;
      this.tickets = Array.isArray(tickets) ? tickets.slice(0, 5) : [];
      // getAll retorna { available, occupied, spots: [...] }
      this.allSpots = (spotsData as any).spots || [];
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  private renderStats(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'stats-grid';

    const pendingPayments = this.tickets.filter((t: any) => t.status === 'PENDING').length;

    const statItems = [
      {
        icon: icons.car, iconClass: 'primary',
        value: `${Math.round(this.stats?.occupancyRate || 0)}%`,
        label: 'Ocupación',
        sublabel: `${this.stats?.occupiedSpots || 0}/${this.stats?.totalSpots || 0} plazas`,
        trend: '', trendUp: true
      },
      {
        icon: icons.clock, iconClass: 'cyan',
        value: String(this.stats?.activeTickets || 0),
        label: 'Tickets Activos',
        sublabel: 'En este momento',
        trend: '', trendUp: true
      },
      {
        icon: icons.dollar, iconClass: 'green',
        value: formatCurrency(this.stats?.todayRevenue || 0),
        label: 'Ingresos Hoy',
        sublabel: 'Total recaudado',
        trend: '', trendUp: true
      },
      {
        icon: icons.alert, iconClass: 'orange',
        value: String(pendingPayments),
        label: 'Pagos Pendientes',
        sublabel: 'Requieren atención',
        trend: '', trendUp: false
      }
    ];

    statItems.forEach(stat => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <div class="stat-header">
          <div class="stat-icon ${stat.iconClass}">${stat.icon}</div>
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

    const activeCount = this.tickets.length;
    const rate        = this.stats?.occupancyRate || 0;

    // Barras de ocupación por hora (simuladas con el dato real de hoy como ancla)
    const hours = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
    const profile = [10,20,35,55,70,80,75,65,60,70,80,85,75,55,35,20];
    const currentHour = new Date().getHours();

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600;">Ocupación por Hora</h3>
        <span style="font-size: 0.875rem; color: var(--text-muted);">Hoy — ${activeCount} activos ahora</span>
      </div>
      <div style="height: 180px; display: flex; align-items: flex-end; gap: 3px;">
        ${hours.map((h, i) => {
          const isNow = h === currentHour;
          // La hora actual usa el dato real del back, las demás son referenciales
          const heightPct = isNow ? Math.max(rate, 5) : profile[i];
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;">
              <div style="width: 100%; height: ${heightPct * 1.8}px;
                background: ${isNow ? 'var(--primary)' : 'var(--bg-input)'};
                border: ${isNow ? 'none' : '1px solid var(--border)'};
                border-radius: 3px 3px 0 0;
                transition: height 0.5s ease;"
                title="${h}:00 — ${isNow ? Math.round(rate) + '% (real)' : profile[i] + '% (ref)'}">
              </div>
              <span style="font-size: 0.6rem; color: ${isNow ? 'var(--primary)' : 'var(--text-muted)'};">${h}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 1rem; font-size: 0.75rem; color: var(--text-muted);">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <div style="width: 10px; height: 10px; background: var(--primary); border-radius: 2px;"></div>
          Dato real ahora
        </div>
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <div style="width: 10px; height: 10px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 2px;"></div>
          Referencial
        </div>
      </div>
    `;
    return card;
  }

    private renderSpotStatus(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    const total     = this.stats?.totalSpots     || 0;
    const occupied  = this.stats?.occupiedSpots  || 0;
    const available = this.stats?.availableSpots || 0;

    // Estimación por tipo basada en proporciones del back (5 carros, 2 motos, 1 truck, 1 handicap)
    const carTotal  = 5; const carOcc  = Math.min(occupied, carTotal);
    const motoTotal = 2; const motoOcc = Math.max(0, Math.min(occupied - carOcc, motoTotal));
    const truckTotal= 2; const truckOcc= Math.max(0, Math.min(occupied - carOcc - motoOcc, truckTotal));

    card.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Estado de Plazas</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
        ${[
          { type: 'Carros',  occupied: carOcc,   total: carTotal,   color: 'var(--primary)' },
          { type: 'Motos',   occupied: motoOcc,  total: motoTotal,  color: 'var(--cyan)'    },
          { type: 'Camiones',occupied: truckOcc, total: truckTotal, color: 'var(--orange)'  }
        ].map(s => {
          const pct = s.total > 0 ? (s.occupied / s.total) * 100 : 0;
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
      <div style="padding-top: 1rem; border-top: 1px solid var(--border); display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; text-align: center;">
        <div style="padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <p style="font-size: 1.25rem; font-weight: 700; color: var(--green);">${available}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Disponibles</p>
        </div>
        <div style="padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <p style="font-size: 1.25rem; font-weight: 700; color: var(--red);">${occupied}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Ocupadas</p>
        </div>
      </div>
    `;
    return card;
  }
  private renderRecentTickets(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = '1.5rem';

    const rows = this.tickets.map((t: any) => {
      const duration = Math.floor((Date.now() - new Date(t.entryTime).getTime()) / 60000);
      return `
        <tr>
          <td style="font-family: monospace;">#${t.id.slice(-6)}</td>
          <td>${t.vehicle?.licensePlate || t.vehicle?.id || '-'}</td>
          <td style="color: var(--text-muted);">${new Date(t.entryTime).toLocaleTimeString()}</td>
          <td style="color: var(--text-muted);">${formatDuration(duration)}</td>
          <td><span class="badge badge-success">Activo</span></td>
          <td><a href="/attendant/payment" data-link style="color: var(--primary); text-decoration: none; font-weight: 500;">Procesar Salida</a></td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No hay tickets activos</td></tr>';

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600;">Tickets Activos Recientes</h3>
        <a href="/attendant/entry" data-link style="color: var(--primary); text-decoration: none; font-size: 0.875rem; font-weight: 500;">Registrar entrada</a>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th><th>Placa</th><th>Entrada</th>
              <th>Tiempo</th><th>Estado</th><th>Acción</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    return card;
  }
}