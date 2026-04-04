interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helper?: string;
  icon?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
}

export class Input {
  private props: InputProps;
  private container: HTMLDivElement;
  private input: HTMLInputElement;

  constructor(props: InputProps) {
    this.props = props;
    this.container = this.create();
    this.input = this.container.querySelector('input')!;
  }

  private create(): HTMLDivElement {
    const div = document.createElement('div');
    div.className = `input-group ${this.props.className || ''}`;

    // Label
    if (this.props.label) {
      const label = document.createElement('label');
      label.className = 'input-label';
      label.textContent = this.props.label;
      div.appendChild(label);
    }

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';
    wrapper.style.position = 'relative';

    // Icono
    if (this.props.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'input-icon';
      iconSpan.innerHTML = this.props.icon;
      wrapper.appendChild(iconSpan);
    }

    // Input
    const input = document.createElement('input');
    input.type = this.props.type || 'text';
    input.className = 'input';
    input.placeholder = this.props.placeholder || '';
    input.value = this.props.value || '';
    input.name = this.props.name || '';
    input.required = this.props.required || false;
    input.disabled = this.props.disabled || false;

    if (this.props.icon) {
      input.style.paddingLeft = '2.75rem';
    }

    // Eventos
    input.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (this.props.onChange) this.props.onChange(value);
    });

    if (this.props.onBlur) {
      input.addEventListener('blur', this.props.onBlur);
    }

    wrapper.appendChild(input);

    // Error
    if (this.props.error) {
      const error = document.createElement('p');
      error.style.cssText = 'color: var(--red); font-size: 0.875rem; margin-top: 0.5rem;';
      error.textContent = this.props.error;
      wrapper.appendChild(error);
    }

    // Helper
    if (this.props.helper && !this.props.error) {
      const helper = document.createElement('p');
      helper.style.cssText = 'color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;';
      helper.textContent = this.props.helper;
      wrapper.appendChild(helper);
    }

    div.appendChild(wrapper);
    return div;
  }

  render(): HTMLDivElement {
    return this.container;
  }

  getValue(): string {
    return this.input.value;
  }

  setValue(value: string): void {
    this.input.value = value;
  }

  setError(error: string): void {
    this.props.error = error;
    const newContainer = this.create();
    this.container.replaceWith(newContainer);
    this.container = newContainer;
    this.input = newContainer.querySelector('input')!;
  }

  clearError(): void {
    this.setError('');
  }

  focus(): void {
    this.input.focus();
  }
}