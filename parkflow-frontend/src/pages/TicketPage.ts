import { Sidebar } from '../components/Sidebar.js';
import { ticketApi, paymentApi } from '../api.js';
import { storage, formatCurrency, formatDuration } from '../utils.js';
import { router } from '../router.js';

const icons = {
  cash: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>`,
  card: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>`
};

export class TicketPage {
  private container: HTMLDivElement;
  private ticket: any = null;
  private selectedMethod: string = 'CASH';
  private isProcessing: boolean = false;
  private timerInterval: number | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    try {
      const tickets = await ticketApi.getUserTickets();
      this.ticket = (tickets as any[]).find((t: any) => t.status === 'ACTIVE');
    } catch (error) {
      console.error('Error cargando ticket:', error);
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
      this.startTimer();
    } else {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.style.cssText = 'text-align: center; padding: 3rem; max-width: 400px;';
      empty.innerHTML = `
        <p style="font-size: 1.5rem; margin-bottom: 1rem;">:(</p>
        <h3 style="margin-bottom: 0.5rem;">No tienes ticket activo</h3>
        <p style="color: var(--text-muted);">Cuando el celador registre tu entrada, aparecerá aquí.</p>
      `;
      content.appendChild(empty);
    }

    main.appendChild(content);
    this.container.appendChild(main);
    return this.container;
  }

  private renderTicketCard(): HTMLElement {
    const entryTime = new Date(this.ticket.entryTime).getTime();
    const minutes = Math.floor((Date.now() - entryTime) / 60000);
    const amount = Math.ceil(minutes / 60) * (this.ticket.spot?.hourlyRate || 3000);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'max-width: 420px; width: 100%;';

    card.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <span class="badge badge-success">Activo</span>
        <p style="font-family: monospace; color: var(--text-muted); font-size: 0.8rem; margin-top: 0.5rem;">#${this.ticket.id.slice(-8)}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
        <div style="padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.75rem;">Placa</p>
          <p style="font-weight: 600; letter-spacing: 0.05em;">${this.ticket.vehicle?.licensePlate || this.ticket.licensePlate}</p>
        </div>
        <div style="padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.75rem;">Plaza</p>
          <p style="font-weight: 600; color: var(--cyan);">${this.ticket.spot?.code || this.ticket.spotId}</p>
        </div>
        <div style="padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.75rem;">Entrada</p>
          <p style="font-weight: 500; font-size: 0.875rem;">${new Date(this.ticket.entryTime).toLocaleTimeString('es-CO')}</p>
        </div>
        <div style="padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.75rem;">Tiempo</p>
          <p id="timer-display" style="font-weight: 600; color: var(--cyan);">0h 0m</p>
        </div>
      </div>

      <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-muted); font-size: 0.875rem;">Tarifa por hora</span>
          <span style="font-size: 0.875rem;">${formatCurrency(this.ticket.spot?.hourlyRate || 3000)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: 600;">Total estimado</span>
          <span id="cost-display" style="font-weight: 700; color: var(--primary); font-size: 1.125rem;">${formatCurrency(amount)}</span>
        </div>
      </div>

      <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-secondary);">Método de pago</h4>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
        <button class="pay-method active" data-method="CASH" style="flex: 1; padding: 0.75rem; border-radius: var(--radius-md); border: 2px solid var(--primary); background: var(--bg-input); color: var(--text-primary); cursor: pointer; font-size: 0.875rem; font-weight: 500;">
          ${icons.cash} Efectivo
        </button>
        <button class="pay-method" data-method="CARD" style="flex: 1; padding: 0.75rem; border-radius: var(--radius-md); border: 2px solid var(--border); background: var(--bg-input); color: var(--text-primary); cursor: pointer; font-size: 0.875rem; font-weight: 500;">
          ${icons.card} Tarjeta
        </button>
      </div>

      <div id="pay-error" style="display: none; color: var(--red); font-size: 0.875rem; margin-bottom: 0.75rem; text-align: center;"></div>

      <button id="btn-pay" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        ${icons.check} Pagar ahora
      </button>

      <p style="text-align: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.75rem;">
        Si el pago falla, se reintentará automáticamente hasta 3 veces.
      </p>
    `;

    // Selección de método
    card.querySelectorAll('.pay-method').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedMethod = (btn as HTMLElement).dataset.method!;
        card.querySelectorAll('.pay-method').forEach(b => {
          (b as HTMLElement).style.borderColor = 'var(--border)';
        });
        (btn as HTMLElement).style.borderColor = 'var(--primary)';
      });
    });

    // Botón pagar
    card.querySelector('#btn-pay')?.addEventListener('click', () => this.processPayment(card));

    return card;
  }

  private startTimer(): void {
    const entryTime = new Date(this.ticket.entryTime).getTime();
    const hourlyRate = this.ticket.spot?.hourlyRate || 3000;

    const update = () => {
      const minutes = Math.floor((Date.now() - entryTime) / 60000);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const amount = Math.ceil(minutes / 60) * hourlyRate;

      const timerEl = document.getElementById('timer-display');
      const costEl = document.getElementById('cost-display');
      const secs = Math.floor((Date.now() - entryTime) / 1000) % 60;
      if (timerEl) timerEl.textContent = `${hours}h ${mins}m ${secs}s`;
      if (costEl) costEl.textContent = formatCurrency(amount);
    };

    update();
    this.timerInterval = window.setInterval(update, 1000);
  }

  private async processPayment(card: HTMLElement): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const btn = card.querySelector('#btn-pay') as HTMLButtonElement;
    const errorEl = card.querySelector('#pay-error') as HTMLElement;
    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/></svg> Procesando...`;

    try {
      const payment = await paymentApi.process(this.ticket.id, this.selectedMethod) as any;

      if (payment.status === 'SUCCESS') {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.showSuccess(payment.amount);
      } else {
        throw new Error('El pago no pudo procesarse');
      }
    } catch (error: any) {
      errorEl.textContent = error.message || 'Error procesando el pago';
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = `${icons.check} Pagar ahora`;
      this.isProcessing = false;
    }
  }

  private showSuccess(amount: number): void {
    const app = document.getElementById('app')!;
    app.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-primary);">
        <div style="background: var(--bg-secondary); padding: 2.5rem; border-radius: var(--radius-xl); text-align: center; max-width: 380px; width: 90%; border: 1px solid var(--border);">
          <div style="width: 80px; height: 80px; background: var(--green); border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg>
          </div>
          <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">¡Pago exitoso!</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Tu plaza ha sido liberada. ¡Hasta pronto!</p>
          <div style="padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <p style="font-size: 0.875rem; color: var(--text-muted);">Total pagado</p>
            <p style="font-size: 1.75rem; font-weight: 700; color: var(--green);">${formatCurrency(amount)}</p>
          </div>
          <button class="btn btn-primary" style="width: 100%;" onclick="window.history.pushState({},'','/user/dashboard'); window.dispatchEvent(new PopStateEvent('popstate'));">
            Volver al inicio
          </button>
        </div>
      </div>
    `;
  }
}