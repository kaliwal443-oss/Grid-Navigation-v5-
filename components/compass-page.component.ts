import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DeviceOrientationService, DeviceOrientationState } from '../services/device-orientation.service';

@Component({
  selector: 'app-compass-page',
  templateUrl: './compass-page.component.html',
})
export class CompassPageComponent implements OnInit, OnDestroy {
  orientation: DeviceOrientationState;
  private orientationSub: Subscription;
  
  calibrationOffset = 0;
  isCalibrating = false;
  displayHeading: number | null = null;

  constructor(public orientationService: DeviceOrientationService) {}

  ngOnInit(): void {
    const savedOffset = localStorage.getItem('compassCalibrationOffset');
    if (savedOffset) this.calibrationOffset = parseFloat(savedOffset);

    this.orientationSub = this.orientationService.state$.subscribe(orientation => {
      this.orientation = orientation;
      this.displayHeading = orientation.heading !== null ? (orientation.heading + this.calibrationOffset + 360) % 360 : null;
    });
  }

  ngOnDestroy(): void {
    this.orientationSub.unsubscribe();
  }

  handleSetOffset(newOffset: number): void {
    this.calibrationOffset = newOffset;
    localStorage.setItem('compassCalibrationOffset', newOffset.toString());
  }

  getDirection(h: number | null): string {
    if (h === null) return '--';
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(h / 22.5) % 16];
  }
}
