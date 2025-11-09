import { Injectable } from '@angular/core';
import { Map as LeafletMap } from 'leaflet';
import { MapLayer } from '../components/map-layer-control.component';

export interface SavedMapView {
    lat: number;
    lng: number;
    zoom: number;
    layer: MapLayer;
}

@Injectable({ providedIn: 'root' })
export class MapViewPersistenceService {
    private readonly MAP_VIEW_STORAGE_KEY = 'grid-nav-map-view';
    private savedView: SavedMapView | null = null;

    constructor() {
        this.loadView();
    }

    private loadView(): void {
        try {
            const storedView = localStorage.getItem(this.MAP_VIEW_STORAGE_KEY);
            if (storedView) {
                this.savedView = JSON.parse(storedView);
            }
        } catch (error) {
            console.error("Failed to load map view from localStorage", error);
        }
    }

    public saveMapView(map: LeafletMap | null, activeLayer: MapLayer): void {
        if (!map) return;
        try {
            const viewToSave: SavedMapView = {
                lat: map.getCenter().lat,
                lng: map.getCenter().lng,
                zoom: map.getZoom(),
                layer: activeLayer,
            };
            localStorage.setItem(this.MAP_VIEW_STORAGE_KEY, JSON.stringify(viewToSave));
            this.savedView = viewToSave;
            // Optionally, provide user feedback here
        } catch (error) {
            console.error("Failed to save map view to localStorage", error);
        }
    }

    public getSavedView(): SavedMapView | null {
        return this.savedView;
    }
}
