import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { GeolocationService } from '../services/geolocation.service';
import { DeviceOrientationService } from '../services/device-orientation.service';
import { WaypointsService } from '../services/waypoints.service';
import { MapViewPersistenceService, SavedMapView } from '../services/map-view-persistence.service';
import { CoordService } from '../services/coord.service';
import { MeasurementService } from '../services/measurement.service';
import { GeolocationState, UTMCoordinates, IndianGridCoordinates, CoordSystem, IndianGridZone, GridSpacing, GridSettings, MarkedPoint, MapOrientationMode, Waypoint, DrawingTool, DrawnShape, ImageOverlayState } from '../types';
import { MapLayer } from './map-layer-control.component';

// Declare html2canvas to avoid TypeScript errors
declare const html2canvas: any;

export type ProjectionRequest = { bearing: number; distance: number } | 'clear' | null;

@Component({
  selector: 'app-map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.css']
})
export class MapPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer: ElementRef;
  
  // Expose enums to the template
  public readonly DrawingTool = DrawingTool;
  public readonly MapOrientationMode = MapOrientationMode;
  public readonly CoordSystem = CoordSystem;

  // Component State
  map: L.Map;
  location: GeolocationState;
  deviceOrientation: any;
  waypoints: Waypoint[] = [];
  
  // Settings State
  isSettingsOpen = false;
  isOfflineManagerOpen = false;
  isFabOpen = false;
  coordSystem: CoordSystem = (localStorage.getItem('coordSystem') as CoordSystem) || CoordSystem.IndianGrid_Everest1930;
  manualZone: number | null = localStorage.getItem('manualZone') ? parseInt(localStorage.getItem('manualZone')!, 10) : null;
  indianGridZone: IndianGridZone = (localStorage.getItem('indianGridZone') as IndianGridZone) || IndianGridZone.IIA;
  gridSettings: GridSettings = localStorage.getItem('gridSettings') ? JSON.parse(localStorage.getItem('gridSettings')!) : { color: '#FFFFFF', opacity: 0.5, weight: 1 };
  gridSpacing: GridSpacing = (localStorage.getItem('gridSpacing') as GridSpacing) || 'Auto';
  mapOrientationMode: MapOrientationMode = MapOrientationMode.NorthUp;
  mapRotation = 0;

  // Map State
  activeLayer: MapLayer = (localStorage.getItem('activeLayer') as MapLayer) || 'Topo';
  crosshairCoords: { latLon: L.LatLng | null; utm: UTMCoordinates | null; indianGrid: IndianGridCoordinates | null; } = { latLon: null, utm: null, indianGrid: null };
  isCapturing = false;

  // Marked Points State
  markedPoints: MarkedPoint[] = [];
  isMarkedPointsPanelOpen = false;
  
  // Drawing & Measurement State
  drawingTool: DrawingTool = DrawingTool.None;
  drawnShapes: DrawnShape[] = [];
  tempPoints: L.LatLng[] = [];
  isDrawing = false;
  mousePos: L.LatLng | null = null;
  drawingColor: string = '#f59e0b';
  drawingWeight: number = 3;

  // Navigation & Projection State
  navigatingTo: MarkedPoint | null = null;
  projectedPoint: { position: L.LatLng; indianGrid: IndianGridCoordinates | null } | null = null;
  projectionRequest: ProjectionRequest = null;

  // Image Overlay State
  imageOverlay: ImageOverlayState | null = null;

  // Derived State
  currentPosition: L.LatLng | null = null;
  currentUtm: UTMCoordinates | null = null;
  currentIndianGrid: IndianGridCoordinates | null = null;
  distanceToCursor: number | null = null;
  bearingToCursor: number | null = null;

  // Other properties
  savedView: SavedMapView | null;
  private subscriptions: Subscription[] = [];
  readonly ZOOM_LEVEL_50K = 14;
  readonly tileLayers: Record<MapLayer, { url: string; attribution: string }> = {
    Topo: { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attribution: '&copy; OpenTopoMap' },
    Street: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; OpenStreetMap' },
    Dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: '&copy; CARTO' },
    Satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: 'Tiles &copy; Esri' }
  };
  private currentTileLayer: L.TileLayer;
  private currentPositionMarker: L.Marker | null = null;
  private markedPointMarkers: L.Marker[] = [];
  private markedPointsPolyline: L.Polyline | null = null;

  constructor(
    public geoService: GeolocationService,
    public orientationService: DeviceOrientationService,
    public waypointsService: WaypointsService,
    public mapViewService: MapViewPersistenceService,
    private coordService: CoordService,
    public measurementService: MeasurementService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const geoSub = this.geoService.location$.subscribe(loc => {
      this.location = loc;
      this.updateCurrentPosition();
      this.updateCursorInfo();
    });
    
    const orientationSub = this.orientationService.state$.subscribe(orientation => {
      this.deviceOrientation = orientation;
      if (this.mapOrientationMode === MapOrientationMode.HeadUp && orientation.heading !== null) {
        this.mapRotation = -orientation.heading;
        if (this.map && this.currentPosition) {
          this.map.setView(this.currentPosition, this.map.getZoom(), { animate: true, pan: { duration: 0.5 } });
        }
      }
    });
    
    const waypointsSub = this.waypointsService.waypoints$.subscribe(wp => this.waypoints = wp);

    this.savedView = this.mapViewService.getSavedView();
    
    this.subscriptions.push(geoSub, orientationSub, waypointsSub);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (this.map || !this.mapContainer) return;

    const initialCenter: L.LatLngTuple = this.savedView ? [this.savedView.lat, this.savedView.lng] : [28.6139, 77.2090];
    const initialZoom = this.savedView ? this.savedView.zoom : this.ZOOM_LEVEL_50K;
    if (this.savedView) this.activeLayer = this.savedView.layer;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    this.currentTileLayer = L.tileLayer(this.tileLayers[this.activeLayer].url, {
      attribution: this.tileLayers[this.activeLayer].attribution
    }).addTo(this.map);

    this.setupMapEvents();
    this.updateCrosshairCoords(); // Initial call
  }

  private setupMapEvents(): void {
    this.map.on('move', () => this.updateCrosshairCoords());
    this.map.on('click', (e: L.LeafletMouseEvent) => {
        if (this.isMarkedPointsPanelOpen && this.drawingTool === DrawingTool.None) this.handleMarkPoint(e.latlng);
    });
    // Drawing events
    this.map.on('mousedown', (e: L.LeafletMouseEvent) => { 
        if (this.drawingTool === DrawingTool.Pen) { L.DomEvent.preventDefault(e.originalEvent); this.isDrawing = true; this.tempPoints = [e.latlng]; }
    });
    this.map.on('mousemove', (e: L.LeafletMouseEvent) => { 
        this.mousePos = e.latlng;
        if (this.isDrawing) this.tempPoints = [...this.tempPoints, e.latlng];
    });
    this.map.on('mouseup mouseout', () => this.handleFinalizeShape());
  }
  
  // Data Update & Calculation Methods
  private updateCurrentPosition(): void {
    if (this.location.lat && this.location.lon) {
      this.currentPosition = new L.LatLng(this.location.lat, this.location.lon);
      this.currentUtm = this.coordService.convertLatLonToUtm(this.currentPosition, this.manualZone ?? undefined);
      this.currentIndianGrid = this.coordService.convertLatLonToIndianGrid(this.currentPosition, this.indianGridZone);
      this.updateCurrentPositionMarker();
    } else {
      this.currentPosition = null;
      this.currentUtm = null;
      this.currentIndianGrid = null;
    }
  }
  
  private updateCrosshairCoords(): void {
    if (!this.map) return;
    const center = this.map.getCenter();
    this.crosshairCoords = {
      latLon: center,
      utm: this.coordService.convertLatLonToUtm(center),
      indianGrid: this.coordService.convertLatLonToIndianGrid(center, this.indianGridZone),
    };
    this.updateCursorInfo();
  }
  
  private updateCursorInfo(): void {
    if (this.currentPosition && this.crosshairCoords.latLon) {
      this.distanceToCursor = this.currentPosition.distanceTo(this.crosshairCoords.latLon);
      this.bearingToCursor = this.measurementService.calculateBearing(this.currentPosition, this.crosshairCoords.latLon);
    } else {
      this.distanceToCursor = null;
      this.bearingToCursor = null;
    }
  }
  
  private updateCurrentPositionMarker(): void {
    if (!this.map || !this.currentPosition) return;

    const rotationAngle = this.navigatingTo 
      ? this.measurementService.calculateBearing(this.currentPosition, this.navigatingTo.position) 
      : (this.deviceOrientation?.heading ?? 0);
    
    const icon = L.divIcon({
        className: 'current-position-marker-wrapper',
        html: `<div class="current-position-marker-container" style="transform: rotate(${rotationAngle}deg);">
                 <svg viewBox="0 0 24 24" class="current-position-marker-svg ${this.navigatingTo ? 'navigating' : ''}">
                   <path d="M12 2L21 20L12 17L3 20L12 2Z" />
                 </svg>
               </div>`,
        iconSize: [32, 32], iconAnchor: [16, 16]
    });

    if (!this.currentPositionMarker) {
      this.currentPositionMarker = L.marker(this.currentPosition, { icon }).addTo(this.map);
    } else {
      this.currentPositionMarker.setLatLng(this.currentPosition);
      this.currentPositionMarker.setIcon(icon);
    }
  }

  // Event Handlers
  handleCenterMap(): void {
    if (this.map && this.currentPosition) this.map.flyTo(this.currentPosition, this.ZOOM_LEVEL_50K);
  }
  
  handleLayerChange(layer: MapLayer): void {
    this.activeLayer = layer;
    localStorage.setItem('activeLayer', layer);
    if (this.currentTileLayer) {
        this.currentTileLayer.setUrl(this.tileLayers[layer].url);
    }
  }

  handleMarkPoint(latlng: L.LatLng): void {
    const lastPoint = this.markedPoints.length > 0 ? this.markedPoints[this.markedPoints.length - 1] : null;
    const startOfLeg = lastPoint?.position ?? this.currentPosition;
    const prevTotalDist = lastPoint?.totalDistance ?? 0;
    const distFromPrev = startOfLeg ? latlng.distanceTo(startOfLeg) : 0;

    const newPoint: MarkedPoint = {
        id: String(Date.now()),
        name: `P${this.markedPoints.length + 1}`,
        position: latlng,
        coords: {
            utm: this.coordService.convertLatLonToUtm(latlng),
            indianGrid: this.coordService.convertLatLonToIndianGrid(latlng, this.indianGridZone),
        },
        distanceFromPrevious: distFromPrev,
        bearingFromPrevious: startOfLeg ? this.measurementService.calculateBearing(startOfLeg, latlng) : 0,
        totalDistance: prevTotalDist + distFromPrev,
    };
    this.markedPoints = [...this.markedPoints, newPoint];
  }
  
  handleAddCurrentLocation(): void {
    if (this.currentPosition) this.handleMarkPoint(this.currentPosition);
  }

  handleFinalizeShape(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.tempPoints.length < 2) {
      this.tempPoints = [];
      return;
    }
    const newShape: DrawnShape = {
        id: String(Date.now()),
        type: this.drawingTool,
        points: [...this.tempPoints],
        color: this.drawingColor,
        weight: this.drawingWeight,
        distance: this.measurementService.calculateDistance(this.tempPoints),
    };
    this.drawnShapes = [...this.drawnShapes, newShape];
    this.tempPoints = [];
  }

  handleGoTo(coords: any): void {
    if (!this.map) return;
    let latLng: L.LatLng | null = null;
  
    if (coords instanceof L.LatLng) {
        latLng = coords;
    } else {
        const eastingNum = parseFloat(coords.easting);
        const northingNum = parseFloat(coords.northing);
  
        if (isNaN(eastingNum) || isNaN(northingNum)) return;
  
        if (coords.system === CoordSystem.UTM_WGS84) {
            if (!coords.hemisphere) return;
            const utmCoords: UTMCoordinates = { zone: parseInt(coords.zone, 10), easting: eastingNum, northing: northingNum, hemisphere: coords.hemisphere };
            latLng = this.coordService.convertUtmToLatLon(utmCoords);
        } else {
            const indianGridCoords: IndianGridCoordinates = { zone: coords.zone as IndianGridZone, easting: eastingNum, northing: northingNum };
            latLng = this.coordService.convertIndianGridToLatLon(indianGridCoords);
        }
    }
    if (latLng) {
        this.map.flyTo(latLng, this.ZOOM_LEVEL_50K);
        const targetPoint: MarkedPoint = {
            id: `goto-${Date.now()}`,
            name: `Coordinates`,
            position: latLng,
            coords: {
                utm: this.coordService.convertLatLonToUtm(latLng, this.manualZone ?? undefined),
                indianGrid: this.coordService.convertLatLonToIndianGrid(latLng, this.indianGridZone),
            },
            totalDistance: 0,
        };
        this.navigatingTo = targetPoint;
    }
  }

  handleSaveRoute(): void {
    if (this.markedPoints.length > 0) this.waypointsService.saveRouteAsWaypoints(this.markedPoints);
    this.isMarkedPointsPanelOpen = false;
  }
  
  restoreView(): void {
    if (this.map && this.savedView) {
        this.map.flyTo([this.savedView.lat, this.savedView.lng], this.savedView.zoom);
        this.handleLayerChange(this.savedView.layer);
    }
  }

  saveMapView(): void {
    this.mapViewService.saveMapView(this.map, this.activeLayer);
    this.savedView = this.mapViewService.getSavedView();
  }
  
  handleStartNavigation(waypoint: Waypoint): void {
      const targetPoint: MarkedPoint = {
          id: waypoint.id, name: waypoint.name, position: new L.LatLng(waypoint.position.lat, waypoint.position.lng),
          coords: waypoint.coords, totalDistance: 0
      };
      this.navigatingTo = targetPoint;
      this.isSettingsOpen = false;
  }
  
  handleCaptureMap = async () => {
    // This function needs to be adapted for Angular's DOM interaction if used.
    // For now, it's just a placeholder.
    console.log("Capture map functionality to be implemented.");
  }

}