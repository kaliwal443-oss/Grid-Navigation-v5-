import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { ImageOverlayState } from '../types';
import { MeasurementService } from '../services/measurement.service';

@Component({
  selector: 'app-editable-image-overlay',
  template: '', // No template, manipulates map directly
})
export class EditableImageOverlayComponent implements OnChanges, OnDestroy {
  @Input() map: L.Map;
  @Input() overlay: ImageOverlayState;
  @Output() overlayChange = new EventEmitter<ImageOverlayState | null>();

  private marker: L.Marker;

  constructor(private measurementService: MeasurementService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (!this.marker) {
      this.createMarker();
    }
    this.updateMarker();
  }

  ngOnDestroy(): void {
    if (this.marker) {
      this.marker.remove();
    }
    this.map?.off('zoomend', this.updateMarker);
  }

  private createMarker(): void {
    this.marker = L.marker([this.overlay.center.lat, this.overlay.center.lng], {
      draggable: true,
    }).addTo(this.map);

    this.marker.on('dragend', (e) => {
      const newCenter = e.target.getLatLng();
      this.overlayChange.emit({
        ...this.overlay,
        center: { lat: newCenter.lat, lng: newCenter.lng },
      });
    });

    this.map.on('zoomend', this.updateMarker);
  }

  private updateMarker = () => {
    if (!this.marker) return;

    const centerLatLng = new L.LatLng(this.overlay.center.lat, this.overlay.center.lng);
    const { width, height } = this.calculatePixelSize(centerLatLng, this.overlay.width, this.overlay.height);

    if (width === 0 || height === 0) return;

    const icon = L.divIcon({
      className: 'editable-image-overlay',
      html: `
        <div style="transform: rotate(${this.overlay.rotation}deg); width: 100%; height: 100%; position: relative; cursor: move;">
            <img src="${this.overlay.url}" style="width: 100%; height: 100%; opacity: ${this.overlay.opacity};" />
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background-color: rgba(0, 0, 0, 0.6); border-radius: 50%; padding: 6px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>
            </div>
        </div>`,
      iconSize: [width, height],
      iconAnchor: [width / 2, height / 2],
    });

    this.marker.setLatLng(centerLatLng);
    this.marker.setIcon(icon);
  }

  private calculatePixelSize(centerLatLng: L.LatLng, widthMeters: number, heightMeters: number): { width: number, height: number } {
    const northPoint = this.measurementService.calculateDestinationPoint(centerLatLng, 0, heightMeters / 2);
    const southPoint = this.measurementService.calculateDestinationPoint(centerLatLng, 180, heightMeters / 2);
    const eastPoint = this.measurementService.calculateDestinationPoint(centerLatLng, 90, widthMeters / 2);
    const westPoint = this.measurementService.calculateDestinationPoint(centerLatLng, 270, widthMeters / 2);

    const bounds = new L.LatLngBounds(
        new L.LatLng(southPoint.lat, westPoint.lng),
        new L.LatLng(northPoint.lat, eastPoint.lng)
    );

    const swPoint = this.map.latLngToLayerPoint(bounds.getSouthWest());
    const nePoint = this.map.latLngToLayerPoint(bounds.getNorthEast());
    
    return {
      width: Math.abs(nePoint.x - swPoint.x),
      height: Math.abs(swPoint.y - nePoint.y)
    };
  }
}
