import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { MarkedPoint, CoordSystem } from '../types';
import { MeasurementService } from '../services/measurement.service';

@Component({
  selector: 'app-marked-points-panel',
  templateUrl: './marked-points-panel.component.html',
})
export class MarkedPointsPanelComponent implements AfterViewChecked {
  @Input() isOpen: boolean;
  @Input() points: MarkedPoint[] = [];
  @Input() coordSystem: CoordSystem;
  @Output() closePanel = new EventEmitter<void>();
  @Output() addCurrentLocation = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();
  @Output() undo = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() goTo = new EventEmitter<MarkedPoint>();
  @Output() saveRoute = new EventEmitter<void>();

  @ViewChild('list') private listRef: ElementRef;
  private shouldScroll = false;

  constructor(public measurementService: MeasurementService) {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }
  
  ngOnChanges() {
    this.shouldScroll = true;
  }
  
  private scrollToBottom(): void {
    try {
      this.listRef.nativeElement.scrollTop = this.listRef.nativeElement.scrollHeight;
    } catch(err) { }
  }

  get totalDistance(): number {
    return this.points.length > 0 ? this.points[this.points.length - 1].totalDistance : 0;
  }

  // FIX: Rewrote method to be type-safe and correctly handle UTM and Indian Grid coordinate systems.
  getCoordsString(point: MarkedPoint): string {
    if (this.coordSystem === CoordSystem.UTM_WGS84) {
      const coords = point.coords.utm;
      if (!coords) return 'Calculating...';
      return `${coords.zone}${coords.hemisphere} ${coords.easting.toFixed(0)} E ${coords.northing.toFixed(0)} N`;
    } else {
      const coords = point.coords.indianGrid;
      if (!coords) return 'Calculating...';
      return `${coords.easting.toFixed(0)} E ${coords.northing.toFixed(0)} N`;
    }
  }
}
