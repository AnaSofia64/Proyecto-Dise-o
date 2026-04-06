import { Sidebar } from '../components/Sidebar.js';
import { Header } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { paymentApi, ticketApi } from '../api.js';
import { storage, formatCurrency, formatDuration } from '../utils.js';
import { router } from '../router.js';

const icons = {
  cash: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/></svg>`,
  card: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  qr: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>`,
  alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};

export class ProcessPaymentPage {
  private container: HTMLDivElement;
  private ticket: any = null;
  private selectedMethod: 'CASH' | 'CARD' | 'QR' = 'CASH';
  private isProcessing: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    this.ticket = storage.get('current_ticket');
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('ticket');

    if (!this.ticket && ticketId) {
      try {
        this.ticket = await ticketApi.getById(ticketId);
      } catch (error) {
        console.error('Error cargando ticket:', error);
      }
    }

    if (!this.ticket) {
      router.navigate('/attendant/dashboard');
      return this.container;
    }

    const sidebar = new Sidebar();
    this.container.appendChild(sidebar.render());

    const main = document.createElement('div');
    main.className = 'main-content';

    const header = new Header({ title: 'Procesar Pago' });
    main.appendChild(header.render());

    const content = document.createElement('main');
    content.style.padding = '2rem';

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 900px; margin: 0 auto;';

    grid.appendChild(this.renderTicketDetails());
    grid.appendChild(this.renderPaymentMethod());

    content.appendChild(grid);
    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }

  private renderTicketDetails(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    const duration = Math.floor((Date.now() - new Date(this.ticket.entryTime).getTime()) / 60000);
    const amount = this.calculateAmount(duration);

    card.innerHTML = `
      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">Detalles del Ticket</h3>
      
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <span style="color: var(--text-secondary);">Ticket ID</span>
          <span style="font-family: monospace; font-weight: 600;">#${this.ticket.id.slice(-6)}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <span style="color: var(--text-secondary);">Placa</span>
          <span style="font-weight: 600; letter-spacing: 0.05em;">${this.ticket.vehicle.licensePlate}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <span style="color: var(--text-secondary);">Tipo</span>
          <span style="font-weight: 600;">${this.ticket.vehicle.type === 'CAR' ? 'Carro' : this.ticket.vehicle.type === 'MOTORCYCLE' ? 'Moto' : 'Bus'}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <span style="color: var(--text-secondary);">Entrada</span>
          <span style="font-weight: 500;">${new Date(this.ticket.entryTime).toLocaleTimeString()}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <span style="color: var(--text-secondary);">Tiempo transcurrido</span>
          <span style="font-weight: 600; color: var(--cyan);">${formatDuration(duration)}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md);">
          <span style="color: var(--text-secondary);">Plaza</span>
          <span style="font-weight: 600;">${this.ticket.spot.code}</span>
        </div>
      </div>

      <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, var(--primary), var(--primary-light)); border-radius: var(--radius-lg); text-align: center;">
        <p style="color: rgba(255,255,255,0.8); font-size: 0.875rem; margin-bottom: 0.5rem;">Total a pagar</p>
        <p style="color: white; font-size: 2.5rem; font-weight: 700;">${formatCurrency(amount)}</p>
      </div>
    `;

    return card;
  }

  private renderPaymentMethod(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h3');
    title.textContent = 'Método de Pago';
    title.style.cssText = 'font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;';
    card.appendChild(title);

    const methods = document.createElement('div');
    methods.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;';

    const options = [
      { id: 'CASH' as const, icon: icons.cash, label: 'Efectivo', desc: 'Pago en efectivo' },
      { id: 'CARD' as const, icon: icons.card, label: 'Tarjeta', desc: 'Débito o crédito' },
      { id: 'QR' as const, icon: icons.qr, label: 'Código QR', desc: 'Pago con app' }
    ];

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = `vehicle-type-btn ${this.selectedMethod === opt.id ? 'active' : ''}`;
      btn.style.cssText = 'flex-direction: row; justify-content: flex-start; padding: 1rem;';
      btn.innerHTML = `
        <span style="color: ${this.selectedMethod === opt.id ? 'var(--primary)' : 'var(--text-muted)'}">${opt.icon}</span>
        <div style="text-align: left;">
          <div style="font-weight: 600;">${opt.label}</div>
          <div style="font-size: 0.875rem; opacity: 0.7;">${opt.desc}</div>
        </div>
      `;
      btn.onclick = () => {
        this.selectedMethod = opt.id;
        methods.querySelectorAll('.vehicle-type-btn').forEach((b, i) => {
          b.classList.toggle('active', options[i].id === opt.id);
        });
      };
      methods.appendChild(btn);
    });

    card.appendChild(methods);

    const confirmBtn = new Button({
      text: 'Confirmar Pago',
      icon: icons.check,
      size: 'lg',
      onClick: () => this.processPayment()
    });

    const btnWrapper = document.createElement('div');
    btnWrapper.appendChild(confirmBtn.render());
    card.appendChild(btnWrapper);

    const info = document.createElement('div');
    info.style.cssText = 'margin-top: 1rem; padding: 1rem; background: rgba(0, 188, 212, 0.05); border: 1px solid rgba(0, 188, 212, 0.2); border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.75rem;';
    info.innerHTML = `
      <span style="color: var(--cyan);">${icons.alert}</span>
      <p style="font-size: 0.875rem; color: var(--text-muted);">Si el pago falla, se reintentará automáticamente hasta 3 veces.</p>
    `;
    card.appendChild(info);

    return card;
  }

  private calculateAmount(minutes: number): number {
    const hourlyRate = this.ticket.spot.hourlyRate || 3000;
    const hours = Math.ceil(minutes / 60);
    return hours * hourlyRate;
  }

private async processPayment(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    const btn = document.querySelector('.btn-primary') as HTMLButtonElement;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/></svg> Procesando...`;
    btn.disabled = true;

    try {
      const payment = await paymentApi.process(this.ticket.id, this.selectedMethod);

      if (payment.status === 'SUCCESS') {
        this.showSuccess(payment);
      } else {
        throw new Error('El pago no pudo ser procesado');
      }
    } catch (error) {
      btn.innerHTML = originalText;
      btn.disabled = false;
      this.isProcessing = false;

      const retry = confirm('Error en el pago. ¿Desea dejar el ticket como PENDIENTE DE PAGO para procesar después?');
      if (retry) {
        storage.set('pending_payment', { ticketId: this.ticket.id, method: this.selectedMethod });
        router.navigate('/attendant/dashboard');
      }
    }
  }

  private showSuccess(payment: any): void {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    modal.innerHTML = `
      <div style="background: var(--bg-secondary); padding: 2rem; border-radius: var(--radius-xl); text-align: center; max-width: 400px; width: 90%; border: 1px solid var(--border);">
        <div style="width: 80px; height: 80px; background: var(--green); border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg>
        </div>
        <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">¡Pago Exitoso!</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">El ticket ha sido pagado y la plaza liberada.</p>
        <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <p style="font-size: 0.875rem; color: var(--text-muted);">Monto pagado</p>
          <p style="font-size: 1.5rem; font-weight: 700; color: var(--green);">${formatCurrency(payment.amount)}</p>
        </div>
        <button class="btn btn-primary" onclick="window.location.href='/attendant/dashboard'" style="width: 100%;">
          Volver al Panel
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    
    storage.remove('current_ticket');
  }
}