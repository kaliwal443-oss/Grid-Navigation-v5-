import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const SMOOTHING_FACTOR = 10;

export interface DeviceOrientationState {
    heading: number | null;
    pitch: number | null;
    accuracy: number | null;
    error: string | null;
}

@Injectable({ providedIn: 'root' })
export class DeviceOrientationService {
    private state = new BehaviorSubject<DeviceOrientationState>({ heading: null, pitch: null, accuracy: null, error: null });
    public state$: Observable<DeviceOrientationState> = this.state.asObservable();

    private headingHistory: number[] = [];
    private pitchHistory: number[] = [];

    constructor() {
        this.init();
    }

    private init(): void {
        if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
            window.addEventListener('deviceorientation', this.handleOrientation);
        } else {
            this.state.next({ ...this.state.getValue(), error: "Requires permission to enable the compass." });
        }
    }

    public async requestPermission(): Promise<void> {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceOrientationEvent as any).requestPermission();
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', this.handleOrientation);
                    this.state.next({ ...this.state.getValue(), error: null });
                } else {
                    this.state.next({ ...this.state.getValue(), error: 'Device orientation permission not granted.' });
                }
            } catch (err) {
                this.state.next({ ...this.state.getValue(), error: 'Error requesting device orientation permission.' });
            }
        }
    }

    private handleOrientation = (event: DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number }) => {
        const currentState = this.state.getValue();
        let { heading, pitch, accuracy, error } = currentState;

        // --- HEADING ---
        let rawHeading: number | null = null;
        let rawAccuracy: number | null = null;
        if (typeof event.webkitCompassHeading === 'number') {
            rawHeading = event.webkitCompassHeading;
            if (typeof event.webkitCompassAccuracy === 'number' && event.webkitCompassAccuracy > 0) rawAccuracy = event.webkitCompassAccuracy;
        } else if (event.alpha !== null && event.absolute) {
            rawHeading = 360 - event.alpha; // Correction for standard definition
        }
        
        if (rawHeading !== null) {
            this.headingHistory.push(rawHeading);
            if (this.headingHistory.length > SMOOTHING_FACTOR) this.headingHistory.shift();
            
            let sumSin = 0, sumCos = 0;
            for (const h of this.headingHistory) {
                const rad = h * Math.PI / 180;
                sumSin += Math.sin(rad);
                sumCos += Math.cos(rad);
            }
            heading = (Math.atan2(sumSin, sumCos) * 180 / Math.PI + 360) % 360;
            accuracy = rawAccuracy;
            error = null;
        }

        // --- PITCH ---
        if (event.beta !== null) {
            this.pitchHistory.push(event.beta);
            if (this.pitchHistory.length > SMOOTHING_FACTOR) this.pitchHistory.shift();
            pitch = this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
        }
        
        this.state.next({ heading, pitch, accuracy, error });
    }

    ngOnDestroy() {
        window.removeEventListener('deviceorientation', this.handleOrientation);
    }
}
