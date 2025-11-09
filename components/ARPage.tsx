import React, { useState, useEffect, useRef } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import useDeviceOrientation from '../hooks/useDeviceOrientation';
import { calculateDestinationPoint, calculateBearing } from '../services/measurementService';
import { convertLatLonToIndianGrid } from '../services/coordService';
import { IndianGridCoordinates, IndianGridZone } from '../types';
import { CameraOff, AlertTriangle } from 'lucide-react';

const DEFAULT_INDIAN_GRID_ZONE = IndianGridZone.IIA;
const MIN_PITCH_DEG = 15;
const MAX_PITCH_DEG = 85;
const DEVICE_HEIGHT_METERS = 1.5;
const LOW_ACCURACY_THRESHOLD = 15; // meters

interface ARData {
    distance: number | null;
    bearing: number | null;
    indianGrid: IndianGridCoordinates | null;
}

const ARPage: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    
    const location = useGeolocation();
    const { heading, pitch } = useDeviceOrientation();
    
    const [arData, setArData] = useState<ARData>({ distance: null, bearing: null, indianGrid: null });

    useEffect(() => {
        const startCamera = async () => {
            if (streamRef.current) return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setPermissionError(null);
            } catch (err) {
                setPermissionError("Camera access denied. Please grant permission.");
            }
        };
        const stopCamera = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                if (videoRef.current) videoRef.current.srcObject = null;
            }
        };
        if (isVisible) startCamera();
        else stopCamera();
        return stopCamera;
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible || !location.lat || !location.lon || heading === null || pitch === null || pitch < MIN_PITCH_DEG || pitch > MAX_PITCH_DEG) {
            setArData({ distance: null, bearing: null, indianGrid: null });
            return;
        }

        const distance = DEVICE_HEIGHT_METERS / Math.tan(pitch * (Math.PI / 180));
        if (distance < 0) return;

        const startPoint = { lat: location.lat, lng: location.lon };
        const targetPoint = calculateDestinationPoint(startPoint, heading, distance);
        
        setArData({
            distance,
            bearing: calculateBearing(startPoint, targetPoint),
            indianGrid: convertLatLonToIndianGrid(targetPoint, DEFAULT_INDIAN_GRID_ZONE)
        });

    }, [isVisible, location, heading, pitch]);
    
    const getMessage = () => {
        if (permissionError) return <div className="ar-message error"><CameraOff className="mx-auto mb-2" size={32} /><p>{permissionError}</p></div>;
        if (location.error) return <div className="ar-message warning"><AlertTriangle className="mx-auto mb-2" size={32} /><p>GPS Error: {location.error}</p></div>;
        if (pitch === null || heading === null) return <p>Initializing sensors...</p>;
        if (pitch < MIN_PITCH_DEG) return <p>Point device further down</p>;
        if (pitch > MAX_PITCH_DEG) return <p>Aiming too close</p>;
        return null;
    };

    const message = getMessage();
    const isAccuracyLow = location.accuracy !== null && location.accuracy > LOW_ACCURACY_THRESHOLD;

    return (
        <div className="h-full w-full relative bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="crosshair-marker">+</div>
                {arData.distance !== null && arData.bearing !== null && !message && (
                    <div className="ar-crosshair-data">
                        <span>Dist: {arData.distance.toFixed(0)}m</span>
                        <span>Brg: {arData.bearing.toFixed(0)}°</span>
                    </div>
                )}
            </div>
            <div className="absolute top-4 left-4 right-4 z-10 pointer-events-auto">
                 <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-sm font-mono shadow-xl border border-[var(--color-surface-light)] w-full max-w-md mx-auto">
                    <p className="info-panel-title text-center">CROSSHAIR TARGET</p>
                    {arData.indianGrid && !message ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div><p className="info-panel-label">Easting:</p><p className="text-lg">{arData.indianGrid.easting.toFixed(0)}</p></div>
                            <div><p className="info-panel-label">Northing:</p><p className="text-lg">{arData.indianGrid.northing.toFixed(0)}</p></div>
                            <div><p className="info-panel-label">Distance:</p><p className={`text-lg ${isAccuracyLow ? 'text-yellow-400' : ''}`}>{arData.distance?.toFixed(0)} <small>±{location.accuracy?.toFixed(0)}m</small></p></div>
                            <div><p className="info-panel-label">Bearing:</p><p className="text-lg">{arData.bearing?.toFixed(0)}°</p></div>
                        </div>
                    ) : (
                        <div className="text-center text-lg text-[var(--color-text-secondary)] py-4 h-[76px] flex items-center justify-center">{message || "Acquiring lock..."}</div>
                    )}
                    {isAccuracyLow && <div className="ar-message warning text-xs mt-2"><AlertTriangle size={16} className="mr-2"/>Low GPS accuracy. Readings may be imprecise.</div>}
                 </div>
            </div>
        </div>
    );
};

export default ARPage;