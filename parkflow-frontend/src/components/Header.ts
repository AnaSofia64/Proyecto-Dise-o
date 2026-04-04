interface HeaderProps {
  title: string;
  showSearch?: boolean;
  userInitials?: string;
}

export class Header {
  private props: HeaderProps;
  private element: HTMLElement;

  constructor(props: HeaderProps) {
    this.props = {
      showSearch: true,
      userInitials: 'JD',
      ...props
    };
    this.element = this.create();
  }

  private create(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'header';

    // Título
    const title = document.createElement('h2');
    title.className = 'header-title';
    title.textContent = this.props.title;
    header.appendChild(title);

    // Acciones derecha
    const actions = document.createElement('div');
    actions.className = 'header-actions';

    // Search box
    if (this.props.showSearch) {
      const searchBox = document.createElement('div');
      searchBox.className = 'search-box';
      searchBox.innerHTML = `
        <span class="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <input type="text" class="input" placeholder="Buscar..." style="padding-left: 2.5rem;">
      `;
      actions.appendChild(searchBox);
    }

    // Botón notificación
    const notifBtn = document.createElement('button');
    notifBtn.className = 'btn-icon';
    notifBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
      <span class="notification-badge"></span>
    `;
    actions.appendChild(notifBtn);

    // Avatar usuario
    const avatar = document.createElement('div');
    avatar.style.cssText = `
      width: 40px;
      height: 40px;
      background: var(--primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      cursor: pointer;
    `;
    avatar.textContent = this.props.userInitials!;
    actions.appendChild(avatar);

    header.appendChild(actions);
    this.element = header;
    return header;
  }

  render(): HTMLElement {
    return this.element;
  }

  setTitle(title: string): void {
    this.element.querySelector('.header-title')!.textContent = title;
  }
}