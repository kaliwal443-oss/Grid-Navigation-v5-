import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Map as LeafletMap } from 'leaflet';
import { OfflineMapsService } from '../services/offline-maps.service';
import { MapUtilsService } from '../services/map-utils.service';
import { OfflineRegionInfo } from '../types';

const MAX_TILES_TO_DOWNLOAD = 5000;
const MIN_DOWNLOAD_ZOOM = 10;
const MAX_DOWNLOAD_ZOOM = 16;

@Component({
  selector: 'app-offline-map-downloader',
  templateUrl: './offline-map-downloader.component.html',
})
export class OfflineMapDownloaderComponent {
  @Input() isOpen: boolean;
  @Input() map: LeafletMap | null;
  @Input() currentTileUrl: string;
  @Output() close = new EventEmitter<void>();

  regions$ = this.offlineMapsService.regions$;
  regionName = '';
  isDownloading = false;
  progress = { current: 0, total: 0 };
  error: string | null = null;

  constructor(
    private offlineMapsService: OfflineMapsService,
    private mapUtils: MapUtilsService
  ) {}

  async handleDownload(): Promise<void> {
    if (!this.map || !this.regionName.trim()) {
      this.error = "Please provide a name for the region.";
      return;
    }
    this.error = null;
    this.isDownloading = true;
    this.progress = { current: 0, total: 0 };

    const bounds = this.map.getBounds();
    const minZoom = Math.max(MIN_DOWNLOAD_ZOOM, Math.floor(this.map.getZoom()));
    const maxZoom = MAX_DOWNLOAD_ZOOM;

    const urlsToDownload = this.mapUtils.getTileUrlsForBounds(bounds, minZoom, maxZoom, this.currentTileUrl);

    if (urlsToDownload.length > MAX_TILES_TO_DOWNLOAD || urlsToDownload.length === 0) {
      this.error = urlsToDownload.length > MAX_TILES_TO_DOWNLOAD 
        ? `Too many tiles (${urlsToDownload.length}). Please zoom in.`
        : "No tiles to download for this view.";
      this.isDownloading = false;
      return;
    }

    this.progress.total = urlsToDownload.length;
    for (const url of urlsToDownload) {
      try {
        await fetch(url, { mode: 'no-cors' });
      } catch (err) {
        console.warn(`Could not fetch tile ${url}:`, err);
      }
      this.progress.current++;
    }

    this.offlineMapsService.addRegion({
      name: this.regionName.trim(),
      bounds: { _southWest: bounds.getSouthWest(), _northEast: bounds.getNorthEast() },
      minZoom, maxZoom, tileCount: urlsToDownload.length, layerUrl: this.currentTileUrl,
    });
    this.regionName = '';
    this.isDownloading = false;
  }

  handleDelete(region: OfflineRegionInfo): void {
    if (window.confirm(`Are you sure you want to delete "${region.name}"?`)) {
      this.offlineMapsService.deleteRegion(region.id);
    }
  }
}
