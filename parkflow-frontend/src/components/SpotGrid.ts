import { spotApi } from '../api.js';

interface Spot {
  id: string;
  code: string;
  type: 'CAR' | 'MOTORCYCLE' | 'BUS';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

interface SpotGridProps {
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'BUS';
  onSelect: (spotId: string) => void;
  selectedSpotId?: string | null;
}

export class SpotGrid {
  private props: SpotGridProps;
  private element: HTMLDivElement;
  private spots: Spot[] = [];
  private isLoading: boolean = false;

  constructor(props: SpotGridProps) {
    this.props = props;
    this.element = document.createElement('div');
    this.element.className = 'spots-grid';
    this.loadSpots();
  }

  private async loadSpots(): Promise<void> {
    this.isLoading = true;
    this.renderLoading();

    try {
      this.spots = await spotApi.getAvailable(this.props.vehicleType);
      this.renderSpots();
    } catch (error) {
      this.renderError();
    } finally {
      this.isLoading = false;
    }
  }

  private renderLoading(): void {
    this.element.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
        <svg class="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 0.5rem;">
          <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
        </svg>
        <p>Cargando plazas...</p>
      </div>
    `;
  }

  private renderError(): void {
    this.element.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--red);">
        <p>Error cargando plazas</p>
        <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="location.reload()">
          Reintentar
        </button>
      </div>
    `;
  }

  private renderSpots(): void {
    this.element.innerHTML = '';

    if (this.spots.length === 0) {
      this.element.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
          <p>No hay plazas disponibles</p>
        </div>
      `;
      return;
    }

    this.spots.forEach(spot => {
      const btn = document.createElement('button');
      const isSelected = this.props.selectedSpotId === spot.id;
      
      btn.className = `spot-btn ${isSelected ? 'selected' : 'available'}`;
      btn.innerHTML = `
        <span>${spot.code}</span>
        <span class="spot-type">${spot.type}</span>
      `;
      
      btn.onclick = () => {
        this.element.querySelectorAll('.spot-btn.selected').forEach(b => {
          b.classList.remove('selected');
          b.classList.add('available');
        });
        
        btn.classList.remove('available');
        btn.classList.add('selected');
        
        this.props.onSelect(spot.id);
      };

      this.element.appendChild(btn);
    });
  }

  refresh(): void {
    this.loadSpots();
  }

  render(): HTMLDivElement {
    return this.element;
  }
}