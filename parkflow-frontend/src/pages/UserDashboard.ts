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
    
    content.appendChild(this.renderPlatesSection());

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

  private renderPlatesSection(): HTMLElement {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.maxWidth = '500px';
  card.id = 'plates-card';

  this.buildPlatesCard(card);
  return card;
}

private async buildPlatesCard(card: HTMLElement): Promise<void> {
  let plates: any[] = [];
  try {
    const me = await (await import('../api.js')).userApi.getMe() as any;
    plates = me.licensePlates || [];
  } catch (e) {
    console.error('Error cargando placas:', e);
  }

  card.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <h3 style="font-size: 1.125rem; font-weight: 600;">Mis Vehículos</h3>
      <button id="btn-show-plate-form" style="background: var(--primary); color: white; border: none; border-radius: var(--radius-md); padding: 0.4rem 0.9rem; cursor: pointer; font-size: 0.875rem; font-weight: 500;">+ Agregar</button>
    </div>

    <div id="plate-form" style="display: none; margin-bottom: 1.25rem; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border);">
      <input id="plate-input" type="text" class="input" placeholder="Placa (ej: ABC123)" style="margin-bottom: 0.75rem; width: 100%; box-sizing: border-box; text-transform: uppercase;"/>
      <select id="type-input" class="input" style="margin-bottom: 0.75rem; width: 100%; box-sizing: border-box;">
        <option value="">Tipo de vehículo</option>
        <option value="CAR">Carro</option>
        <option value="MOTORCYCLE">Moto</option>
        <option value="TRUCK">Camión</option>
      </select>
      <div id="plate-error" style="display: none; color: var(--red); font-size: 0.8rem; margin-bottom: 0.5rem;"></div>
      <div style="display: flex; gap: 0.5rem;">
        <button id="btn-save-plate" style="flex: 1; background: var(--primary); color: white; border: none; border-radius: var(--radius-md); padding: 0.6rem; cursor: pointer; font-weight: 500;">Guardar</button>
        <button id="btn-cancel-plate" style="flex: 1; background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.6rem; cursor: pointer;">Cancelar</button>
      </div>
    </div>

    <div id="plates-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
      ${plates.length === 0
        ? `<p style="color: var(--text-muted); text-align: center; padding: 1rem; font-size: 0.875rem;">No tienes vehículos registrados</p>`
        : plates.map((p: any) => this.plateRow(p)).join('')
      }
    </div>
  `;

  // Toggle form
  card.querySelector('#btn-show-plate-form')?.addEventListener('click', () => {
    const form = card.querySelector('#plate-form') as HTMLElement;
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  card.querySelector('#btn-cancel-plate')?.addEventListener('click', () => {
    (card.querySelector('#plate-form') as HTMLElement).style.display = 'none';
  });

  // Guardar placa
  card.querySelector('#btn-save-plate')?.addEventListener('click', async () => {
    const plate = ((card.querySelector('#plate-input') as HTMLInputElement).value).toUpperCase().trim();
    const vehicleType = (card.querySelector('#type-input') as HTMLSelectElement).value;
    const errorEl = card.querySelector('#plate-error') as HTMLElement;

    if (!plate || !vehicleType) {
      errorEl.textContent = 'Completa todos los campos';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const { userApi } = await import('../api.js');
      await userApi.addPlate(plate, vehicleType);
      // Reconstruir card
      this.buildPlatesCard(card);
    } catch (e: any) {
      errorEl.textContent = e.message || 'Error al guardar';
      errorEl.style.display = 'block';
    }
  });

  // Eliminar placa
  this.attachPlateDeleteListeners(card);
}

private plateRow(p: any): string {
  const typeLabel: Record<string, string> = { CAR: 'Carro', MOTORCYCLE: 'Moto', TRUCK: 'Camión' };
  return `
    <div style="background: var(--bg-input); border-radius: var(--radius-md); padding: 0.75rem;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 36px; height: 36px; background: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1rem;">🚗</div>
          <div>
            <p style="font-weight: 600; letter-spacing: 0.05em;">${p.plate}</p>
            <p style="color: var(--text-muted); font-size: 0.75rem;">${typeLabel[p.vehicleType] || p.vehicleType}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="btn-show-qr" data-plate="${p.plate}" data-type="${p.vehicleType}"
            style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.35rem 0.7rem; cursor: pointer; font-size: 0.75rem; color: var(--text-secondary);">
            📱 QR
          </button>
          <button class="btn-delete-plate" data-plate="${p.plate}"
            style="background: none; border: none; color: var(--red); cursor: pointer; font-size: 1.25rem; padding: 0.25rem;">🗑</button>
        </div>
      </div>
      <div class="qr-container" data-plate="${p.plate}" style="display: none; margin-top: 0.75rem; text-align: center; padding: 1rem; background: black; border-radius: var(--radius-md);">
        <canvas class="qr-canvas" style="display: block; margin: 0 auto;"></canvas>
        <p style="color: #333; font-size: 0.75rem; margin-top: 0.5rem; font-family: monospace;">${p.plate} · ${typeLabel[p.vehicleType] || p.vehicleType}</p>
        <p style="color: #888; font-size: 0.7rem; margin-top: 0.25rem;">Muestra este QR al celador para registrar tu entrada</p>
      </div>
    </div>
  `;
}

private attachPlateDeleteListeners(card: HTMLElement): void {
  // Eliminar placa
  card.querySelectorAll('.btn-delete-plate').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const plate = (e.currentTarget as HTMLElement).dataset.plate!;
      if (!confirm(`¿Eliminar placa ${plate}?`)) return;
      try {
        const { userApi } = await import('../api.js');
        await userApi.removePlate(plate);
        this.buildPlatesCard(card);
      } catch {
        alert('Error al eliminar placa');
      }
    });
  });

  // Mostrar/ocultar QR
  card.querySelectorAll('.btn-show-qr').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const el = e.currentTarget as HTMLElement;
      const plate = el.dataset.plate!;
      const vehicleType = el.dataset.type!;
      const container = card.querySelector(`.qr-container[data-plate="${plate}"]`) as HTMLElement;

      if (!container) return;

      const isVisible = container.style.display !== 'none';
      if (isVisible) {
        container.style.display = 'none';
        el.textContent = '📱 QR';
        return;
      }

      container.style.display = 'block';
      el.textContent = '🔼 Ocultar';

      // Generar QR solo si el canvas está vacío
      const canvas = container.querySelector('.qr-canvas') as HTMLCanvasElement;
      if (canvas && canvas.width === 0) {
        try {
          const QRCode = await import('qrcode');
          const qrData = JSON.stringify({ plate, vehicleType });
          await QRCode.toCanvas(canvas, qrData, {
            width: 160,
            margin: 1,
            color: { dark: '#ffffff', light: '#000000' }
          });
        } catch (err) {
          console.error('Error generando QR:', err);
        }
      }
    });
  });
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