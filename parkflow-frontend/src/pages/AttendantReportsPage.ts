import { Sidebar } from '../components/Sidebar.js';
import { Header } from '../components/Header.js';
import { ticketApi } from '../api.js';
import { formatCurrency } from '../utils.js';

export class AttendantReportsPage {
  private container: HTMLDivElement;
  private tickets: any[] = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    try {
      this.tickets = await ticketApi.getActive() as any[];
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

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Tickets Activos</h3>
      ${this.tickets.length === 0 ? `
        <p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay tickets activos en este momento</p>
      ` : `
        <table class="data-table">
          <thead>
            <tr><th>Ticket</th><th>Placa</th><th>Tipo</th><th>Plaza</th><th>Entrada</th><th>Estimado</th></tr>
          </thead>
          <tbody>
            ${this.tickets.map((t: any) => {
              const mins = Math.floor((Date.now() - new Date(t.entryTime).getTime()) / 60000);
              const amount = Math.ceil(mins / 60) * 3000;
              return `
                <tr>
                  <td style="font-family: monospace;">#${t.id.slice(-6)}</td>
                  <td>${t.vehicle?.licensePlate || '-'}</td>
                  <td>${t.vehicle?.type || '-'}</td>
                  <td style="color: var(--cyan);">${t.spot?.code || t.spotId || '-'}</td>
                  <td>${new Date(t.entryTime).toLocaleTimeString('es-CO')}</td>
                  <td style="color: var(--primary); font-weight: 600;">${formatCurrency(amount)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `}
    `;
    content.appendChild(card);
    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }
}