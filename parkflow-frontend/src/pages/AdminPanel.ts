import { Sidebar } from '../components/Sidebar.js';
import { spotApi } from '../api.js';
import { api } from '../api.js';
import { formatCurrency } from '../utils.js';

const icons = {
  users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  ticket: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>`,
  dollar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  chart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`
};

export class AdminPanel {
  private container: HTMLDivElement;
  private stats: any = null;
  private workers: any[] = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    try {
      [this.stats, this.workers] = await Promise.all([
        spotApi.getStats(),
        api.get<any[]>('/auth/workers')
      ]);
    } catch (error) {
      console.error('Error cargando datos admin:', error);
      this.workers = [];
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

    // Stats
    const adminStats = document.createElement('div');
    adminStats.className = 'stats-grid';

    const statsData = [
      { icon: icons.users,  value: String(this.workers.length), label: 'Celadores Activos', color: 'primary' },
      { icon: icons.ticket, value: String(this.stats?.occupiedSpots || 0),  label: 'Vehículos Actuales', color: 'cyan' },
      { icon: icons.dollar, value: formatCurrency(this.stats?.todayRevenue || 0), label: 'Ingresos del Día', color: 'green' },
      { icon: icons.chart,  value: `${Math.round(this.stats?.occupancyRate || 0)}%`, label: 'Ocupación Actual', color: 'orange' }
    ];

    statsData.forEach(s => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <div class="stat-header"><div class="stat-icon ${s.color}">${s.icon}</div></div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      `;
      adminStats.appendChild(card);
    });
    content.appendChild(adminStats);

    // Grid: gráfico + gestión de celadores
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;';
    grid.appendChild(this.renderChart());
    grid.appendChild(this.renderWorkersPanel());
    content.appendChild(grid);

    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }

  private renderChart(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    const total = this.stats?.totalSpots || 9;
    const occupied = this.stats?.occupiedSpots || 0;
    const available = this.stats?.availableSpots || total;

    card.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Estado del Parqueadero</h3>
      <div style="display: flex; align-items: center; justify-content: center; gap: 2rem; margin-bottom: 1.5rem;">
        <div style="position: relative; width: 140px; height: 140px;">
          <svg viewBox="0 0 36 36" style="transform: rotate(-90deg); width: 140px; height: 140px;">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-input)" stroke-width="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--primary)" stroke-width="3"
              stroke-dasharray="${total > 0 ? (occupied/total)*100 : 0} 100"
              stroke-linecap="round"/>
          </svg>
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-size: 1.75rem; font-weight: 700;">${Math.round(this.stats?.occupancyRate || 0)}%</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">ocupación</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 12px; height: 12px; background: var(--primary); border-radius: 2px;"></div>
            <span style="font-size: 0.875rem;">Ocupadas: <strong>${occupied}</strong></span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 12px; height: 12px; background: var(--green); border-radius: 2px;"></div>
            <span style="font-size: 0.875rem;">Libres: <strong>${available}</strong></span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 12px; height: 12px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 2px;"></div>
            <span style="font-size: 0.875rem;">Total: <strong>${total}</strong></span>
          </div>
        </div>
      </div>
      <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
        <p style="font-size: 0.875rem; color: var(--text-muted);">Tarifa estándar</p>
        <p style="font-size: 1.25rem; font-weight: 600; color: var(--primary);">${formatCurrency(3000)} / hora</p>
      </div>
    `;
    return card;
  }

  private renderWorkersPanel(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'workers-panel';
    this.buildWorkersPanel(card);
    return card;
  }

  private buildWorkersPanel(card: HTMLElement): void {
    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600;">Celadores</h3>
        <button id="btn-show-form" style="display: flex; align-items: center; gap: 0.5rem; background: var(--primary); color: white; border: none; border-radius: var(--radius-md); padding: 0.5rem 1rem; cursor: pointer; font-size: 0.875rem; font-weight: 500;">
          ${icons.plus} Nuevo Celador
        </button>
      </div>

      <div id="create-form" style="display: none; margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border);">
        <p style="font-weight: 600; margin-bottom: 1rem; font-size: 0.875rem;">Crear nuevo celador</p>
        <input id="worker-name" type="text" placeholder="Nombre completo" class="input" style="margin-bottom: 0.75rem; width: 100%; box-sizing: border-box;"/>
        <input id="worker-user" type="text" placeholder="Usuario (ej: celador2)" class="input" style="margin-bottom: 0.75rem; width: 100%; box-sizing: border-box;"/>
        <input id="worker-pass" type="password" placeholder="Contraseña" class="input" style="margin-bottom: 1rem; width: 100%; box-sizing: border-box;"/>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-create-worker" style="flex: 1; background: var(--primary); color: white; border: none; border-radius: var(--radius-md); padding: 0.75rem; cursor: pointer; font-weight: 500;">Crear</button>
          <button id="btn-cancel-form" style="flex: 1; background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem; cursor: pointer;">Cancelar</button>
        </div>
        <p id="form-error" style="color: var(--red); font-size: 0.8rem; margin-top: 0.5rem; display: none;"></p>
      </div>

      <div id="workers-list" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 280px; overflow-y: auto;">
        ${this.workers.map(w => this.workerRow(w)).join('')}
        ${this.workers.length === 0 ? '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No hay celadores registrados</p>' : ''}
      </div>
    `;

    // Toggle form
    card.querySelector('#btn-show-form')?.addEventListener('click', () => {
      const form = card.querySelector('#create-form') as HTMLElement;
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    card.querySelector('#btn-cancel-form')?.addEventListener('click', () => {
      (card.querySelector('#create-form') as HTMLElement).style.display = 'none';
    });

    // Crear worker
    card.querySelector('#btn-create-worker')?.addEventListener('click', async () => {
      const fullName = (card.querySelector('#worker-name') as HTMLInputElement).value.trim();
      const username = (card.querySelector('#worker-user') as HTMLInputElement).value.trim();
      const password = (card.querySelector('#worker-pass') as HTMLInputElement).value.trim();
      const errorEl = card.querySelector('#form-error') as HTMLElement;

      if (!fullName || !username || !password) {
        errorEl.textContent = 'Todos los campos son obligatorios';
        errorEl.style.display = 'block';
        return;
      }

      try {
        await api.post<any>('/auth/register', { 
          fullName, username, email: `${username}@parkflow.com`, password, role: 'ATTENDANT'
        });
       
        this.workers.push({ username, fullName, role: 'ATTENDANT' });
        // Actualizar lista
        const list = card.querySelector('#workers-list') as HTMLElement;
        list.innerHTML = this.workers.map(w => this.workerRow(w)).join('');
        this.attachDeleteListeners(card);
        // Ocultar form y limpiar
        (card.querySelector('#create-form') as HTMLElement).style.display = 'none';
        (card.querySelector('#worker-name') as HTMLInputElement).value = '';
        (card.querySelector('#worker-user') as HTMLInputElement).value = '';
        (card.querySelector('#worker-pass') as HTMLInputElement).value = '';
        errorEl.style.display = 'none';
        // Actualizar stat
        const statVal = this.container.querySelector('.stat-value');
        if (statVal) statVal.textContent = String(this.workers.length);
      } catch (e: any) {
        errorEl.textContent = e.message || 'Error al crear celador';
        errorEl.style.display = 'block';
      }
    });

    this.attachDeleteListeners(card);
  }

  private workerRow(w: any): string {
    const isBase = w.username === 'celador';
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md);" data-username="${w.username}">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 36px; height: 36px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.875rem;">
            ${w.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style="font-weight: 500; font-size: 0.875rem;">${w.fullName}</p>
            <p style="color: var(--text-muted); font-size: 0.75rem;">@${w.username}</p>
          </div>
        </div>
        ${isBase ? '<span style="font-size: 0.75rem; color: var(--text-muted);">Base</span>' :
          `<button class="btn-delete-worker" data-username="${w.username}" style="background: none; border: none; color: var(--red); cursor: pointer; padding: 0.25rem;">${icons.trash}</button>`
        }
      </div>
    `;
  }

  private attachDeleteListeners(card: HTMLElement): void {
    card.querySelectorAll('.btn-delete-worker').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const username = (e.currentTarget as HTMLElement).dataset.username!;
        if (!confirm(`¿Eliminar al celador @${username}?`)) return;
        try {
          await api.delete(`/auth/workers/${username}`);
          this.workers = this.workers.filter(w => w.username !== username);
          const list = card.querySelector('#workers-list') as HTMLElement;
          list.innerHTML = this.workers.map(w => this.workerRow(w)).join('');
          this.attachDeleteListeners(card);
        } catch (e) {
          alert('Error al eliminar celador');
        }
      });
    });
  }
}