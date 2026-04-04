interface CardProps {
  title?: string;
  children: HTMLElement | string;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

export class Card {
  private props: CardProps;
  private element: HTMLDivElement;

  constructor(props: CardProps) {
    this.props = {
      padding: 'md',
      shadow: true,
      ...props
    };
    this.element = this.create();
  }

  private create(): HTMLDivElement {
    const card = document.createElement('div');
    
    const paddingMap = {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem'
    };

    card.style.cssText = `
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
      padding: ${paddingMap[this.props.padding!]};
      border: 1px solid var(--border);
      ${this.props.shadow ? 'box-shadow: var(--shadow-md);' : ''}
      transition: all var(--transition-normal);
    `;

    if (this.props.className) {
      card.className = this.props.className;
    }

    // Hover effect
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = 'rgba(0, 102, 255, 0.2)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'var(--border)';
    });

    // Título
    if (this.props.title) {
      const title = document.createElement('h3');
      title.textContent = this.props.title;
      title.style.cssText = 'font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);';
      card.appendChild(title);
    }

    // Contenido
    if (typeof this.props.children === 'string') {
      card.innerHTML += this.props.children;
    } else {
      card.appendChild(this.props.children);
    }

    this.element = card;
    return card;
  }

  render(): HTMLDivElement {
    return this.element;
  }

  updateContent(children: HTMLElement | string): void {
    // Limpiar contenido excepto título
    const title = this.element.querySelector('h3');
    this.element.innerHTML = '';
    if (title) this.element.appendChild(title);

    if (typeof children === 'string') {
      this.element.innerHTML += children;
    } else {
      this.element.appendChild(children);
    }
  }

  addClass(className: string): void {
    this.element.classList.add(className);
  }

  removeClass(className: string): void {
    this.element.classList.remove(className);
  }
}