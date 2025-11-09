import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { LatLng } from 'leaflet';
import { MarkedPoint } from '../types';
import { MeasurementService } from '../services/measurement.service';

@Component({
  selector: 'app-navigation-display',
  templateUrl: './navigation-display.component.html',
})
export class NavigationDisplayComponent implements OnChanges {
  @Input() targetPoint: MarkedPoint;
  @Input() currentPosition: LatLng;
  @Input() currentHeading: number | null;
  @Output() stop = new EventEmitter<void>();

  distance = 0;
  bearing = 0;
  rotation = 0;
  isOnBearing = false;
  private wasOnBearing = false;

  private readonly BEARING_TOLERANCE = 5;

  constructor(public measurementService: MeasurementService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.targetPoint && this.currentPosition) {
      this.distance = this.currentPosition.distanceTo(this.targetPoint.position);
      this.bearing = this.measurementService.calculateBearing(this.currentPosition, this.targetPoint.position);
      this.rotation = this.currentHeading !== null ? this.bearing - this.currentHeading : 0;
      
      const headingDifference = this.currentHeading !== null ? Math.abs(((this.bearing - this.currentHeading + 180) % 360) - 180) : Infinity;
      this.isOnBearing = headingDifference <= this.BEARING_TOLERANCE;

      if (this.isOnBearing && !this.wasOnBearing) {
        this.playBeep();
      }
      this.wasOnBearing = this.isOnBearing;
    }
  }

  playBeep(): void {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }
}
