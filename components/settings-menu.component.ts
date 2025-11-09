import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { Map as LeafletMap, LatLng } from 'leaflet';
import { CoordSystem, IndianGridZone, GridSpacing, UTMCoordinates, IndianGridCoordinates, GridSettings, MapOrientationMode, Waypoint, ImageOverlayState } from '../types';
import { ProjectionRequest } from './map-page.component';
import { WaypointsService } from '../services/waypoints.service';
import { MapViewPersistenceService } from '../services/map-view-persistence.service';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-menu.component.html',
})
export class SettingsMenuComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean;
  @Input() map: LeafletMap | null;
  @Input() coordSystem: CoordSystem;
  @Input() manualZone: number | null;
  @Input() indianGridZone: IndianGridZone;
  @Input() currentUtm: UTMCoordinates | null;
  @Input() currentIndianGrid: IndianGridCoordinates | null;
  @Input() gridSettings: GridSettings;
  @Input() gridSpacing: GridSpacing;
  @Input() mapOrientationMode: MapOrientationMode;
  @Input() compassError: string | null;
  @Input() heading: number | null;
  @Input() imageOverlay: ImageOverlayState | null;
  
  @Output() close = new EventEmitter<void>();
  @Output() coordSystemChange = new EventEmitter<CoordSystem>();
  @Output() manualZoneChange = new EventEmitter<number | null>();
  @Output() indianGridZoneChange = new EventEmitter<IndianGridZone>();
  @Output() gridSettingsChange = new EventEmitter<GridSettings>();
  @Output() gridSpacingChange = new EventEmitter<GridSpacing>();
  @Output() mapOrientationModeChange = new EventEmitter<MapOrientationMode>();
  @Output() imageOverlayChange = new EventEmitter<ImageOverlayState | null>();
  @Output() goTo = new EventEmitter<any>();
  @Output() projectPoint = new EventEmitter<ProjectionRequest>();
  @Output() requestCompassPermission = new EventEmitter<void>();
  @Output() navigateToWaypoint = new EventEmitter<Waypoint>();
  @Output() saveView = new EventEmitter<void>();
  @Output() restoreView = new EventEmitter<void>();
  @Output() openOfflineManager = new EventEmitter<void>();

  @ViewChild('fileInput') fileInputRef: ElementRef<HTMLInputElement>;
  
  waypoints: Waypoint[] = [];
  isViewSaved = false;
  
  // Accordion states
  openAccordions: { [key: string]: boolean } = { 'Image Overlay': false, 'Waypoint Manager': false };

  // Projection state
  projBearing = '';
  projDistance = '';
  
  // Go To state
  goToSystem: CoordSystem = CoordSystem.IndianGrid_Everest1930;
  goToUtmZone = '';
  goToUtmHemi: 'N' | 'S' = 'N';
  goToUtmEasting = '';
  goToUtmNorthing = '';
  goToIndianZone: IndianGridZone = IndianGridZone.IIA;
  goToIndianEasting = '';
  goToIndianNorthing = '';
  
  // Image Overlay state
  keepAspectRatio = true;
  private aspectRatio = 1;

  constructor(
    private waypointsService: WaypointsService,
    private mapViewService: MapViewPersistenceService
  ) {}

  ngOnInit(): void {
    this.waypointsService.waypoints$.subscribe(w => this.waypoints = w);
    this.isViewSaved = !!this.mapViewService.getSavedView();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
      if (changes['imageOverlay'] && this.imageOverlay && this.imageOverlay.width > 0) {
          this.aspectRatio = this.imageOverlay.height / this.imageOverlay.width;
      }
  }

  toggleAccordion(name: string): void {
    this.openAccordions[name] = !this.openAccordions[name];
  }

  handleDeleteWaypoint(id: string): void {
    this.waypointsService.deleteWaypoint(id);
  }

  handleGoToSubmit(): void {
      // Logic to emit goTo event
      this.close.emit();
  }

  handlePlotProjection(): void {
      const bearing = parseFloat(this.projBearing);
      const distance = parseFloat(this.projDistance);
      if (!isNaN(bearing) && !isNaN(distance)) {
          this.projectPoint.emit({ bearing, distance });
          this.close.emit();
      }
  }
  
  handleClearProjection(): void {
      this.projectPoint.emit('clear');
      this.projBearing = '';
      this.projDistance = '';
  }

  handleImageFileChange(event: Event): void {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file && this.map) {
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
              const center = this.map.getCenter();
              const mapWidthMeters = this.map.getBounds().getSouthWest().distanceTo(this.map.getBounds().getSouthEast());
              const initialWidthMeters = mapWidthMeters * 0.5;
              this.aspectRatio = img.height / img.width;
              this.imageOverlayChange.emit({ url, center, width: initialWidthMeters, height: initialWidthMeters * this.aspectRatio, rotation: 0, opacity: 0.7 });
          };
          img.src = url;
      }
  }
  
  updateImageOverlay(props: Partial<ImageOverlayState>): void {
    if (!this.imageOverlay) return;
    let newOverlay = { ...this.imageOverlay, ...props };

    if (props.width !== undefined) {
        newOverlay.height = this.keepAspectRatio ? props.width * this.aspectRatio : newOverlay.height;
    }
    if (props.height !== undefined) {
        newOverlay.width = this.keepAspectRatio ? props.height / this.aspectRatio : newOverlay.width;
    }

    this.imageOverlayChange.emit(newOverlay);
  }
}
