import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
// FIX: GeolocationState is imported from types.ts, not from the service.
import { GeolocationService } from '../services/geolocation.service';
import { GeolocationState } from '../types';

interface ConstellationData { name: string; prefix: string; color: string; range?: [number, number]; values?: number[]; }
interface SatelliteInfo { id: string; constellation: string; color: string; elevation: number; azimuth: number; snr: number; }

@Component({
  selector: 'app-gps-satellite-page',
  templateUrl: './gps-satellite-page.component.html',
})
export class GpsSatellitePageComponent implements OnInit, OnDestroy {
  location: GeolocationState;
  satellites: SatelliteInfo[] = [];
  private geoSub: Subscription;

  private constellationData: Record<string, ConstellationData> = {
    GPS: { name: 'GPS', prefix: 'G', color: '#4285F4', range: [1, 32] },
    GLONASS: { name: 'GLONASS', prefix: 'R', color: '#DB4437', range: [65, 96] },
    BeiDou: { name: 'BeiDou', prefix: 'B', color: '#F4B400', range: [201, 237] },
    Galileo: { name: 'Galileo', prefix: 'E', color: '#0F9D58', range: [301, 336] },
    SBAS: { name: 'SBAS', prefix: 'S', color: '#9C27B0', values: [120, 122, 124, 125, 126, 127, 128, 129, 131, 133, 134, 135, 137, 138, 139, 140, 141] },
    QZSS: { name: 'QZSS', prefix: 'Q', color: '#FF6F00', range: [193, 197] }
  };

  constructor(private geolocationService: GeolocationService) {}

  ngOnInit(): void {
    this.geoSub = this.geolocationService.location$.subscribe(location => {
      this.location = location;
      this.generateSatellites(location.accuracy);
    });
  }

  ngOnDestroy(): void {
    this.geoSub.unsubscribe();
  }

  private generateSatellites(accuracy: number | null): void {
    let numSatellites = accuracy === null ? 0 : accuracy > 50 ? 6 : accuracy > 20 ? 8 : accuracy > 10 ? 12 : accuracy > 5 ? 15 : 18;
    let snrRange = accuracy === null ? {min:0, max:0} : accuracy > 50 ? { min: 10, max: 25 } : accuracy > 20 ? { min: 15, max: 30 } : accuracy > 10 ? { min: 20, max: 35 } : accuracy > 5 ? { min: 25, max: 45 } : { min: 30, max: 50 };

    const constellationKeys = Object.keys(this.constellationData);
    const usedIds = new Set<string>();
    const generatedSatellites: SatelliteInfo[] = [];

    for (let i = 0; i < numSatellites; i++) {
        const data = this.constellationData[constellationKeys[Math.floor(Math.random() * constellationKeys.length)]];
        let satIdNum: number;
        if (data.range) satIdNum = Math.floor(Math.random() * (data.range[1] - data.range[0] + 1)) + data.range[0];
        else satIdNum = data.values![Math.floor(Math.random() * data.values!.length)];
        const satIdStr = `${data.prefix}${satIdNum}`;
        if (usedIds.has(satIdStr)) { i--; continue; }
        usedIds.add(satIdStr);
        generatedSatellites.push({
            id: satIdStr, constellation: data.name, color: data.color,
            elevation: Math.floor(Math.random() * 90), azimuth: Math.floor(Math.random() * 360),
            snr: Math.floor(Math.random() * (snrRange.max - snrRange.min + 1)) + snrRange.min,
        });
    }
    this.satellites = generatedSatellites.sort((a, b) => b.snr - a.snr);
  }

  getDirection(h: number | null): string {
    if (h === null) return '';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.floor(((h + 22.5) % 360) / 45)];
  }

  getSatelliteTransform(sat: SatelliteInfo): string {
    const distance = 48 - (sat.elevation / 90) * 48;
    const x = 50 + distance * Math.cos((sat.azimuth - 90) * (Math.PI / 180));
    const y = 50 + distance * Math.sin((sat.azimuth - 90) * (Math.PI / 180));
    return `translate(${x}, ${y})`;
  }
}
