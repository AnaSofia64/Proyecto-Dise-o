interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  type?: 'button' | 'submit';
  className?: string;
}

export class Button {
  private props: ButtonProps;
  private element: HTMLButtonElement;

  constructor(props: ButtonProps) {
    this.props = {
      variant: 'primary',
      size: 'md',
      type: 'button',
      ...props
    };
    this.element = this.create();
  }

  private create(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = this.props.type || 'button';
    btn.className = this.getClasses();
    btn.disabled = this.props.disabled || this.props.loading || false;

    if (this.props.loading) {
      btn.innerHTML = `
        <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"></circle>
        </svg>
        <span>Cargando...</span>
      `;
    } else {
      const iconHtml = this.props.icon ? `<span style="display: flex; align-items: center;">${this.props.icon}</span>` : '';
      btn.innerHTML = `${iconHtml}<span>${this.props.text}</span>`;
    }

    if (this.props.onClick && !this.props.loading) {
      btn.addEventListener('click', this.props.onClick);
    }

    this.element = btn;
    return btn;
  }

  private getClasses(): string {
    const { variant, size, className } = this.props;
    
    const variants: Record<string, string> = {
      primary: 'btn btn-primary',
      secondary: 'btn btn-secondary',
      danger: 'btn btn-danger',
      ghost: 'btn btn-ghost'
    };
    
    const sizes: Record<string, string> = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg'
    };

    return `${variants[variant!]} ${sizes[size!]} ${className || ''}`.trim();
  }

  render(): HTMLButtonElement {
    return this.element;
  }

  update(props: Partial<ButtonProps>): void {
    Object.assign(this.props, props);
    const newElement = this.create();
    this.element.replaceWith(newElement);
    this.element = newElement;
  }

  setLoading(loading: boolean): void {
    this.update({ loading });
  }

  setDisabled(disabled: boolean): void {
    this.update({ disabled });
  }
}