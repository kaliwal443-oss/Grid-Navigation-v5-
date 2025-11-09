import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { LatLng } from 'leaflet';
// FIX: GeolocationState is imported from types.ts, not from the service.
import { GeolocationService } from '../services/geolocation.service';
import { GeolocationState } from '../types';
import { AstroService, SunTimes } from '../services/astro.service';
import { CoordService } from '../services/coord.service';
import { IndianGridZone, IndianGridCoordinates } from '../types';

interface AstroData {
  sunTimes: SunTimes;
  moonTimes: { rise?: Date; set?: Date; alwaysUp?: boolean; alwaysDown?: boolean; };
  indianGrid: IndianGridCoordinates | null;
}

@Component({
  selector: 'app-sun-moon-page',
  templateUrl: './sun-moon-page.component.html',
})
export class SunMoonPageComponent implements OnInit, OnDestroy {
  date = new Date();
  location: GeolocationState;
  astroData: AstroData | null = null;
  private geoSub: Subscription;

  // Moon display state
  moonDisplayHour = new Date().getHours();
  moonDisplayDate = new Date();
  moonPositionData: any;
  moonIlluminationData: any;

  constructor(
    private geolocationService: GeolocationService,
    private astroService: AstroService,
    private coordService: CoordService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.geoSub = this.geolocationService.location$.subscribe(location => {
      this.location = location;
      this.calculateAstroData();
    });
  }

  ngOnDestroy(): void {
    this.geoSub.unsubscribe();
  }

  onDateChange(dateString: string): void {
    if (dateString) {
      this.date = new Date(dateString);
      this.calculateAstroData();
    }
  }

  calculateAstroData(): void {
    if (this.location?.lat !== null && this.location?.lon !== null) {
      this.astroData = {
        sunTimes: this.astroService.getTimes(this.date, this.location.lat, this.location.lon),
        moonTimes: this.astroService.getMoonTimes(this.date, this.location.lat, this.location.lon),
        indianGrid: this.coordService.convertLatLonToIndianGrid(new LatLng(this.location.lat, this.location.lon), IndianGridZone.IIA)
      };
      this.updateMoonDisplayData();
    }
  }

  updateMoonDisplayData(): void {
    if (!this.location?.lat || !this.location?.lon) return;
    this.moonDisplayDate = new Date(this.date);
    this.moonDisplayDate.setHours(this.moonDisplayHour, 0, 0, 0);
    this.moonPositionData = this.astroService.getMoonPosition(this.moonDisplayDate, this.location.lat, this.location.lon);
    this.moonIlluminationData = this.astroService.getMoonIllumination(this.moonDisplayDate);
    this.cd.detectChanges();
  }

  formatTime(d?: Date): string {
    return d && !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  }

  formatDateInput(d: Date): string {
    const tz_offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz_offset).toISOString().slice(0, 16);
  }

  getPhaseName(p: number): string {
    if (p < 0.03 || p > 0.97) return "New Moon";
    if (p < 0.22) return "Waxing Crescent";
    if (p < 0.28) return "First Quarter";
    if (p < 0.47) return "Waxing Gibbous";
    if (p < 0.53) return "Full Moon";
    if (p < 0.72) return "Waning Gibbous";
    if (p < 0.78) return "Last Quarter";
    return "Waning Crescent";
  }

  getSliderBackground(): string {
    if (!this.astroData?.moonTimes) return '#374151';
    const { alwaysUp, alwaysDown, rise, set } = this.astroData.moonTimes;
    if (alwaysUp) return 'linear-gradient(to right, #fbbf24 0%, #fbbf24 100%)';
    if (alwaysDown) return 'linear-gradient(to right, #374151 0%, #374151 100%)';
    const riseHour = rise?.getHours();
    const setHour = set?.getHours();
    if (riseHour === undefined || setHour === undefined) return '#374151';

    const rP = (riseHour / 23) * 100, sP = (setHour / 23) * 100;
    if (riseHour < setHour) return `linear-gradient(to right, #374151 ${rP}%, #fbbf24 ${rP}%, #fbbf24 ${sP}%, #374151 ${sP}%)`;
    return `linear-gradient(to right, #fbbf24 ${sP}%, #374151 ${sP}%, #374151 ${rP}%, #fbbf24 ${rP}%)`;
  }
}
