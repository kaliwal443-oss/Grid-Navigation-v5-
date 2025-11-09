import { Component, Input, OnDestroy, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-scale-bar',
  templateUrl: './scale-bar.component.html',
})
export class ScaleBarComponent implements AfterViewInit, OnDestroy {
  @Input() map: L.Map;

  scaleInfo = { ratioText: '1 : --', barText: '--', barWidth: 0 };

  ngAfterViewInit(): void {
    if (this.map) {
      this.map.on('moveend zoomend', this.updateScale);
      this.updateScale();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off('moveend zoomend', this.updateScale);
    }
  }

  updateScale = () => {
    if (!this.map) return;
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const earthCircumference = 40075016.686;
    const metersPerPixel = earthCircumference * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom + 8);
    const scale = metersPerPixel / 0.0002645833;
    const ratioText = `1 : ${Math.round(scale).toLocaleString('en-US')}`;

    const possibleDistances = [1, 2, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
    const maxBarWidthPx = 100;
    
    let idealMeters = 0, minDiff = Infinity;
    for (const dist of possibleDistances) {
        const width = dist / metersPerPixel;
        const diff = Math.abs(width - maxBarWidthPx);
        if (diff < minDiff) {
            minDiff = diff;
            idealMeters = dist;
        }
    }
    const barWidth = idealMeters / metersPerPixel;
    const barText = idealMeters < 1000 ? `${idealMeters} m` : `${idealMeters / 1000} km`;

    this.scaleInfo = { ratioText, barText, barWidth };
  }
}
