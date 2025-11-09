
import { useState, useEffect, useCallback } from 'react';

interface DeviceOrientationState {
    heading: number | null;
    pitch: number | null;
    accuracy: number | null; // Accuracy in degrees
    error: string | null;
    requestPermission: () => Promise<void>;
}

const SMOOTHING_FACTOR = 10; // Number of recent readings to average

const useDeviceOrientation = (): DeviceOrientationState => {
    const [heading, setHeading] = useState<number | null>(null);
    const [pitch, setPitch] = useState<number | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [headingHistory, setHeadingHistory] = useState<number[]>([]);
    const [pitchHistory, setPitchHistory] = useState<number[]>([]);

    const handleOrientation = useCallback((event: DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number }) => {
        // --- HEADING ---
        let rawHeading: number | null = null;
        let rawAccuracy: number | null = null;
        if (typeof event.webkitCompassHeading === 'number') {
            rawHeading = event.webkitCompassHeading;
            if (typeof event.webkitCompassAccuracy === 'number' && event.webkitCompassAccuracy > 0) {
                rawAccuracy = event.webkitCompassAccuracy;
            }
        } 
        else if (event.alpha !== null && event.absolute) {
            rawHeading = event.alpha;
        }
        
        if (rawHeading !== null) {
            const newHistory = [...headingHistory, rawHeading];
            if (newHistory.length > SMOOTHING_FACTOR) newHistory.shift();
            setHeadingHistory(newHistory);
            
            let sumSin = 0;
            let sumCos = 0;
            for (const h of newHistory) {
                const rad = h * Math.PI / 180;
                sumSin += Math.sin(rad);
                sumCos += Math.cos(rad);
            }
            const avgSin = sumSin / newHistory.length;
            const avgCos = sumCos / newHistory.length;
            const smoothedRad = Math.atan2(avgSin, avgCos);
            let smoothedDeg = (smoothedRad * 180 / Math.PI + 360) % 360;

            setHeading(smoothedDeg);
            setAccuracy(rawAccuracy);
            setError(null);
        }

        // --- PITCH ---
        if (event.beta !== null) {
            const rawPitch = event.beta;
            const newPitchHistory = [...pitchHistory, rawPitch];
            if (newPitchHistory.length > SMOOTHING_FACTOR) newPitchHistory.shift();
            setPitchHistory(newPitchHistory);
            const smoothedPitch = newPitchHistory.reduce((a, b) => a + b, 0) / newPitchHistory.length;
            setPitch(smoothedPitch);
        }

    }, [headingHistory, pitchHistory]);
    
    const requestPermission = useCallback(async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceOrientationEvent as any).requestPermission();
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation as EventListener);
                    setError(null);
                } else {
                    setError('Device orientation permission not granted.');
                }
            } catch (err) {
                setError('Error requesting device orientation permission.');
                console.error(err);
            }
        } else {
            setError("Device orientation not supported or is disabled in your browser settings.");
        }
    }, [handleOrientation]);

    useEffect(() => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
           setError("Requires permission to enable the compass.");
        } else {
            window.addEventListener('deviceorientation', handleOrientation as EventListener);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation as EventListener);
        };
    }, [handleOrientation]);

    return { heading, pitch, accuracy, error, requestPermission };
};

export default useDeviceOrientation;