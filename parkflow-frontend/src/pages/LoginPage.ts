import { auth } from '../auth.js';
import { router } from '../router.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';

const icons = {
  car: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`,
  mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
};

export class LoginPage {
  private container: HTMLDivElement;
  private usernameInput: Input;
  private passwordInput: Input;
  private submitBtn: Button;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'auth-page';

    this.usernameInput = new Input({
      label: 'Usuario',
      placeholder: 'Ingresa tu usuario',
      icon: icons.mail,
      required: true
    });

    this.passwordInput = new Input({
      label: 'Contraseña',
      type: 'password',
      placeholder: 'Ingresa tu contraseña',
      icon: icons.lock,
      required: true
    });

    this.submitBtn = new Button({
      text: 'Iniciar Sesión',
      type: 'submit',
      size: 'lg'
    });
  }

  render(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'auth-container';

    const logo = document.createElement('div');
    logo.className = 'auth-logo';
    logo.innerHTML = `
      <div class="auth-logo-icon">
        ${icons.car}
      </div>
      <h1>¡Bienvenido!</h1>
      <p>Inicia sesión en ParkFlow</p>
    `;
    container.appendChild(logo);

    const card = document.createElement('div');
    card.className = 'auth-card';

    const form = document.createElement('form');
    form.style.cssText = 'display: flex; flex-direction: column; gap: 1.25rem;';

    const errorDiv = document.createElement('div');
    errorDiv.id = 'login-error';
    errorDiv.style.cssText = 'display: none; padding: 0.875rem; background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3); border-radius: var(--radius-md); color: var(--red); font-size: 0.875rem;';

    form.appendChild(this.usernameInput.render());
    form.appendChild(this.passwordInput.render());

    const options = document.createElement('div');
    options.style.cssText = 'display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem;';
    options.innerHTML = `
      <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); cursor: pointer;">
        <input type="checkbox" style="accent-color: var(--primary);">
        Recordarme
      </label>
      <a href="/forgot-password" style="color: var(--primary); text-decoration: none;">¿Olvidaste tu contraseña?</a>
    `;
    form.appendChild(options);

    form.appendChild(errorDiv);

    const btnWrapper = document.createElement('div');
    btnWrapper.appendChild(this.submitBtn.render());
    form.appendChild(btnWrapper);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = this.usernameInput.getValue();
      const password = this.passwordInput.getValue();

      if (!username || !password) {
        errorDiv.textContent = 'Por favor completa todos los campos';
        errorDiv.style.display = 'block';
        return;
      }

      this.submitBtn.setLoading(true);
      errorDiv.style.display = 'none';

      try {
        const user = await auth.login(username, password);
        
        const routes: Record<string, string> = {
          'ATTENDANT': '/attendant/dashboard',
          'USER': '/user/dashboard',
          'ADMIN': '/admin/panel'
        };
        
        router.navigate(routes[user.role] || '/login');
      } catch (error) {
        errorDiv.textContent = error instanceof Error ? error.message : 'Error al iniciar sesión';
        errorDiv.style.display = 'block';
        this.submitBtn.setLoading(false);
      }
    });

    card.appendChild(form);
    container.appendChild(card);

    const footer = document.createElement('p');
    footer.className = 'auth-footer';
    footer.innerHTML = `¿No tienes una cuenta? <a href="/register" data-link>Regístrate</a>`;
    container.appendChild(footer);

    this.container.appendChild(container);
    return this.container;
  }
}