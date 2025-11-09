import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { GeolocationState } from '../types';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private state: GeolocationState = {
      lat: null, lon: null, error: null, permissionState: null, accuracy: null,
      altitude: null, altitudeAccuracy: null, heading: null, speed: null,
  };
  private locationSubject = new BehaviorSubject<GeolocationState>(this.state);

  public location$: Observable<GeolocationState> = this.locationSubject.asObservable();

  constructor() {
    this.initGeolocation();
  }

  private initGeolocation(): void {
    if (!navigator.geolocation) {
      this.updateState({ error: 'Geolocation is not supported by your browser' });
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then(permission => {
        this.updateState({ permissionState: permission.state });
        permission.onchange = () => this.updateState({ permissionState: permission.state });
    });

    navigator.geolocation.watchPosition(
      (position) => {
        this.updateState({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          error: null,
          permissionState: 'granted',
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        });
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED: errorMessage = 'Geolocation permission denied.'; break;
          case error.POSITION_UNAVAILABLE: errorMessage = 'Location information is unavailable.'; break;
          case error.TIMEOUT: errorMessage = 'The request to get user location timed out.'; break;
        }
        this.updateState({ error: errorMessage });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  private updateState(newState: Partial<GeolocationState>): void {
    this.state = { ...this.state, ...newState };
    this.locationSubject.next(this.state);
  }
}
