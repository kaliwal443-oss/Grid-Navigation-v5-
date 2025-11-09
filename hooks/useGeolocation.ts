import { useState, useEffect } from 'react';
import { GeolocationState } from '../types';

const useGeolocation = (): GeolocationState => {
    const [state, setState] = useState<GeolocationState>({
        lat: null,
        lon: null,
        error: null,
        permissionState: null,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState(s => ({ ...s, error: 'Geolocation is not supported by your browser' }));
            return;
        }

        const checkPermission = async () => {
            try {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                setState(s => ({ ...s, permissionState: permission.state }));

                permission.onchange = () => {
                    setState(s => ({ ...s, permissionState: permission.state }));
                };
            } catch (error) {
                 // Might fail on older browsers, but geolocation might still work
                 console.warn("Permission query failed, falling back to direct access.");
            }
        }
        checkPermission();
        
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setState({
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
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Geolocation permission denied.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'The request to get user location timed out.';
                        break;
                }
                 setState(s => ({ ...s, error: errorMessage }));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    return state;
};

export default useGeolocation;