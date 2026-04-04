interface QRCodeProps {
  data: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  showValue?: boolean;
}

export class QRCode {
  private props: QRCodeProps;
  private element: HTMLDivElement;

  constructor(props: QRCodeProps) {
    this.props = {
      size: 160,
      color: '#0a0e27',
      backgroundColor: '#ffffff',
      showValue: true,
      ...props
    };
    this.element = this.create();
  }

  private create(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      background: ${this.props.backgroundColor};
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      border: 1px solid var(--border);
    `;

    const qrSize = this.props.size!;
    const svg = this.generateQRSVG(qrSize);
    
    const qrWrapper = document.createElement('div');
    qrWrapper.style.cssText = `
      width: ${qrSize}px;
      height: ${qrSize}px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    qrWrapper.innerHTML = svg;
    container.appendChild(qrWrapper);

    if (this.props.label) {
      const label = document.createElement('p');
      label.textContent = this.props.label;
      label.style.cssText = 'font-size: 0.875rem; color: var(--text-muted); margin: 0;';
      container.appendChild(label);
    }

    if (this.props.showValue) {
      const value = document.createElement('p');
      value.textContent = this.props.data;
      value.style.cssText = `
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--bg-primary);
        letter-spacing: 0.05em;
        margin: 0;
      `;
      container.appendChild(value);
    }

    this.element = container;
    return container;
  }

  private generateQRSVG(size: number): string {
    const cells = 25;
    const cellSize = Math.floor(size / cells);
    const pattern = this.generatePattern(this.props.data, cells);
    
    let rects = '';
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        if (pattern[y][x]) {
          rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${this.props.color}"/>`;
        }
      }
    }

    const finderSize = 7 * cellSize;
    const finderPattern = `
      <rect x="0" y="0" width="${finderSize}" height="${finderSize}" fill="${this.props.color}"/>
      <rect x="${2*cellSize}" y="${2*cellSize}" width="${3*cellSize}" height="${3*cellSize}" fill="${this.props.backgroundColor}"/>
      <rect x="${3*cellSize}" y="${3*cellSize}" width="${cellSize}" height="${cellSize}" fill="${this.props.color}"/>
      
      <rect x="${size - finderSize}" y="0" width="${finderSize}" height="${finderSize}" fill="${this.props.color}"/>
      <rect x="${size - 5*cellSize}" y="${2*cellSize}" width="${3*cellSize}" height="${3*cellSize}" fill="${this.props.backgroundColor}"/>
      <rect x="${size - 4*cellSize}" y="${3*cellSize}" width="${cellSize}" height="${cellSize}" fill="${this.props.color}"/>
      
      <rect x="0" y="${size - finderSize}" width="${finderSize}" height="${finderSize}" fill="${this.props.color}"/>
      <rect x="${2*cellSize}" y="${size - 5*cellSize}" width="${3*cellSize}" height="${3*cellSize}" fill="${this.props.backgroundColor}"/>
      <rect x="${3*cellSize}" y="${size - 4*cellSize}" width="${cellSize}" height="${cellSize}" fill="${this.props.color}"/>
    `;

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${finderPattern}${rects}</svg>`;
  }

  private generatePattern(data: string, size: number): boolean[][] {
    const pattern: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }

    const seed = Math.abs(hash);
    const rng = this.createRNG(seed);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if ((x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)) {
          continue;
        }
        pattern[y][x] = rng() > 0.5;
      }
    }

    return pattern;
  }

  private createRNG(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  render(): HTMLDivElement {
    return this.element;
  }

  updateData(newData: string): void {
    this.props.data = newData;
    const newElement = this.create();
    this.element.replaceWith(newElement);
    this.element = newElement;
  }
}