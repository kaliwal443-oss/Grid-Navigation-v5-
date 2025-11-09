import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { DrawnShape, DrawingTool } from '../types';
import { MeasurementService } from '../services/measurement.service';

@Component({
  selector: 'app-measurement-display',
  template: '', // This component interacts directly with the map, no template needed
})
export class MeasurementDisplayComponent implements OnChanges, OnDestroy {
  @Input() map: L.Map;
  @Input() shapes: DrawnShape[];
  @Input() tempPoints: L.LatLng[];
  @Input() mousePos: L.LatLng | null;
  @Input() drawingTool: DrawingTool;
  @Input() drawingColor: string;
  @Input() drawingWeight: number;

  private layerGroup: L.LayerGroup;

  constructor(public measurementService: MeasurementService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    
    if (!this.layerGroup) {
      this.layerGroup = L.layerGroup().addTo(this.map);
    }

    this.layerGroup.clearLayers();
    this.drawShapes();
    this.drawTemporaryShape();
  }

  ngOnDestroy(): void {
    if (this.layerGroup) {
      this.layerGroup.remove();
    }
  }

  private drawShapes(): void {
    this.shapes.forEach(shape => {
      if (shape.type === DrawingTool.Pen && shape.points.length > 1) {
        L.polyline(shape.points, { color: shape.color, weight: shape.weight, opacity: 0.9 })
          .addTo(this.layerGroup)
          .bindTooltip(`<strong>Distance:</strong> ${this.measurementService.formatDistance(shape.distance ?? 0)}`, {
            permanent: true,
            className: 'measurement-tooltip',
          });
      }
    });
  }

  private drawTemporaryShape(): void {
    if (this.drawingTool === DrawingTool.Pen && this.tempPoints.length > 0) {
      const pointsToDraw = this.mousePos ? [...this.tempPoints, this.mousePos] : this.tempPoints;
      L.polyline(pointsToDraw, { color: this.drawingColor, weight: this.drawingWeight, dashArray: '5, 5' }).addTo(this.layerGroup);

      if (this.mousePos) {
        const liveDistance = this.measurementService.calculateDistance(pointsToDraw);
        if (liveDistance > 0) {
          L.tooltip({ permanent: true, direction: 'right', offset: [10, 0], className: 'measurement-tooltip' })
            .setLatLng(this.mousePos)
            .setContent(`<div>${this.measurementService.formatDistance(liveDistance)}</div>`)
            .addTo(this.layerGroup);
        }
      }
    }
  }
}
