import { Sidebar } from '../components/Sidebar.js';
import { Header } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { spotApi, ticketApi } from '../api.js';
import { storage } from '../utils.js';
import { router } from '../router.js';

const icons = {
  car: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`,
  motorcycle: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/><path d="M8 14.5v.5"/></svg>`,
  bus: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`,
  camera: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
  qr: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
};

export class RegisterEntryPage {
  private container: HTMLDivElement;
  private selectedType: 'CAR' | 'MOTORCYCLE' | 'BUS' = 'CAR';
  private selectedSpot: string | null = null;
  private spots: any[] = [];
  private licensePlate: string = '';

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    const sidebar = new Sidebar();
    this.container.appendChild(sidebar.render());

    const main = document.createElement('div');
    main.className = 'main-content';

    const header = new Header({ title: 'Registrar Entrada' });
    main.appendChild(header.render());

    const content = document.createElement('main');
    content.style.padding = '2rem';

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 1000px; margin: 0 auto;';

    grid.appendChild(this.renderForm());
    grid.appendChild(this.renderPreview());

    content.appendChild(grid);
    main.appendChild(content);
    this.container.appendChild(main);

    await this.loadSpots();

    return this.container;
  }

  private renderForm(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h3');
    title.textContent = 'Datos del Vehículo';
    title.style.cssText = 'font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;';
    card.appendChild(title);

    const typeLabel = document.createElement('label');
    typeLabel.className = 'input-label';
    typeLabel.textContent = 'Tipo de Vehículo';
    card.appendChild(typeLabel);

    const typeSelector = document.createElement('div');
    typeSelector.className = 'vehicle-types';

    const types = [
      { type: 'CAR' as const, icon: icons.car, label: 'Carro' },
      { type: 'MOTORCYCLE' as const, icon: icons.motorcycle, label: 'Moto' },
      { type: 'BUS' as const, icon: icons.bus, label: 'Bus' }
    ];

    types.forEach(t => {
      const btn = document.createElement('button');
      btn.className = `vehicle-type-btn ${this.selectedType === t.type ? 'active' : ''}`;
      btn.innerHTML = `${t.icon}<span>${t.label}</span>`;
      btn.onclick = () => {
        this.selectedType = t.type;
        this.selectedSpot = null;
        typeSelector.querySelectorAll('.vehicle-type-btn').forEach((b, i) => {
          b.classList.toggle('active', types[i].type === t.type);
        });
        this.loadSpots();
        this.updatePreview();
      };
      typeSelector.appendChild(btn);
    });

    card.appendChild(typeSelector);

    const plateWrapper = document.createElement('div');
    plateWrapper.style.marginTop = '1.5rem';

    const plateLabel = document.createElement('label');
    plateLabel.className = 'input-label';
    plateLabel.textContent = 'Placa del Vehículo';
    plateWrapper.appendChild(plateLabel);

    const plateInputWrapper = document.createElement('div');
    plateInputWrapper.style.position = 'relative';

    const plateInput = document.createElement('input');
    plateInput.type = 'text';
    plateInput.className = 'input';
    plateInput.placeholder = 'Ej: ABC-123';
    plateInput.style.cssText = 'text-align: center; font-size: 1.5rem; letter-spacing: 0.1em; text-transform: uppercase; padding-right: 3rem;';
    plateInput.maxLength = 7;
    plateInput.oninput = (e) => {
      this.licensePlate = (e.target as HTMLInputElement).value.toUpperCase();
      this.updatePreview();
    };

    const cameraBtn = document.createElement('button');
    cameraBtn.type = 'button';
    cameraBtn.innerHTML = icons.camera;
    cameraBtn.style.cssText = 'position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--primary); cursor: pointer;';

    plateInputWrapper.appendChild(plateInput);
    plateInputWrapper.appendChild(cameraBtn);
    plateWrapper.appendChild(plateInputWrapper);

    const plateHint = document.createElement('p');
    plateHint.textContent = 'O escanea el código QR del vehículo';
    plateHint.style.cssText = 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.5rem;';
    plateWrapper.appendChild(plateHint);

    card.appendChild(plateWrapper);

    const spotLabel = document.createElement('label');
    spotLabel.className = 'input-label';
    spotLabel.textContent = 'Seleccionar Plaza Disponible';
    spotLabel.style.marginTop = '1.5rem';
    card.appendChild(spotLabel);

    const spotsContainer = document.createElement('div');
    spotsContainer.id = 'spots-grid';
    spotsContainer.className = 'spots-grid';
    card.appendChild(spotsContainer);

    const submitBtn = new Button({
      text: 'Generar Ticket de Entrada',
      icon: icons.qr,
      size: 'lg',
      onClick: () => this.handleSubmit()
    });

    const btnWrapper = document.createElement('div');
    btnWrapper.style.marginTop = '1.5rem';
    btnWrapper.appendChild(submitBtn.render());
    card.appendChild(btnWrapper);

    return card;
  }

  private renderPreview(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'preview-card';

    const title = document.createElement('h3');
    title.textContent = 'Vista Previa';
    title.style.cssText = 'font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;';
    card.appendChild(title);

    const preview = document.createElement('div');
    preview.style.cssText = 'background: var(--bg-input); border-radius: var(--radius-lg); padding: 1.5rem; border: 1px solid var(--border); text-align: center;';

    preview.innerHTML = `
      <div style="width: 140px; height: 140px; background: white; border-radius: var(--radius-md); margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0a0e27" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      </div>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.5rem;">Ticket de Entrada</p>
      <p id="preview-plate" style="font-size: 2rem; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.5rem;">---</p>
      <p id="preview-type" style="color: var(--primary); font-weight: 500;">Carro</p>
      <p id="preview-spot" style="color: var(--cyan); margin-top: 0.5rem; display: none;">Plaza asignada: <strong>---</strong></p>
      <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
        <p style="color: var(--text-muted); font-size: 0.75rem;">${new Date().toLocaleString()}</p>
      </div>
    `;

    card.appendChild(preview);

    const instructions = document.createElement('div');
    instructions.style.cssText = 'margin-top: 1.5rem; padding: 1rem; background: rgba(0, 188, 212, 0.05); border: 1px solid rgba(0, 188, 212, 0.2); border-radius: var(--radius-md);';
    instructions.innerHTML = `
      <h4 style="color: var(--cyan); font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem;">Instrucciones</h4>
      <ul style="font-size: 0.875rem; color: var(--text-muted); padding-left: 1.25rem; line-height: 1.6;">
        <li>Verifique que la placa esté correcta</li>
        <li>Asigne una plaza del tipo correspondiente</li>
        <li>Entregue el ticket impreso al conductor</li>
        <li>El código QR contiene toda la información</li>
      </ul>
    `;
    card.appendChild(instructions);

    return card;
  }

  private async loadSpots(): Promise<void> {
    const grid = document.getElementById('spots-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Cargando...</div>';

    try {
      this.spots = await spotApi.getAvailable(this.selectedType);
      
      grid.innerHTML = '';
      this.spots.forEach(spot => {
        const btn = document.createElement('button');
        btn.className = `spot-btn available ${this.selectedSpot === spot.id ? 'selected' : ''}`;
        btn.innerHTML = `<span>${spot.code}</span><span class="spot-type">${spot.type}</span>`;
        btn.onclick = () => {
          this.selectedSpot = spot.id;
          grid.querySelectorAll('.spot-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.updatePreview();
        };
        grid.appendChild(btn);
      });

      if (this.spots.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No hay plazas disponibles</div>';
      }
    } catch (error) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--red);">Error cargando plazas</div>';
    }
  }

  private updatePreview(): void {
    const plateEl = document.getElementById('preview-plate');
    const typeEl = document.getElementById('preview-type');
    const spotEl = document.getElementById('preview-spot');

    if (plateEl) plateEl.textContent = this.licensePlate || '---';
    if (typeEl) {
      const types: Record<string, string> = { CAR: 'Carro', MOTORCYCLE: 'Moto', BUS: 'Bus' };
      typeEl.textContent = types[this.selectedType];
    }
    if (spotEl && this.selectedSpot) {
      const spot = this.spots.find(s => s.id === this.selectedSpot);
      spotEl.innerHTML = `Plaza asignada: <strong>${spot?.code || '---'}</strong>`;
      spotEl.style.display = 'block';
    }
  }

  private async handleSubmit(): Promise<void> {
    // Limpiar error anterior
    const existingError = document.getElementById('entry-error');
    if (existingError) existingError.remove();

    if (!this.licensePlate) {
      this.showError('Ingresa la placa del vehículo');
      return;
    }
    if (!this.selectedSpot) {
      this.showError('Selecciona una plaza disponible');
      return;
    }

    const btn = document.querySelector('.btn-primary') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/></svg> Generando...`;

    try {
      const ticket = await ticketApi.create({
        licensePlate: this.licensePlate,
        vehicleType: this.selectedType,
        spotId: this.selectedSpot
      });

      storage.set('current_ticket', ticket);
      router.navigate('/attendant/reports');
    } catch (error: any) {
      btn.disabled = false;
      btn.innerHTML = `${icons.qr} Generar Ticket de Entrada`;

      const msg = error?.message || 'Error al crear ticket';
      
      this.showError(msg.includes('400') || msg.includes('Placa') 
        ? 'Esta placa no está registrada en el sistema. El usuario debe registrarla primero desde su cuenta.' 
        : msg);
    }
  }

  private showError(message: string): void {
    const existingError = document.getElementById('entry-error');
    if (existingError) existingError.remove();

    const errorEl = document.createElement('div');
    errorEl.id = 'entry-error';
    errorEl.style.cssText = `
      margin-top: 1rem;
      padding: 0.875rem 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-md);
      color: var(--red);
      font-size: 0.875rem;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    `;
    errorEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top: 1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>${message}</span>
    `;

    
    const btnWrapper = document.querySelector('.btn-primary')?.parentElement;
    if (btnWrapper) btnWrapper.after(errorEl);
  }
}