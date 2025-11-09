import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
// FIX: GeolocationState is imported from types.ts, not from the service.
import { GeolocationService } from '../services/geolocation.service';
import { GeolocationState } from '../types';
import { DeviceOrientationService, DeviceOrientationState } from '../services/device-orientation.service';
import { MeasurementService } from '../services/measurement.service';
import { CoordService } from '../services/coord.service';
import { IndianGridCoordinates, IndianGridZone } from '../types';
import { LatLng } from 'leaflet';

interface ARData {
    distance: number | null;
    bearing: number | null;
    indianGrid: IndianGridCoordinates | null;
}

@Component({
  selector: 'app-ar-page',
  templateUrl: './ar-page.component.html',
})
export class ARPageComponent implements OnInit, OnDestroy {
    @ViewChild('video') videoRef: ElementRef<HTMLVideoElement>;
    private stream: MediaStream | null = null;
    permissionError: string | null = null;

    location: GeolocationState;
    orientation: DeviceOrientationState;
    arData: ARData = { distance: null, bearing: null, indianGrid: null };
    message: string | null = null;
    isAccuracyLow = false;

    private subscriptions: Subscription[] = [];

    readonly DEFAULT_INDIAN_GRID_ZONE = IndianGridZone.IIA;
    readonly MIN_PITCH_DEG = 15;
    readonly MAX_PITCH_DEG = 85;
    readonly DEVICE_HEIGHT_METERS = 1.5;
    readonly LOW_ACCURACY_THRESHOLD = 15;

    constructor(
        private geoService: GeolocationService,
        private orientationService: DeviceOrientationService,
        private measurementService: MeasurementService,
        private coordService: CoordService
    ) {}

    ngOnInit(): void {
        this.startCamera();
        const geoSub = this.geoService.location$.subscribe(loc => {
            this.location = loc;
            this.isAccuracyLow = loc.accuracy !== null && loc.accuracy > this.LOW_ACCURACY_THRESHOLD;
            this.updateARData();
        });
        const orientationSub = this.orientationService.state$.subscribe(orient => {
            this.orientation = orient;
            this.updateARData();
        });
        this.subscriptions.push(geoSub, orientationSub);
    }

    ngOnDestroy(): void {
        this.stopCamera();
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    async startCamera(): Promise<void> {
        if (this.stream) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (this.videoRef) this.videoRef.nativeElement.srcObject = this.stream;
            this.permissionError = null;
        } catch (err) {
            this.permissionError = "Camera access denied. Please grant permission.";
        }
    }

    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            if (this.videoRef) this.videoRef.nativeElement.srcObject = null;
        }
    }

    updateARData(): void {
        const pitch = this.orientation?.pitch;
        const heading = this.orientation?.heading;

        // Reset and display message if conditions aren't met
        if (!this.location?.lat || !this.location?.lon || heading === null || pitch === null || pitch < this.MIN_PITCH_DEG || pitch > this.MAX_PITCH_DEG) {
            this.arData = { distance: null, bearing: null, indianGrid: null };
            this.updateMessage();
            return;
        }

        const distance = this.DEVICE_HEIGHT_METERS / Math.tan(pitch * (Math.PI / 180));
        if (distance < 0) return;

        const startPoint = new LatLng(this.location.lat, this.location.lon);
        const targetPoint = this.measurementService.calculateDestinationPoint(startPoint, heading, distance);
        
        this.arData = {
            distance,
            bearing: this.measurementService.calculateBearing(startPoint, targetPoint),
            indianGrid: this.coordService.convertLatLonToIndianGrid(targetPoint, this.DEFAULT_INDIAN_GRID_ZONE)
        };
        this.updateMessage();
    }
    
    updateMessage(): void {
        if (this.permissionError) { this.message = this.permissionError; return; }
        if (this.location?.error) { this.message = `GPS Error: ${this.location.error}`; return; }
        if (this.orientation?.pitch === null || this.orientation?.heading === null) { this.message = "Initializing sensors..."; return; }
        if (this.orientation.pitch < this.MIN_PITCH_DEG) { this.message = "Point device further down"; return; }
        if (this.orientation.pitch > this.MAX_PITCH_DEG) { this.message = "Aiming too close"; return; }
        this.message = null;
    }
}
