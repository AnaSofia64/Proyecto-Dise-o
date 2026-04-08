import { Sidebar } from '../components/Sidebar.js';
import { Header } from '../components/Header.js';
import { ticketApi, api } from '../api.js';
import { formatCurrency } from '../utils.js';

export class AttendantReportsPage {
  private container: HTMLDivElement;
  private tickets: any[] = [];
  private autoRelease: boolean = false;
  private pollInterval: number | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    try {
      const [active, pendingRelease] = await Promise.all([
      ticketApi.getActive() as Promise<any[]>,
      api.get<any[]>('/tickets/pending-release')
      ]);
        this.tickets = [...(active as any[]), ...(pendingRelease as any[])];
    } catch (e) {
      console.error('Error cargando tickets:', e);
    }

    const sidebar = new Sidebar();
    this.container.appendChild(sidebar.render());

    const main = document.createElement('div');
    main.className = 'main-content';

    const header = new Header({ title: 'Reportes' });
    main.appendChild(header.render());

    const content = document.createElement('main');
    content.style.padding = '2rem';

    // Toggle salida automática
    const toggleCard = document.createElement('div');
    toggleCard.className = 'card';
    toggleCard.style.marginBottom = '1.5rem';
    toggleCard.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem;">Salidas automáticas</h3>
          <p style="font-size: 0.875rem; color: var(--text-muted);">Libera la plaza automáticamente cuando el usuario paga</p>
        </div>
        <label style="position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;">
          <input type="checkbox" id="auto-release-toggle" ${this.autoRelease ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
          <span id="toggle-track" style="position: absolute; inset: 0; background: ${this.autoRelease ? 'var(--primary)' : 'var(--bg-input)'}; border-radius: 26px; transition: background 0.2s;">
            <span id="toggle-thumb" style="position: absolute; top: 3px; left: ${this.autoRelease ? '25px' : '3px'}; width: 20px; height: 20px; background: white; border-radius: 50%; transition: left 0.2s;"></span>
          </span>
        </label>
      </div>
    `;

    toggleCard.querySelector('#auto-release-toggle')?.addEventListener('change', (e) => {
      this.autoRelease = (e.target as HTMLInputElement).checked;
      const track = toggleCard.querySelector('#toggle-track') as HTMLElement;
      const thumb = toggleCard.querySelector('#toggle-thumb') as HTMLElement;
      track.style.background = this.autoRelease ? 'var(--primary)' : 'var(--bg-input)';
      thumb.style.left = this.autoRelease ? '25px' : '3px';
    });

    content.appendChild(toggleCard);

    // Tabla de tickets
    const tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.id = 'tickets-table-card';
    this.buildTable(tableCard);
    content.appendChild(tableCard);

    main.appendChild(content);
    this.container.appendChild(main);

    // Polling cada 10 segundos para ver tickets pagados
    this.pollInterval = window.setInterval(() => this.refresh(tableCard), 10000);

    return this.container;
  }

  private buildTable(card: HTMLElement): void {
    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600;">Tickets Activos</h3>
        <button id="btn-refresh" style="background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.4rem 0.9rem; cursor: pointer; font-size: 0.875rem; color: var(--text-secondary);">↻ Actualizar</button>
      </div>
      ${this.tickets.length === 0 ? `
        <p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay tickets activos en este momento</p>
      ` : `
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Plaza</th>
                <th>Entrada</th>
                <th>Estimado</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${this.tickets.map((t: any) => {
                const mins = Math.floor((Date.now() - new Date(t.entryTime).getTime()) / 60000);
                const amount = Math.ceil(mins / 60) * 3000;
                const isPaid = t.status === 'PAID';
                return `
                  <tr data-ticket-id="${t.id}">
                    <td style="font-family: monospace;">#${t.id.slice(-6)}</td>
                    <td>${t.vehicle?.licensePlate || '-'}</td>
                    <td>${t.vehicle?.type || '-'}</td>
                    <td style="color: var(--cyan);">${t.spot?.code || t.spotId || '-'}</td>
                    <td>${new Date(t.entryTime).toLocaleTimeString('es-CO')}</td>
                    <td style="color: var(--primary); font-weight: 600;">${formatCurrency(amount)}</td>
                    <td>
                      <span style="padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;
                        background: ${isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)'};
                        color: ${isPaid ? 'var(--green)' : 'var(--cyan)'};">
                        ${isPaid ? 'Pagado' : 'Activo'}
                      </span>
                    </td>
                    <td>
                      ${isPaid
                        ? `<button class="btn-release" data-id="${t.id}" style="background: var(--green); color: white; border: none; border-radius: var(--radius-md); padding: 0.35rem 0.75rem; cursor: pointer; font-size: 0.8rem; font-weight: 500;">Dar salida</button>`
                        : `<span style="color: var(--text-muted); font-size: 0.8rem;">Esperando pago</span>`
                      }
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    card.querySelector('#btn-refresh')?.addEventListener('click', () => this.refresh(card));
    this.attachReleaseListeners(card);
  }

  private attachReleaseListeners(card: HTMLElement): void {
    card.querySelectorAll('.btn-release').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id!;
        await this.releaseTicket(id, card);
      });
    });
  }

  private async releaseTicket(ticketId: string, card: HTMLElement): Promise<void> {
    try {
      await api.post(`/tickets/${ticketId}/release`, {});
      // Quitar de la lista
      this.tickets = this.tickets.filter(t => t.id !== ticketId);
      this.buildTable(card);
    } catch (e: any) {
      alert(e.message || 'Error al dar salida');
    }
  }

  private async refresh(card: HTMLElement): Promise<void> {
    try {
      const [active, pendingRelease] = await Promise.all([
        ticketApi.getActive() as Promise<any[]>,
        api.get<any[]>('/tickets/pending-release')
      ]);

      if (this.autoRelease) {
        // Dar salida automática a los pagados
        for (const t of pendingRelease) {
          try {
            await api.post(`/tickets/${t.id}/release`, {});
          } catch { /* ignorar si ya fue liberado */ }
        }
        this.tickets = active;
      } else {
        // Mostrar activos + pagados pendientes juntos
        this.tickets = [...active, ...pendingRelease];
      }

      this.buildTable(card);
    } catch (e) {
      console.error('Error actualizando tickets:', e);
    }
  }
}