import { Sidebar } from '../components/Sidebar.js';
import { ticketApi } from '../api.js';
import { storage, formatCurrency, formatDuration } from '../utils.js';

export class TicketPage {
  private container: HTMLDivElement;
  private ticket: any = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    this.ticket = storage.get('current_ticket');
    
    if (!this.ticket) {
      try {
        const tickets = await ticketApi.getUserTickets();
        this.ticket = tickets.find((t: any) => t.status === 'ACTIVE');
      } catch (error) {
        console.error('Error:', error);
      }
    }

    const sidebar = new Sidebar();
    this.container.appendChild(sidebar.render());

    const main = document.createElement('div');
    main.className = 'main-content';

    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `<h2 class="header-title">Ticket & Pago</h2>`;
    main.appendChild(header);

    const content = document.createElement('main');
    content.style.cssText = 'padding: 2rem; display: flex; justify-content: center;';

    if (this.ticket) {
      content.appendChild(this.renderTicketCard());
    } else {
      content.innerHTML = '<div class="card">No hay ticket activo</div>';
    }

    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }

  private renderTicketCard(): HTMLElement {
    const duration = Math.floor((Date.now() - new Date(this.ticket.entryTime).getTime()) / 60000);
    const amount = Math.ceil(duration / 60) * (this.ticket.spot.hourlyRate || 3000);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.maxWidth = '400px';
    card.style.width = '100%';

    card.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <span class="badge badge-success">Activo</span>
      </div>

      <div class="qr-container" style="margin-bottom: 1.5rem;">
        <div class="qr-code">
          <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="#0a0e27" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            <rect x="6" y="6" width="1" height="1" fill="#0a0e27"/><rect x="17" y="6" width="1" height="1" fill="#0a0e27"/>
            <rect x="17" y="17" width="1" height="1" fill="#0a0e27"/><rect x="6" y="17" width="1" height="1" fill="#0a0e27"/>
          </svg>
        </div>
        <div class="qr-info">
          <p class="qr-label">Ticket ID</p>
          <p class="qr-value">#${this.ticket.id.slice(-8)}</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Vehículo</span>
          <span style="font-weight: 500;">${this.ticket.vehicle.licensePlate}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Entrada</span>
          <span>${new Date(this.ticket.entryTime).toLocaleTimeString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Duración</span>
          <span style="color: var(--cyan); font-weight: 500;">${formatDuration(duration)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Pago</span>
          <span style="font-weight: 700; color: var(--primary);">${formatCurrency(amount)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary" style="flex: 1;">Pre-pagar</button>
        <button class="btn btn-primary" style="flex: 1;">Verificar</button>
      </div>
    `;

    return card;
  }
}