import { Sidebar } from '../components/Sidebar.js';
import { Header } from '../components/Header.js';
import { ticketApi } from '../api.js';
import { formatDuration, formatCurrency } from '../utils.js';

const icons = {
  clock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`,
  dollar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  map: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1,6 1,22 8,18 16,22 21,18 21,2 16,6 8,2 1,6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`
};

export class UserDashboard {
  private container: HTMLDivElement;
  private activeTicket: any = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    try {
      const tickets = await ticketApi.getUserTickets();
      this.activeTicket = tickets.find((t: any) => t.status === 'ACTIVE');
    } catch (error) {
      console.error('Error cargando tickets:', error);
    }

    const sidebar = new Sidebar();
    this.container.appendChild(sidebar.render());

    const main = document.createElement('div');
    main.className = 'main-content';

    const header = new Header({ title: 'Mi Parqueo' });
    main.appendChild(header.render());

    const content = document.createElement('main');
    content.style.padding = '2rem';

    if (this.activeTicket) {
      content.appendChild(this.renderActiveParking());
    } else {
      content.appendChild(this.renderNoActiveParking());
    }

    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }

  private renderActiveParking(): HTMLElement {
    const duration = Math.floor((Date.now() - new Date(this.activeTicket.entryTime).getTime()) / 60000);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.style.maxWidth = '500px';
    card.style.margin = '0 auto';

    card.innerHTML = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="width: 200px; height: 200px; margin: 0 auto 1.5rem; position: relative;">
          <svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-input)" stroke-width="8"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" stroke-width="8" 
              stroke-dasharray="283" stroke-dashoffset="${283 - (283 * Math.min(duration / 120, 1))}" 
              stroke-linecap="round"/>
          </svg>
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-size: 3rem; font-weight: 700;">${Math.floor(duration / 60)}h ${duration % 60}m</span>
            <span style="color: var(--text-muted);">Tiempo de parqueo</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
        <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.875rem;">Placa</p>
          <p style="font-size: 1.25rem; font-weight: 600; letter-spacing: 0.05em;">${this.activeTicket.vehicle.licensePlate}</p>
        </div>
        <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.875rem;">Plaza</p>
          <p style="font-size: 1.25rem; font-weight: 600; color: var(--cyan);">${this.activeTicket.spot.code}</p>
        </div>
      </div>

      <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-muted);">Tarifa por hora</span>
          <span>${formatCurrency(this.activeTicket.spot.hourlyRate || 3000)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.125rem; font-weight: 600;">
          <span>Estimado actual</span>
          <span style="color: var(--primary);">${formatCurrency(Math.ceil(duration / 60) * (this.activeTicket.spot.hourlyRate || 3000))}</span>
        </div>
      </div>

      <a href="/user/ticket" data-link class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none;">
        ${icons.dollar} Ver Ticket y Pagar
      </a>
    `;

    return card;
  }

  private renderNoActiveParking(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.maxWidth = '400px';
    card.style.margin = '4rem auto';
    card.style.textAlign = 'center';

    card.innerHTML = `
      <div style="width: 100px; height: 100px; background: var(--bg-input); border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
        ${icons.map}
      </div>
      <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">No tienes parqueo activo</h3>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Escanea el código QR en la entrada del parqueadero para iniciar tu sesión de parqueo.</p>
      <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); border: 2px dashed var(--border);">
        <p style="color: var(--text-muted); font-size: 0.875rem;">Ubicación del parqueadero</p>
        <p style="font-weight: 500;">Parqueadero Central - Calle 123 #45-67</p>
      </div>
    `;

    return card;
  }
}