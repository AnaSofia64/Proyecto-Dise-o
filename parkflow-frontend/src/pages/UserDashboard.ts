import { Sidebar } from '../components/Sidebar.js';
import { Header } from '../components/Header.js';
import { userApi } from '../api.js';
import { formatCurrency, formatDuration } from '../utils.js';
import { router } from '../router.js';

const icons = {
  car: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4h6v2"/></svg>`,
  map: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1,6 1,22 8,18 16,22 21,18 21,2 16,6 8,2 1,6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  ticket: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>`
};

export class UserDashboard {
  private container: HTMLDivElement;
  private tickets: any[] = [];
  private plates: string[] = [];
  private activeTicket: any = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    try {
      const [me, tickets] = await Promise.all([
        userApi.getMe(),
        userApi.getMyTickets()
      ]);
      this.plates = (me as any).licensePlates || [];
      this.tickets = tickets as any[];
      this.activeTicket = this.tickets.find((t: any) => t.status === 'ACTIVE');
    } catch (error) {
      console.error('Error cargando datos:', error);
    }

    const sidebar = new Sidebar();
    this.container.appendChild(sidebar.render());

    const main = document.createElement('div');
    main.className = 'main-content';

    const header = new Header({ title: 'Mi Parqueo' });
    main.appendChild(header.render());

    const content = document.createElement('main');
    content.style.padding = '2rem';

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 1000px; margin: 0 auto;';

    grid.appendChild(this.renderActiveParking());
    grid.appendChild(this.renderPlatesManager());

    content.appendChild(grid);
    content.appendChild(this.renderTicketHistory());

    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }

  private renderActiveParking(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    if (!this.activeTicket) {
      card.innerHTML = `
        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Parqueo Activo</h3>
        <div style="text-align: center; padding: 2rem;">
          <div style="width: 80px; height: 80px; background: var(--bg-input); border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
            ${icons.map}
          </div>
          <p style="font-weight: 600; margin-bottom: 0.5rem;">No tienes parqueo activo</p>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Registra tu placa y el celador te asignará una plaza</p>
        </div>
      `;
      return card;
    }

    const duration = Math.floor((Date.now() - new Date(this.activeTicket.entryTime).getTime()) / 60000);
    const amount = Math.ceil(duration / 60) * 3000;

    card.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Parqueo Activo</h3>
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width: 160px; height: 160px; margin: 0 auto 1rem; position: relative;">
          <svg viewBox="0 0 100 100" style="transform: rotate(-90deg); width: 100%; height: 100%;">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-input)" stroke-width="8"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" stroke-width="8"
              stroke-dasharray="283" stroke-dashoffset="${283 - (283 * Math.min(duration / 120, 1))}"
              stroke-linecap="round"/>
          </svg>
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-size: 1.75rem; font-weight: 700;">${Math.floor(duration / 60)}h ${duration % 60}m</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">tiempo</span>
          </div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.75rem;">Placa</p>
          <p style="font-weight: 600;">${this.activeTicket.vehicle?.licensePlate || this.activeTicket.licensePlate}</p>
        </div>
        <div style="padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.75rem;">Plaza</p>
          <p style="font-weight: 600; color: var(--cyan);">${this.activeTicket.spot?.code || this.activeTicket.spotId}</p>
        </div>
      </div>
      <div style="padding: 1rem; background: linear-gradient(135deg, var(--primary), var(--primary-light)); border-radius: var(--radius-md); text-align: center; margin-bottom: 1rem;">
        <p style="color: rgba(255,255,255,0.8); font-size: 0.75rem;">Estimado a pagar</p>
        <p style="color: white; font-size: 1.5rem; font-weight: 700;">${formatCurrency(amount)}</p>
      </div>
      <a href="/user/ticket" data-link class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none;">
        ${icons.ticket} Ver Ticket Completo
      </a>
    `;

    return card;
  }

  private renderPlatesManager(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h3');
    title.textContent = 'Mis Vehículos';
    title.style.cssText = 'font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;';
    card.appendChild(title);

    // Lista de placas
    const platesList = document.createElement('div');
    platesList.id = 'plates-list';
    platesList.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; min-height: 60px;';
    this.renderPlatesList(platesList);
    card.appendChild(platesList);

    // Formulario agregar placa
    const addForm = document.createElement('div');
    addForm.style.cssText = 'display: flex; gap: 0.5rem;';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input';
    input.placeholder = 'Ej: ABC123';
    input.maxLength = 7;
    input.style.cssText = 'flex: 1; text-transform: uppercase; letter-spacing: 0.1em;';
    input.oninput = () => { input.value = input.value.toUpperCase(); };

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary';
    addBtn.innerHTML = icons.plus;
    addBtn.style.padding = '0.5rem 1rem';
    addBtn.onclick = async () => {
      const plate = input.value.trim();
      if (!plate) return;
      addBtn.disabled = true;
      try {
        const result = await userApi.addPlate(plate) as any;
        this.plates = result.plates;
        input.value = '';
        this.renderPlatesList(platesList);
      } catch (e: any) {
        alert(e.message || 'Error al agregar placa');
      } finally {
        addBtn.disabled = false;
      }
    };

    addForm.appendChild(input);
    addForm.appendChild(addBtn);
    card.appendChild(addForm);

    const hint = document.createElement('p');
    hint.textContent = 'Registra las placas de tus vehículos para ver tus tickets automáticamente.';
    hint.style.cssText = 'font-size: 0.75rem; color: var(--text-muted); margin-top: 0.75rem;';
    card.appendChild(hint);

    return card;
  }

  private renderPlatesList(container: HTMLElement): void {
    container.innerHTML = '';
    if (this.plates.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem; text-align: center; padding: 1rem;">No tienes vehículos registrados</p>';
      return;
    }
    this.plates.forEach(plate => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: var(--bg-input); border-radius: var(--radius-md);';
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          ${icons.car}
          <span style="font-weight: 600; letter-spacing: 0.1em;">${plate}</span>
        </div>
        <button class="btn-icon" data-plate="${plate}" style="color: var(--red);">${icons.trash}</button>
      `;
      item.querySelector('button')?.addEventListener('click', async () => {
        try {
          const result = await userApi.removePlate(plate) as any;
          this.plates = result.plates;
          this.renderPlatesList(container);
        } catch (e: any) {
          alert(e.message || 'Error al eliminar placa');
        }
      });
      container.appendChild(item);
    });
  }

  private renderTicketHistory(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = '2rem';

    const paidTickets = this.tickets.filter((t: any) => t.status === 'PAID');

    card.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Historial de Tickets (últimos 30 días)</h3>
      ${paidTickets.length === 0 ? `
        <p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay tickets en el historial</p>
      ` : `
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Placa</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${paidTickets.map((t: any) => `
              <tr>
                <td style="font-family: monospace;">#${t.id.slice(-6)}</td>
                <td>${t.vehicle?.licensePlate || t.licensePlate}</td>
                <td style="color: var(--text-muted);">${new Date(t.entryTime).toLocaleString('es-CO')}</td>
                <td style="color: var(--text-muted);">${t.exitTime ? new Date(t.exitTime).toLocaleString('es-CO') : '-'}</td>
                <td style="color: var(--primary); font-weight: 600;">${formatCurrency(t.amount)}</td>
                <td><span class="badge badge-success">Pagado</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    `;

    return card;
  }
}