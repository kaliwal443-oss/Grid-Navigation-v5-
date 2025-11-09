import { Injectable } from '@angular/core';
import { LatLngBounds } from 'leaflet';

@Injectable({ providedIn: 'root' })
export class MapUtilsService {

    private lon2tile(lon: number, zoom: number): number {
        return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    }

    private lat2tile(lat: number, zoom: number): number {
        return Math.floor(
            ((1 -
                Math.log(
                    Math.tan((lat * Math.PI) / 180) +
                    1 / Math.cos((lat * Math.PI) / 180)
                ) /
                Math.PI) /
                2) *
            Math.pow(2, zoom)
        );
    }

    getTileUrlsForBounds(
        bounds: LatLngBounds,
        minZoom: number,
        maxZoom: number,
        urlTemplate: string
    ): string[] {
        const urls: string[] = [];
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        for (let z = minZoom; z <= maxZoom; z++) {
            const startX = this.lon2tile(sw.lng, z);
            const endX = this.lon2tile(ne.lng, z);
            const startY = this.lat2tile(ne.lat, z);
            const endY = this.lat2tile(sw.lat, z);

            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    const url = urlTemplate
                        .replace('{s}', ['a', 'b', 'c'][Math.floor(Math.random() * 3)])
                        .replace('{z}', String(z))
                        .replace('{x}', String(x))
                        .replace('{y}', String(y));
                    urls.push(url);
                }
            }
        }
        return urls;
    }
}
