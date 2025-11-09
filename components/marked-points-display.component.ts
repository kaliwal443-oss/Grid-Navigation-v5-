import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { MarkedPoint } from '../types';
import { MeasurementService } from '../services/measurement.service';

@Component({
  selector: 'app-marked-points-display',
  template: '', // This component interacts directly with the map, no template needed
})
export class MarkedPointsDisplayComponent implements OnChanges, OnDestroy {
  @Input() map: L.Map;
  @Input() points: MarkedPoint[];
  @Input() startPosition?: L.LatLng | null;

  private layerGroup: L.LayerGroup;

  constructor(private measurementService: MeasurementService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (!this.layerGroup) {
      this.layerGroup = L.layerGroup().addTo(this.map);
    }

    this.layerGroup.clearLayers();
    this.drawDisplay();
  }

  ngOnDestroy(): void {
    if (this.layerGroup) {
      this.layerGroup.remove();
    }
  }

  private drawDisplay(): void {
    if (this.points.length === 0) return;

    const routeStyle = { color: 'var(--color-accent-hover)', weight: 3, opacity: 0.9, dashArray: '8, 8' };
    const transparentIcon = L.divIcon({ className: 'transparent-icon', iconSize: [0, 0] });
    
    // Draw route line
    const polylinePoints = this.points.map(p => p.position);
    if (this.startPosition) {
        polylinePoints.unshift(this.startPosition);
    }
    if (polylinePoints.length > 1) {
        L.polyline(polylinePoints, routeStyle).addTo(this.layerGroup);
    }

    // Draw point markers and segment tooltips
    this.points.forEach((point, index) => {
        this.drawPointMarker(point, index);
        this.drawSegmentTooltip(point, index);
    });
  }
  
  private drawPointMarker(point: MarkedPoint, index: number): void {
    let backgroundColor = '#3b82f6'; // blue-500
    if (this.points.length > 1) {
        if (index === 0) backgroundColor = 'var(--color-success)';
        else if (index === this.points.length - 1) backgroundColor = 'var(--color-danger)';
    }
    const pointIcon = L.divIcon({
        className: 'custom-point-marker-wrapper',
        html: `<div class="custom-point-marker" style="background-color: ${backgroundColor};"><span>${point.name}</span></div>`,
        iconSize: [24, 24], iconAnchor: [12, 12],
    });
    L.marker(point.position, { icon: pointIcon }).addTo(this.layerGroup);
  }

  private drawSegmentTooltip(point: MarkedPoint, index: number): void {
    const prevPointInfo = index === 0 
        ? (this.startPosition ? { position: this.startPosition, name: 'P0' } : null) 
        : this.points[index - 1];

    if (!prevPointInfo || point.distanceFromPrevious === undefined || point.bearingFromPrevious === undefined) return;

    const midPoint = new L.LatLng(
        (prevPointInfo.position.lat + point.position.lat) / 2,
        (prevPointInfo.position.lng + point.position.lng) / 2
    );

    const pointName = point.name.replace('P', '');
    const prevPointName = prevPointInfo.name.replace('P', '');
    
    const tooltipContent = `
        <div class="font-bold">P${prevPointName}-P${pointName}</div>
        <div>D:${this.measurementService.formatDistance(point.distanceFromPrevious)}</div>
        <div>B:${Math.round(point.bearingFromPrevious)}°</div>`;
        
    L.marker(midPoint, { icon: L.divIcon({ className: 'transparent-icon', iconSize: [0,0]}) })
      .addTo(this.layerGroup)
      .bindTooltip(tooltipContent, { permanent: true, direction: 'center', className: 'segment-info-tooltip' });
  }
}
