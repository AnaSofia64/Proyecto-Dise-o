import { Sidebar } from '../components/Sidebar.js';
import { userApi } from '../api.js';

export class AdminWorkersPage {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'layout';
  }

  async render(): Promise<HTMLDivElement> {
    const sidebar = new Sidebar();
    this.container.appendChild(sidebar.render());

    const main = document.createElement('div');
    main.className = 'main-content';

    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `<h2 class="header-title">Gestión de Trabajadores</h2>`;
    main.appendChild(header);

    const content = document.createElement('main');
    content.style.padding = '2rem';

    // Formulario crear celador
    const formCard = document.createElement('div');
    formCard.className = 'card';
    formCard.style.marginBottom = '1.5rem';
    formCard.innerHTML = `
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Crear Nuevo Celador</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <label class="input-label">Nombre completo</label>
          <input id="w-fullname" type="text" class="input" placeholder="Nombre del celador">
        </div>
        <div>
          <label class="input-label">Usuario</label>
          <input id="w-username" type="text" class="input" placeholder="nombre.usuario">
        </div>
        <div>
          <label class="input-label">Email</label>
          <input id="w-email" type="email" class="input" placeholder="correo@parkflow.com">
        </div>
        <div>
          <label class="input-label">Contraseña</label>
          <input id="w-password" type="password" class="input" placeholder="Contraseña temporal">
        </div>
      </div>
      <div id="w-error" style="display:none; color: var(--red); font-size: 0.875rem; margin-bottom: 0.75rem;"></div>
      <button id="w-submit" class="btn btn-primary">Crear Celador</button>
    `;
    content.appendChild(formCard);

    formCard.querySelector('#w-submit')?.addEventListener('click', async () => {
      const fullName = (formCard.querySelector('#w-fullname') as HTMLInputElement).value.trim();
      const username = (formCard.querySelector('#w-username') as HTMLInputElement).value.trim();
      const email    = (formCard.querySelector('#w-email') as HTMLInputElement).value.trim();
      const password = (formCard.querySelector('#w-password') as HTMLInputElement).value;
      const errorEl  = formCard.querySelector('#w-error') as HTMLElement;

      if (!fullName || !username || !email || !password) {
        errorEl.textContent = 'Todos los campos son requeridos';
        errorEl.style.display = 'block';
        return;
      }

      try {
        await fetch('http://localhost:8080/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('jwt_token') || '""')}`
          },
          body: JSON.stringify({ fullName, username, email, password, role: 'ATTENDANT' })
        });
        alert(`Celador ${username} creado exitosamente`);
        (formCard.querySelector('#w-fullname') as HTMLInputElement).value = '';
        (formCard.querySelector('#w-username') as HTMLInputElement).value = '';
        (formCard.querySelector('#w-email') as HTMLInputElement).value = '';
        (formCard.querySelector('#w-password') as HTMLInputElement).value = '';
        errorEl.style.display = 'none';
      } catch (e: any) {
        errorEl.textContent = e.message || 'Error al crear celador';
        errorEl.style.display = 'block';
      }
    });

    main.appendChild(content);
    this.container.appendChild(main);

    return this.container;
  }
}