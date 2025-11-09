import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { CoordService } from '../services/coord.service';
import { GridSpacing, IndianGridZone } from '../types';

@Component({
  selector: 'app-indian-grid',
  template: '',
})
export class IndianGridComponent implements OnChanges, OnDestroy {
  @Input() map: L.Map;
  @Input() color: string;
  @Input() opacity: number;
  @Input() weight: number;
  @Input() zone: IndianGridZone;
  @Input() gridSpacing: GridSpacing;

  private gridLayer: L.LayerGroup;

  constructor(private coordService: CoordService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    
    if (!this.gridLayer) {
      this.gridLayer = L.layerGroup().addTo(this.map);
      this.map.on('moveend', this.updateGrid);
    }

    this.updateGrid();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off('moveend', this.updateGrid);
      if (this.gridLayer) {
        this.gridLayer.remove();
      }
    }
  }

  updateGrid = () => {
    if (!this.map) return;
    this.gridLayer.clearLayers();

    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();
    
    let step: number;
    if (this.gridSpacing === 'Auto') {
        if (zoom < 8) return;
        step = zoom > 14 ? 1000 : zoom > 11 ? 10000 : 100000;
    } else {
        step = this.gridSpacing;
        if ((step === 1000 && zoom < 12) || (step === 5000 && zoom < 10) || (step === 10000 && zoom < 8)) return;
    }

    const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
    const extendedBounds = new L.LatLngBounds(
        new L.LatLng(sw.lat - (ne.lat - sw.lat) * 0.1, sw.lng - (ne.lng - sw.lng) * 0.1),
        new L.LatLng(ne.lat + (ne.lat - sw.lat) * 0.1, ne.lng + (ne.lng - sw.lng) * 0.1)
    );
    
    const swGrid = this.coordService.convertLatLonToIndianGrid(extendedBounds.getSouthWest(), this.zone);
    const neGrid = this.coordService.convertLatLonToIndianGrid(extendedBounds.getNorthEast(), this.zone);

    if (!swGrid || !neGrid) return;
    
    const pathOptions = { color: this.color, opacity: this.opacity, weight: this.weight, interactive: false };

    // Northing lines
    const northStart = Math.floor(swGrid.northing / step) * step;
    for (let n = northStart; n <= neGrid.northing; n += step) {
        const p1 = this.coordService.convertIndianGridToLatLon({easting: swGrid.easting, northing: n, zone: this.zone});
        const p2 = this.coordService.convertIndianGridToLatLon({easting: neGrid.easting, northing: n, zone: this.zone});
        if (p1 && p2) L.polyline([p1, p2], pathOptions).addTo(this.gridLayer);
    }

    // Easting lines
    const eastStart = Math.floor(swGrid.easting / step) * step;
    for (let e = eastStart; e <= neGrid.easting; e += step) {
        const p1 = this.coordService.convertIndianGridToLatLon({easting: e, northing: swGrid.northing, zone: this.zone});
        const p2 = this.coordService.convertIndianGridToLatLon({easting: e, northing: neGrid.northing, zone: this.zone});
        if (p1 && p2) L.polyline([p1, p2], pathOptions).addTo(this.gridLayer);
    }
  }
}
