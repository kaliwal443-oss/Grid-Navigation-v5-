import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OfflineRegionInfo } from '../types';
import { MapUtilsService } from './map-utils.service';
import { LatLngBounds } from 'leaflet';

@Injectable({ providedIn: 'root' })
export class OfflineMapsService {
    private readonly OFFLINE_REGIONS_KEY = 'grid-nav-offline-regions';
    private regionsSubject = new BehaviorSubject<OfflineRegionInfo[]>([]);
    
    public regions$ = this.regionsSubject.asObservable();

    constructor(private mapUtils: MapUtilsService) {
        this.loadRegions();
    }

    private loadRegions(): void {
        try {
            const stored = localStorage.getItem(this.OFFLINE_REGIONS_KEY);
            if (stored) {
                this.regionsSubject.next(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load offline regions:", error);
        }
    }

    private saveRegions(regions: OfflineRegionInfo[]): void {
        try {
            localStorage.setItem(this.OFFLINE_REGIONS_KEY, JSON.stringify(regions));
            this.regionsSubject.next(regions);
        } catch (error) {
            console.error("Failed to save offline regions:", error);
        }
    }

    addRegion(region: Omit<OfflineRegionInfo, 'id' | 'createdAt'>): void {
        const newRegion: OfflineRegionInfo = {
            ...region,
            id: String(Date.now()),
            createdAt: new Date().toISOString(),
        };
        const updatedRegions = [...this.regionsSubject.getValue(), newRegion];
        this.saveRegions(updatedRegions);
    }

    deleteRegion(regionId: string): void {
        const regionToDelete = this.regionsSubject.getValue().find(r => r.id === regionId);
        if (!regionToDelete) return;

        // Post message to service worker to delete cached tiles
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            const bounds = new LatLngBounds(regionToDelete.bounds._southWest, regionToDelete.bounds._northEast);
            const urlsToDelete = this.mapUtils.getTileUrlsForBounds(bounds, regionToDelete.minZoom, regionToDelete.maxZoom, regionToDelete.layerUrl);
            navigator.serviceWorker.controller.postMessage({
                type: 'DELETE_TILES',
                urls: urlsToDelete,
            });
        }

        const updatedRegions = this.regionsSubject.getValue().filter(r => r.id !== regionId);
        this.saveRegions(updatedRegions);
    }
}
