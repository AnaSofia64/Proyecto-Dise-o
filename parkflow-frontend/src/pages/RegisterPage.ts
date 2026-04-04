import { auth } from '../auth.js';
import { router } from '../router.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';

const icons = {
  car: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`,
  user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
};

export class RegisterPage {
  private container: HTMLDivElement;
  private fullNameInput: Input;
  private usernameInput: Input;
  private emailInput: Input;
  private passwordInput: Input;
  private confirmPasswordInput: Input;
  private submitBtn: Button;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'auth-page';

    this.fullNameInput = new Input({
      label: 'Nombre completo',
      placeholder: 'Ingresa tu nombre completo',
      icon: icons.user,
      required: true
    });

    this.usernameInput = new Input({
      label: 'Usuario',
      placeholder: 'Crea un nombre de usuario',
      icon: icons.user,
      required: true
    });

    this.emailInput = new Input({
      label: 'Correo electrónico',
      type: 'email',
      placeholder: 'tu@email.com',
      icon: icons.mail,
      required: true
    });

    this.passwordInput = new Input({
      label: 'Contraseña',
      type: 'password',
      placeholder: 'Crea una contraseña segura',
      icon: icons.lock,
      required: true
    });

    this.confirmPasswordInput = new Input({
      label: 'Confirmar contraseña',
      type: 'password',
      placeholder: 'Repite tu contraseña',
      icon: icons.lock,
      required: true
    });

    this.submitBtn = new Button({
      text: 'Crear Cuenta',
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
      <p>Crea tu cuenta en ParkFlow</p>
    `;
    container.appendChild(logo);

    const card = document.createElement('div');
    card.className = 'auth-card';

    const form = document.createElement('form');
    form.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';

    const errorDiv = document.createElement('div');
    errorDiv.id = 'register-error';
    errorDiv.style.cssText = 'display: none; padding: 0.875rem; background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3); border-radius: var(--radius-md); color: var(--red); font-size: 0.875rem;';

    form.appendChild(this.fullNameInput.render());
    form.appendChild(this.usernameInput.render());
    form.appendChild(this.emailInput.render());
    form.appendChild(this.passwordInput.render());
    form.appendChild(this.confirmPasswordInput.render());
    form.appendChild(errorDiv);

    const btnWrapper = document.createElement('div');
    btnWrapper.style.marginTop = '0.5rem';
    btnWrapper.appendChild(this.submitBtn.render());
    form.appendChild(btnWrapper);

    const terms = document.createElement('div');
    terms.style.cssText = 'display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted);';
    terms.innerHTML = `
      <input type="checkbox" id="terms" required style="margin-top: 0.25rem; accent-color: var(--primary);">
      <label for="terms">Acepto los <a href="#" style="color: var(--primary);">Términos de servicio</a> y la <a href="#" style="color: var(--primary);">Política de privacidad</a></label>
    `;
    form.appendChild(terms);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorEl = document.getElementById('register-error')!;
      
      const fullName = this.fullNameInput.getValue().trim();
      const username = this.usernameInput.getValue().trim();
      const email = this.emailInput.getValue().trim();
      const password = this.passwordInput.getValue();
      const confirmPassword = this.confirmPasswordInput.getValue();
      const termsAccepted = (document.getElementById('terms') as HTMLInputElement)?.checked;

      if (!fullName || !username || !email || !password) {
        errorEl.textContent = 'Por favor completa todos los campos';
        errorEl.style.display = 'block';
        return;
      }

      if (password !== confirmPassword) {
        errorEl.textContent = 'Las contraseñas no coinciden';
        errorEl.style.display = 'block';
        this.confirmPasswordInput.setError('Las contraseñas no coinciden');
        return;
      }

      if (password.length < 6) {
        errorEl.textContent = 'La contraseña debe tener al menos 6 caracteres';
        errorEl.style.display = 'block';
        return;
      }

      if (!termsAccepted) {
        errorEl.textContent = 'Debes aceptar los términos y condiciones';
        errorEl.style.display = 'block';
        return;
      }

      errorEl.style.display = 'none';
      this.confirmPasswordInput.clearError();

      this.submitBtn.setLoading(true);

      try {
        await auth.register({
          username,
          email,
          password,
          fullName
        });

        alert('¡Cuenta creada exitosamente! Por favor inicia sesión.');
        router.navigate('/login');
      } catch (error) {
        this.submitBtn.setLoading(false);
        errorEl.textContent = error instanceof Error ? error.message : 'Error al crear la cuenta';
        errorEl.style.display = 'block';
      }
    });

    card.appendChild(form);
    container.appendChild(card);

    const footer = document.createElement('p');
    footer.className = 'auth-footer';
    footer.innerHTML = `¿Ya tienes una cuenta? <a href="/login" data-link>Inicia sesión</a>`;
    container.appendChild(footer);

    this.container.appendChild(container);
    return this.container;
  }
}