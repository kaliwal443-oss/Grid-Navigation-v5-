import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polyline, Tooltip } from 'react-leaflet';
import { LatLng, Map as LeafletMap, divIcon } from 'leaflet';
import useGeolocation from '../hooks/useGeolocation';
import useDeviceOrientation from '../hooks/useDeviceOrientation';
import useWaypoints from '../hooks/useWaypoints';
import useMapViewPersistence from '../hooks/useMapViewPersistence';
import { convertLatLonToUtm, convertLatLonToIndianGrid, convertUtmToLatLon, convertIndianGridToLatLon } from '../services/coordService';
import { calculateBearing, calculateDistance, calculateDestinationPoint, formatDistance } from '../services/measurementService';
import { UTMCoordinates, IndianGridCoordinates, CoordSystem, IndianGridZone, GridSpacing, GridSettings, MarkedPoint, MapOrientationMode, Waypoint, DrawingTool, DrawnShape, ImageOverlayState } from '../types';
import SettingsMenu from './SettingsMenu';
import { Settings, LocateFixed, MapPin, Layers, Ruler, Plus, Camera } from 'lucide-react';
import IndianGrid from './IndianGrid';
import UTMGrid from './UTMGrid';
import ScaleBar from './ScaleBar';
import NorthArrow from './NorthArrow';
import MapLayerControl, { MapLayer } from './MapLayerControl';
import MarkedPointsDisplay from './MarkedPointsDisplay';
import MarkedPointsPanel from './MarkedPointsPanel';
import NavigationDisplay from './NavigationDisplay';
import { ProjectionRequest } from '../App';
import MeasurementDisplay from './MeasurementDisplay';
import DrawingTools from './DrawingTools';
import OfflineMapDownloader from './OfflineMapDownloader';
import EditableImageOverlay from './EditableImageOverlay';

const ZOOM_LEVEL_50K = 14;

declare const html2canvas: any;

const tileLayers: Record<MapLayer, { url: string; attribution: string }> = {
    Topo: { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors' },
    Street: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
    Dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' },
    Satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: 'Tiles &copy; Esri' }
};

const InfoPanel: React.FC<{
    title: string;
    indianGrid: IndianGridCoordinates | null;
    accuracy?: number | null;
    distance?: number | null;
    bearing?: number | null;
    deviceHeading?: number | null;
}> = ({ title, indianGrid, accuracy, distance, bearing, deviceHeading }) => {
    return (
        <div className="info-panel">
            <p className="info-panel-title">{title}</p>
            {indianGrid ? (
                <div className="text-xs">
                    <p><span className="info-panel-label">E:</span> {indianGrid.easting.toFixed(0)}</p>
                    <p><span className="info-panel-label">N:</span> {indianGrid.northing.toFixed(0)}</p>
                    <p><span className="info-panel-label">Zone:</span> {indianGrid.zone}</p>
                </div>
            ) : (
                <p className="text-[var(--color-text-secondary)] animate-pulse text-xs">Acquiring...</p>
            )}
            <div className="info-panel-footer">
                {accuracy !== undefined && <span>H.ACC: {accuracy !== null ? `${accuracy.toFixed(1)}m` : '--'}</span>}
                {bearing !== undefined && <span>Brg: {bearing !== null ? `${bearing.toFixed(0)}°` : '--'}</span>}
                {distance !== undefined && <span>Dist: {distance !== null ? formatDistance(distance) : '--'}</span>}
                {deviceHeading !== undefined && <span>Hdg: {deviceHeading !== null ? `${deviceHeading.toFixed(0)}°` : '--'}</span>}
            </div>
        </div>
    );
};

interface MapControlsProps {
    onCenter: () => void;
    onToggleMarkedPoints: () => void;
    isMarkedPointsPanelOpen: boolean;
    activeLayer: MapLayer;
    onLayerChange: (layer: MapLayer) => void;
    drawingTool: DrawingTool;
    setDrawingTool: (tool: DrawingTool) => void;
    setDrawnShapes: (shapes: DrawnShape[]) => void;
    setTempPoints: (points: LatLng[]) => void;
    drawingColor: string;
    setDrawingColor: (color: string) => void;
    drawingWeight: number;
    setDrawingWeight: (weight: number) => void;
    onOpenSettings: () => void;
    onCapture: () => void;
}

const MapControls: React.FC<MapControlsProps> = (props) => {
    const [isFabOpen, setIsFabOpen] = useState(false);

    return (
        <div className="absolute bottom-20 right-2 z-[1000] flex flex-col items-end space-y-2">
            {isFabOpen && (
                 <div className="flex flex-col items-end space-y-2 fab-menu-items">
                     <DrawingTools
                        activeTool={props.drawingTool}
                        onToolSelect={props.setDrawingTool}
                        onClear={() => {
                            props.setDrawnShapes([]);
                            props.setTempPoints([]);
                        }}
                        drawingColor={props.drawingColor}
                        onColorChange={props.setDrawingColor}
                        drawingWeight={props.drawingWeight}
                        onWeightChange={props.setDrawingWeight}
                    />
                    <MapLayerControl currentLayer={props.activeLayer} onLayerChange={props.onLayerChange} />
                    <button onClick={props.onToggleMarkedPoints} className={`fab-button ${props.isMarkedPointsPanelOpen ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 hover:bg-slate-600'}`} title="Mark Points"><MapPin className="h-5 w-5" /></button>
                    <button onClick={props.onCenter} className="fab-button bg-blue-600 hover:bg-blue-500" title="Center on My Location"><LocateFixed className="h-5 w-5" /></button>
                    <button onClick={props.onCapture} className="fab-button bg-slate-700 hover:bg-slate-600" title="Capture Map"><Camera className="h-5 w-5" /></button>
                    <button onClick={props.onOpenSettings} className="fab-button bg-slate-700 hover:bg-slate-600" title="Settings"><Settings className="h-5 w-5" /></button>
                 </div>
            )}
             <button onClick={() => setIsFabOpen(p => !p)} className="fab-button bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white w-14 h-14" title="Map Controls">
                <Plus className={`h-7 w-7 transition-transform duration-200 ${isFabOpen ? 'rotate-45' : ''}`} />
            </button>
        </div>
    );
};


interface MapPageProps {
    projectionRequest: ProjectionRequest;
    setProjectionRequest: (req: ProjectionRequest) => void;
    isVisible: boolean;
}

const MapPage: React.FC<MapPageProps> = ({ projectionRequest, setProjectionRequest, isVisible }) => {
    const [map, setMap] = useState<LeafletMap | null>(null);
    const location = useGeolocation();
    const { heading, requestPermission: requestCompassPermission, error: compassError } = useDeviceOrientation();
    const { waypoints, addWaypoint, deleteWaypoint, saveRouteAsWaypoints } = useWaypoints();

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isOfflineManagerOpen, setIsOfflineManagerOpen] = useState(false);
    const [coordSystem, setCoordSystem] = useState<CoordSystem>(() => (localStorage.getItem('coordSystem') as CoordSystem) || CoordSystem.IndianGrid_Everest1930);
    const [manualZone, setManualZone] = useState<number | null>(() => {
        const stored = localStorage.getItem('manualZone');
        return stored ? parseInt(stored, 10) : null;
    });
    const [indianGridZone, setIndianGridZone] = useState<IndianGridZone>(() => (localStorage.getItem('indianGridZone') as IndianGridZone) || IndianGridZone.IIA);
    const [gridSettings, setGridSettings] = useState<GridSettings>(() => {
        const stored = localStorage.getItem('gridSettings');
        return stored ? JSON.parse(stored) : { color: '#FFFFFF', opacity: 0.5, weight: 1 };
    });
    const [gridSpacing, setGridSpacing] = useState<GridSpacing>(() => (localStorage.getItem('gridSpacing') as GridSpacing) || 'Auto');
    const [mapOrientationMode, setMapOrientationMode] = useState<MapOrientationMode>(MapOrientationMode.NorthUp);
    const [mapRotation, setMapRotation] = useState(0);

    // Map State
    const [activeLayer, setActiveLayer] = useState<MapLayer>(() => (localStorage.getItem('activeLayer') as MapLayer) || 'Topo');
    const [crosshairCoords, setCrosshairCoords] = useState<{ latLon: LatLng | null; utm: UTMCoordinates | null; indianGrid: IndianGridCoordinates | null; }>({ latLon: null, utm: null, indianGrid: null });
    const [isCapturing, setIsCapturing] = useState(false);

    // Marked Points State
    const [markedPoints, setMarkedPoints] = useState<MarkedPoint[]>([]);
    const [isMarkedPointsPanelOpen, setIsMarkedPointsPanelOpen] = useState(false);
    
    // Drawing & Measurement State
    const [drawingTool, setDrawingTool] = useState<DrawingTool>(DrawingTool.None);
    const [drawnShapes, setDrawnShapes] = useState<DrawnShape[]>([]);
    const [tempPoints, setTempPoints] = useState<LatLng[]>([]);
    const isDrawing = useRef(false);
    const [mousePos, setMousePos] = useState<LatLng | null>(null);
    const [drawingColor, setDrawingColor] = useState<string>('#f59e0b');
    const [drawingWeight, setDrawingWeight] = useState<number>(3);

    // Navigation State
    const [navigatingTo, setNavigatingTo] = useState<MarkedPoint | null>(null);

    // Projection State
    const [projectedPoint, setProjectedPoint] = useState<{ position: LatLng; indianGrid: IndianGridCoordinates | null } | null>(null);

    // Image Overlay State
    const [imageOverlay, setImageOverlay] = useState<ImageOverlayState | null>(null);

    // Map View Persistence
    const { saveMapView, savedView } = useMapViewPersistence(map, activeLayer);

    useEffect(() => {
        if (!map) return;
        if (drawingTool === DrawingTool.Pen) {
            map.dragging.disable();
        } else {
            map.dragging.enable();
        }
    }, [map, drawingTool]);

    // Persist settings to localStorage
    useEffect(() => { localStorage.setItem('coordSystem', coordSystem); }, [coordSystem]);
    useEffect(() => { manualZone ? localStorage.setItem('manualZone', String(manualZone)) : localStorage.removeItem('manualZone'); }, [manualZone]);
    useEffect(() => { localStorage.setItem('indianGridZone', indianGridZone); }, [indianGridZone]);
    useEffect(() => { localStorage.setItem('gridSettings', JSON.stringify(gridSettings)); }, [gridSettings]);
    useEffect(() => { localStorage.setItem('gridSpacing', gridSpacing); }, [gridSpacing]);
    useEffect(() => { localStorage.setItem('activeLayer', activeLayer); }, [activeLayer]);

    const currentPosition = useMemo(() => location.lat && location.lon ? new LatLng(location.lat, location.lon) : null, [location.lat, location.lon]);
    const currentUtm = useMemo(() => currentPosition ? convertLatLonToUtm(currentPosition, manualZone ?? undefined) : null, [currentPosition, manualZone]);
    const currentIndianGrid = useMemo(() => currentPosition ? convertLatLonToIndianGrid(currentPosition, indianGridZone) : null, [currentPosition, indianGridZone]);

    useEffect(() => {
        if (map && isVisible) {
            setTimeout(() => map.invalidateSize(true), 100);
        }
    }, [map, isVisible]);
    
    useEffect(() => {
        if (mapOrientationMode === MapOrientationMode.HeadUp && heading !== null) {
            setMapRotation(-heading);
            if (map && currentPosition) {
                map.setView(currentPosition, map.getZoom(), { animate: true, pan: { duration: 0.5 } });
            }
        }
    }, [heading, mapOrientationMode, map, currentPosition]);

    useEffect(() => {
        if (!projectionRequest) return;

        if (projectionRequest === 'clear') {
            setProjectedPoint(null);
        } else if (typeof projectionRequest === 'object' && currentPosition) {
            const { bearing, distance } = projectionRequest;
            const destination = calculateDestinationPoint(currentPosition, bearing, distance);
            setProjectedPoint({
                position: destination,
                indianGrid: convertLatLonToIndianGrid(destination, indianGridZone),
            });
            map?.flyTo(destination, map.getZoom());
        }
        setProjectionRequest(null);

    }, [projectionRequest, currentPosition, indianGridZone, map, setProjectionRequest]);

    const mapContainerStyle: React.CSSProperties = mapOrientationMode === MapOrientationMode.HeadUp ? {
        '--map-rotation': `${mapRotation}deg`,
        '--map-rotation-reverse': `${-mapRotation}deg`
    } as React.CSSProperties : {};
    
    const handleGoTo = useCallback((coords: ({ system: CoordSystem; zone: string; easting: string; northing: string; hemisphere?: 'N' | 'S' }) | LatLng) => {
        if (!map) return;
        let latLng: LatLng | null = null;

        if (coords instanceof LatLng) {
            latLng = coords;
        } else {
            const eastingNum = parseFloat(coords.easting);
            const northingNum = parseFloat(coords.northing);

            if (isNaN(eastingNum) || isNaN(northingNum)) return;

            if (coords.system === CoordSystem.UTM_WGS84) {
                if (!coords.hemisphere) return; // Hemisphere is required
                const utmCoords: UTMCoordinates = { zone: parseInt(coords.zone, 10), easting: eastingNum, northing: northingNum, hemisphere: coords.hemisphere };
                latLng = convertUtmToLatLon(utmCoords);
            } else {
                const indianGridCoords: IndianGridCoordinates = { zone: coords.zone as IndianGridZone, easting: eastingNum, northing: northingNum };
                latLng = convertIndianGridToLatLon(indianGridCoords);
            }
        }
        if (latLng) {
            map.flyTo(latLng, ZOOM_LEVEL_50K);
            const targetPoint: MarkedPoint = {
                id: `goto-${Date.now()}`,
                name: `Coordinates`,
                position: latLng,
                coords: {
                    utm: convertLatLonToUtm(latLng, manualZone ?? undefined),
                    indianGrid: convertLatLonToIndianGrid(latLng, indianGridZone),
                },
                totalDistance: 0,
            };
            setNavigatingTo(targetPoint);
        }
    }, [map, indianGridZone, manualZone]);


    const handleCenterMap = useCallback(() => {
        if (map && currentPosition) map.flyTo(currentPosition, ZOOM_LEVEL_50K);
    }, [map, currentPosition]);

    const handleMarkPoint = useCallback((latlng: LatLng) => {
        setMarkedPoints(prevPoints => {
            const lastPoint = prevPoints.length > 0 ? prevPoints[prevPoints.length - 1] : null;
            const startOfLeg = lastPoint?.position ?? currentPosition;
            const prevTotalDist = lastPoint?.totalDistance ?? 0;
            
            const distFromPrev = startOfLeg ? latlng.distanceTo(startOfLeg) : 0;

            const newPoint: MarkedPoint = {
                id: String(Date.now()),
                name: `P${prevPoints.length + 1}`,
                position: latlng,
                coords: {
                    utm: convertLatLonToUtm(latlng),
                    indianGrid: convertLatLonToIndianGrid(latlng, indianGridZone),
                },
                distanceFromPrevious: distFromPrev,
                bearingFromPrevious: startOfLeg ? calculateBearing(startOfLeg, latlng) : 0,
                totalDistance: prevTotalDist + distFromPrev,
            };
            return [...prevPoints, newPoint];
        });
    }, [indianGridZone, currentPosition]);
    
    const handleAddCurrentLocation = useCallback(() => {
        if (currentPosition) handleMarkPoint(currentPosition);
    }, [currentPosition, handleMarkPoint]);

    const handleFinalizeShape = useCallback(() => {
        isDrawing.current = false;
        setTempPoints(currentTempPoints => {
            if (currentTempPoints.length < 2) return [];
            const newShape: DrawnShape = {
                id: String(Date.now()),
                type: drawingTool,
                points: [...currentTempPoints],
                color: drawingColor,
                weight: drawingWeight,
                distance: calculateDistance(currentTempPoints),
            };
            setDrawnShapes(prev => [...prev, newShape]);
            return [];
        });
    }, [drawingTool, drawingColor, drawingWeight]);

    const handleStartNavigation = useCallback((waypoint: Waypoint) => {
        const targetPoint: MarkedPoint = {
            id: waypoint.id, name: waypoint.name, position: new LatLng(waypoint.position.lat, waypoint.position.lng),
            coords: waypoint.coords, totalDistance: 0
        };
        setNavigatingTo(targetPoint);
        setIsSettingsOpen(false);
    }, []);
    
    const handleSaveRoute = useCallback(() => {
        if (markedPoints.length > 0) saveRouteAsWaypoints(markedPoints);
        setIsMarkedPointsPanelOpen(false);
    }, [markedPoints, saveRouteAsWaypoints]);

    const handleRestoreView = useCallback(() => {
        if (map && savedView) {
            map.flyTo([savedView.lat, savedView.lng], savedView.zoom);
            setActiveLayer(savedView.layer);
        }
    }, [map, savedView]);
    
    const handleCaptureMap = useCallback(async () => {
        if (!map) return;
    
        setIsCapturing(true);
        const mapContainer = map.getContainer();
    
        try {
            const canvas = await html2canvas(mapContainer, {
                useCORS: true,
                logging: false,
                backgroundColor: null,
                scale: 3, // Higher scale for better resolution
                foreignObjectRendering: true, // Crucial for SVG grid lines
                onclone: (clonedDoc) => {
                    // Find all panes that Leaflet might have transformed
                    const panes = clonedDoc.querySelectorAll('.leaflet-map-pane, .leaflet-tile-pane, .leaflet-overlay-pane, .leaflet-shadow-pane, .leaflet-marker-pane');

                    panes.forEach(pane => {
                        const htmlPane = pane as HTMLElement;
                        const transform = window.getComputedStyle(htmlPane).transform;
                        
                        if (!transform || transform === 'none') {
                            return;
                        }

                        // Regex to extract translation values from matrix() or matrix3d()
                        // For matrix(a, b, c, d, tx, ty), it captures tx and ty.
                        // For matrix3d(..., m, n, o, p), it captures m (tx) and n (ty).
                        const matrixRegex = /matrix(?:3d)?\((?:[^,]+,){4,12}\s*([^,]+),\s*([^,]+)(?:,[^)]+)?\)/;
                        const match = transform.match(matrixRegex);

                        if (match && match.length >= 3) {
                            const x = parseFloat(match[1]) || 0;
                            const y = parseFloat(match[2]) || 0;
                            
                            const originalTop = parseFloat(htmlPane.style.top) || 0;
                            const originalLeft = parseFloat(htmlPane.style.left) || 0;
                            
                            htmlPane.style.top = `${originalTop + y}px`;
                            htmlPane.style.left = `${originalLeft + x}px`;
                            htmlPane.style.transform = 'none';
                        }
                    });
                },
            });

            const link = document.createElement('a');
            link.download = `grid-nav-capture-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    
        } catch (err) {
            console.error("Map capture failed:", err);
            alert("Map capture failed. Check browser console for details.");
        } finally {
            setIsCapturing(false);
        }
    }, [map]);

    const MapEvents = () => {
        useMapEvents({
            move: (e) => setCrosshairCoords({
                latLon: e.target.getCenter(),
                utm: convertLatLonToUtm(e.target.getCenter()),
                indianGrid: convertLatLonToIndianGrid(e.target.getCenter(), indianGridZone),
            }),
            click: (e) => {
                if (isMarkedPointsPanelOpen && drawingTool === DrawingTool.None) handleMarkPoint(e.latlng);
            },
            // Mouse Events
            mousedown: (e) => { 
                if (drawingTool === DrawingTool.Pen) { 
                    e.originalEvent.preventDefault();
                    isDrawing.current = true; 
                    setTempPoints([e.latlng]); 
                }
            },
            mousemove: (e) => { 
                setMousePos(e.latlng);
                if (isDrawing.current) {
                    setTempPoints(prev => [...prev, e.latlng]);
                }
            },
            mouseup: handleFinalizeShape,
            mouseout: handleFinalizeShape,

            // Touch Events
            touchstart: (e) => {
                if (drawingTool === DrawingTool.Pen) {
                    e.originalEvent.preventDefault();
                    isDrawing.current = true;
                    setTempPoints([e.latlng]);
                }
            },
            touchmove: (e) => {
                setMousePos(e.latlng);
                if (isDrawing.current) {
                    setTempPoints(prev => [...prev, e.latlng]);
                }
            },
            touchend: handleFinalizeShape,
        });
        return null;
    };
    
    const CurrentPositionMarker = () => {
        if (!currentPosition) return null;
        const rotationAngle = navigatingTo ? calculateBearing(currentPosition, navigatingTo.position) : (heading ?? 0);
        const icon = divIcon({
            className: 'current-position-marker-wrapper',
            html: `<div class="current-position-marker-container" style="transform: rotate(${rotationAngle}deg);">
                     <svg viewBox="0 0 24 24" class="current-position-marker-svg ${navigatingTo ? 'navigating' : ''}">
                       <path d="M12 2L21 20L12 17L3 20L12 2Z" />
                     </svg>
                   </div>`,
            iconSize: [32, 32], iconAnchor: [16, 16]
        });
        return <Marker position={currentPosition} icon={icon} />;
    };

    const distanceToCursor = currentPosition && crosshairCoords.latLon ? currentPosition.distanceTo(crosshairCoords.latLon) : null;
    const bearingToCursor = currentPosition && crosshairCoords.latLon ? calculateBearing(currentPosition, crosshairCoords.latLon) : null;
    
    return (
        <div className={`w-full h-full relative ${drawingTool !== DrawingTool.None ? 'cursor-crosshair drawing-active' : 'cursor-default'} ${mapOrientationMode === MapOrientationMode.HeadUp ? 'map-mode-head-up' : ''} ${isCapturing ? 'capturing' : ''}`} style={mapContainerStyle}>
            <style>{`
                .capturing .info-panel,
                .capturing .crosshair-marker,
                .capturing .current-position-marker-wrapper,
                .capturing .absolute.bottom-20.right-2, /* MapControls */
                .capturing .absolute.top-12.right-2,   /* NorthArrow */
                .capturing .absolute.bottom-5.left-2,  /* ScaleBar */
                .capturing .navigation-panel-container {
                    display: none !important;
                }
            `}</style>
            <div className="absolute top-2 left-2 right-2 z-[1000] flex justify-between pointer-events-none gap-2">
                <InfoPanel title="CURRENT" indianGrid={currentIndianGrid} accuracy={location.accuracy} />
                <InfoPanel title="CURSOR" indianGrid={crosshairCoords.indianGrid} bearing={bearingToCursor} distance={distanceToCursor} deviceHeading={heading} />
            </div>
            
            {navigatingTo && currentPosition && <NavigationDisplay targetPoint={navigatingTo} currentPosition={currentPosition} currentHeading={heading} onStop={() => setNavigatingTo(null)} />}
            
            <MapContainer ref={setMap} center={[28.6139, 77.2090]} zoom={ZOOM_LEVEL_50K} className="h-full w-full" doubleClickZoom={drawingTool === DrawingTool.None}>
                <TileLayer url={tileLayers[activeLayer].url} attribution={tileLayers[activeLayer].attribution} />
                <MapEvents />
                <CurrentPositionMarker />
                {imageOverlay && <EditableImageOverlay overlay={imageOverlay} onOverlayChange={setImageOverlay} />}
                <MarkedPointsDisplay points={markedPoints} startPosition={currentPosition} />
                <MeasurementDisplay shapes={drawnShapes} tempPoints={tempPoints} mousePos={mousePos} drawingTool={drawingTool} drawingColor={drawingColor} drawingWeight={drawingWeight} />
                {navigatingTo && currentPosition && <Polyline positions={[currentPosition, navigatingTo.position]} pathOptions={{ color: 'var(--color-accent)', weight: 3, opacity: 0.8, dashArray: '10, 10' }} />}
                {projectedPoint && currentPosition && <Polyline positions={[currentPosition, projectedPoint.position]} pathOptions={{ color: 'var(--color-success)', weight: 2, opacity: 0.9, dashArray: '10, 10' }} />}
                {projectedPoint && (
                    <Marker position={projectedPoint.position} icon={divIcon({
                        className: 'projection-marker',
                        html: `<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
                        iconSize: [32, 32], iconAnchor: [16, 32]
                    })}>
                        <Tooltip permanent direction="top" offset={[0, -32]} className="projection-tooltip">
                            <div className="font-bold text-center">Projected Point</div>
                            {projectedPoint.indianGrid && <div className="font-mono text-xs">
                                <p>E: {projectedPoint.indianGrid.easting.toFixed(0)}</p><p>N: {projectedPoint.indianGrid.northing.toFixed(0)}</p><p>Zone: {projectedPoint.indianGrid.zone}</p>
                            </div>}
                        </Tooltip>
                    </Marker>
                )}
                {coordSystem === CoordSystem.UTM_WGS84 && <UTMGrid {...gridSettings} forcedZone={manualZone} gridSpacing={gridSpacing} />}
                {coordSystem === CoordSystem.IndianGrid_Everest1930 && <IndianGrid {...gridSettings} zone={indianGridZone} gridSpacing={gridSpacing} />}
                <ScaleBar />
                <div className="crosshair-marker">+</div>
            </MapContainer>
            
            <div className="absolute top-12 right-2 z-[1000]">
                <NorthArrow heading={heading} orientationMode={mapOrientationMode} onModeChange={setMapOrientationMode} compassError={compassError} onRequestPermission={requestCompassPermission} />
            </div>
            
            <MapControls 
                onCenter={handleCenterMap}
                onToggleMarkedPoints={() => setIsMarkedPointsPanelOpen(p => !p)}
                isMarkedPointsPanelOpen={isMarkedPointsPanelOpen}
                activeLayer={activeLayer}
                onLayerChange={setActiveLayer}
                drawingTool={drawingTool}
                setDrawingTool={setDrawingTool}
                setDrawnShapes={setDrawnShapes}
                setTempPoints={setTempPoints}
                drawingColor={drawingColor}
                setDrawingColor={setDrawingColor}
                drawingWeight={drawingWeight}
                setDrawingWeight={setDrawingWeight}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onCapture={handleCaptureMap}
            />
            
            <MarkedPointsPanel 
                isOpen={isMarkedPointsPanelOpen}
                onClosePanel={() => setIsMarkedPointsPanelOpen(false)}
                points={markedPoints}
                coordSystem={coordSystem}
                onAddCurrentLocation={handleAddCurrentLocation}
                onDelete={(id) => setMarkedPoints(pts => pts.filter(p => p.id !== id))}
                onUndo={() => setMarkedPoints(pts => pts.slice(0, -1))}
                onClear={() => setMarkedPoints([])}
                onGoTo={(point) => {
                    if (map) {
                        map.flyTo(point.position, map.getZoom() > ZOOM_LEVEL_50K ? map.getZoom() : ZOOM_LEVEL_50K);
                    }
                    setNavigatingTo(point);
                    setIsMarkedPointsPanelOpen(false);
                }}
                onSaveRoute={handleSaveRoute}
            />

            <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} map={map} coordSystem={coordSystem} setCoordSystem={setCoordSystem}
                manualZone={manualZone} setManualZone={setManualZone} indianGridZone={indianGridZone} setIndianGridZone={setIndianGridZone}
                currentUtm={currentUtm} currentIndianGrid={currentIndianGrid} onGoTo={handleGoTo} gridSettings={gridSettings} setGridSettings={setGridSettings}
                gridSpacing={gridSpacing} setGridSpacing={setGridSpacing} mapOrientationMode={mapOrientationMode} setMapOrientationMode={setMapOrientationMode}
                compassError={compassError} onRequestCompassPermission={requestCompassPermission} waypoints={waypoints} onDeleteWaypoint={deleteWaypoint}
                onNavigateToWaypoint={handleStartNavigation} onProjectPoint={setProjectionRequest} heading={heading} onSaveView={saveMapView}
                onRestoreView={handleRestoreView} isViewSaved={!!savedView} onOpenOfflineManager={() => setIsOfflineManagerOpen(true)}
                imageOverlay={imageOverlay} setImageOverlay={setImageOverlay}
            />

            <OfflineMapDownloader isOpen={isOfflineManagerOpen} onClose={() => setIsOfflineManagerOpen(false)} map={map} currentTileUrl={tileLayers[activeLayer].url} />
        </div>
    );
};

export default MapPage;