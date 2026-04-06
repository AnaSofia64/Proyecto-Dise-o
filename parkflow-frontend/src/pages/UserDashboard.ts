import { Sidebar } from '../components/Sidebar.js';
import { Header } from '../components/Header.js';
import { ticketApi } from '../api.js';
import { formatCurrency } from '../utils.js';

const icons = {
  clock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`,
  dollar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  map: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1,6 1,22 8,18 16,22 21,18 21,2 16,6 8,2 1,6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  pin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
};

export class UserDashboard {
  private container: HTMLDivElement;
  private activeTicket: any = null;
  private timerInterval: number | null = null;

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
    content.style.cssText = 'padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;';

    if (this.activeTicket) {
      content.appendChild(this.renderActiveParking());
    } else {
      content.appendChild(this.renderNoActiveParking());
    }

    content.appendChild(this.renderMap());

    main.appendChild(content);
    this.container.appendChild(main);

    if (this.activeTicket) {
      this.startTimer();
    }

    return this.container;
  }

  private renderActiveParking(): HTMLElement {
    const entryTime = new Date(this.activeTicket.entryTime).getTime();

    const card = document.createElement('div');
    card.className = 'card';
    card.style.maxWidth = '500px';

    card.innerHTML = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="width: 180px; height: 180px; margin: 0 auto 1.5rem; position: relative;">
          <svg viewBox="0 0 100 100" style="transform: rotate(-90deg); width: 180px; height: 180px;">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-input)" stroke-width="8"/>
            <circle id="timer-ring" cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" stroke-width="8"
              stroke-dasharray="283" stroke-dashoffset="283" stroke-linecap="round"/>
          </svg>
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span id="timer-display" style="font-size: 2.25rem; font-weight: 700;">0h 0m</span>
            <span style="color: var(--text-muted); font-size: 0.8rem;">Tiempo de parqueo</span>
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
          <span id="cost-display" style="color: var(--primary);">${formatCurrency(0)}</span>
        </div>
      </div>

      <a href="/user/ticket" data-link class="btn btn-primary"
        style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none;">
        ${icons.dollar} Ver Ticket y Pagar
      </a>
    `;

    // Guardar entryTime para el timer
    (card as any)._entryTime = entryTime;

    return card;
  }

  private startTimer(): void {
    const entryTime = new Date(this.activeTicket.entryTime).getTime();
    const hourlyRate = this.activeTicket.spot?.hourlyRate || 3000;

    const update = () => {
      const minutes = Math.floor((Date.now() - entryTime) / 60000);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      const timerDisplay = document.getElementById('timer-display');
      const costDisplay = document.getElementById('cost-display');
      const timerRing = document.getElementById('timer-ring');

      if (timerDisplay) timerDisplay.textContent = `${hours}h ${mins}m`;
      if (costDisplay) costDisplay.textContent = formatCurrency(Math.ceil(minutes / 60) * hourlyRate);
      if (timerRing) {
        const offset = 283 - (283 * Math.min(minutes / 120, 1));
        timerRing.setAttribute('stroke-dashoffset', String(offset));
      }
    };

    update();
    this.timerInterval = window.setInterval(update, 1000);
  }

  private renderNoActiveParking(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'max-width: 500px; text-align: center;';

    card.innerHTML = `
      <div style="width: 80px; height: 80px; background: var(--bg-input); border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
        ${icons.map}
      </div>
      <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">No tienes parqueo activo</h3>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Pídele al celador que registre tu entrada o escanea el QR en la entrada.</p>
      <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); border: 2px dashed var(--border);">
        <p style="color: var(--text-muted); font-size: 0.875rem;">Ubicación del parqueadero</p>
        <p style="font-weight: 500;">Parqueadero Central — Calle 123 #45-67</p>
      </div>
    `;

    return card;
  }

  private renderMap(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.maxWidth = '500px';

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
        <span style="color: var(--primary);">${icons.pin}</span>
        <h3 style="font-size: 1.125rem; font-weight: 600;">Ubicación del Parqueadero</h3>
      </div>

      <div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin-bottom: 1rem;">
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=-74.0700%2C4.6200%2C-74.0500%2C4.6400&layer=mapnik&marker=4.6300%2C-74.0600"
          width="100%"
          height="220"
          style="border: none; display: block;"
          loading="lazy"
          title="Ubicación del parqueadero">
        </iframe>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <span style="color: var(--text-muted); font-size: 0.875rem;">Dirección</span>
          <span style="font-weight: 500; font-size: 0.875rem;">Calle 123 #45-67, Bogotá</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <span style="color: var(--text-muted); font-size: 0.875rem;">Horario</span>
          <span style="font-weight: 500; font-size: 0.875rem;">Lun–Sáb 6:00am–10:00pm</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <span style="color: var(--text-muted); font-size: 0.875rem;">Teléfono</span>
          <span style="font-weight: 500; font-size: 0.875rem;">+57 601 234 5678</span>
        </div>
      </div>
    `;

    return card;
  }
}