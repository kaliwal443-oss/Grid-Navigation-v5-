import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MapOrientationMode } from '../types';

@Component({
  selector: 'app-north-arrow',
  templateUrl: './north-arrow.component.html',
})
export class NorthArrowComponent {
  @Input() heading: number | null;
  @Input() orientationMode: MapOrientationMode;
  @Input() compassError: string | null;
  @Output() modeChange = new EventEmitter<MapOrientationMode>();
  @Output() requestPermission = new EventEmitter<void>();

  readonly MapOrientationMode = MapOrientationMode;

  handleClick(): void {
    if (this.compassError && this.compassError.includes("permission")) {
      this.requestPermission.emit();
      return;
    }
    const newMode = this.orientationMode === MapOrientationMode.NorthUp 
        ? MapOrientationMode.HeadUp 
        : MapOrientationMode.NorthUp;
    this.modeChange.emit(newMode);
  }

  get rotationStyle() {
    return {
        transform: (this.orientationMode === MapOrientationMode.HeadUp || this.heading === null) ? 'rotate(0deg)' : `rotate(${-this.heading}deg)`,
        transition: 'transform 0.1s ease-out',
    };
  }

  get title(): string {
    return this.orientationMode === MapOrientationMode.HeadUp
        ? `Mode: Head Up. Tap for North Up.`
        : `Mode: North Up. Tap for Head Up.`;
  }
}
