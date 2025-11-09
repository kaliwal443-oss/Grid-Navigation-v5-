import React, { useState, useEffect, useRef } from 'react';
import { Map as LeafletMap, LatLng } from 'leaflet';
import { X, Trash2, LocateFixed, ChevronDown, Compass, ImageUp } from 'lucide-react';
import { CoordSystem, IndianGridZone, GridSpacing, UTMCoordinates, IndianGridCoordinates, GridSettings, MapOrientationMode, Waypoint, ImageOverlayState } from '../types';
import { ProjectionRequest } from '../App';

interface SettingsMenuProps {
    isOpen: boolean; onClose: () => void; map: LeafletMap | null; coordSystem: CoordSystem; setCoordSystem: (system: CoordSystem) => void;
    manualZone: number | null; setManualZone: (zone: number | null) => void; indianGridZone: IndianGridZone; setIndianGridZone: (zone: IndianGridZone) => void;
    currentUtm: UTMCoordinates | null; currentIndianGrid: IndianGridCoordinates | null;
    onGoTo: (coords: ({ system: CoordSystem; zone: string; easting: string; northing: string; hemisphere?: 'N' | 'S' }) | LatLng) => void;
    gridSettings: GridSettings; setGridSettings: (settings: GridSettings) => void; gridSpacing: GridSpacing; setGridSpacing: (spacing: GridSpacing) => void;
    mapOrientationMode: MapOrientationMode; setMapOrientationMode: (mode: MapOrientationMode) => void;
    compassError: string | null; onRequestCompassPermission: () => void; waypoints: Waypoint[]; onDeleteWaypoint: (id: string) => void;
    onNavigateToWaypoint: (waypoint: Waypoint) => void; onProjectPoint: (req: ProjectionRequest) => void; heading: number | null;
    onSaveView: () => void; onRestoreView: () => void; isViewSaved: boolean; onOpenOfflineManager: () => void;
    imageOverlay: ImageOverlayState | null; setImageOverlay: (overlay: ImageOverlayState | null) => void;
}

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="settings-accordion-item">
            <button onClick={() => setIsOpen(!isOpen)} className="settings-accordion-header" aria-expanded={isOpen}>
                <span>{title}</span>
                <ChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={18} />
            </button>
            {isOpen && <div className="settings-accordion-content">{children}</div>}
        </div>
    );
};

const SettingsMenu: React.FC<SettingsMenuProps> = (props) => {
    const [projBearing, setProjBearing] = useState('');
    const [projDistance, setProjDistance] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [keepAspectRatio, setKeepAspectRatio] = useState(true);
    const aspectRatioRef = useRef(1);

    // Go To States
    const [goToSystem, setGoToSystem] = useState<CoordSystem>(CoordSystem.IndianGrid_Everest1930);
    const [goToUtmZone, setGoToUtmZone] = useState('');
    const [goToUtmHemi, setGoToUtmHemi] = useState<'N' | 'S'>('N');
    const [goToUtmEasting, setGoToUtmEasting] = useState('');
    const [goToUtmNorthing, setGoToUtmNorthing] = useState('');
    const [goToIndianZone, setGoToIndianZone] = useState<IndianGridZone>(IndianGridZone.IIA);
    const [goToIndianEasting, setGoToIndianEasting] = useState('');
    const [goToIndianNorthing, setGoToIndianNorthing] = useState('');


    useEffect(() => {
        if (props.isOpen && props.imageOverlay && props.imageOverlay.width > 0) {
            aspectRatioRef.current = props.imageOverlay.height / props.imageOverlay.width;
        }
    }, [props.isOpen, props.imageOverlay]);

    if (!props.isOpen) return null;

    const handleGoToSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (goToSystem === CoordSystem.UTM_WGS84) {
             if (!goToUtmZone || !goToUtmEasting || !goToUtmNorthing) return;
             props.onGoTo({
                system: CoordSystem.UTM_WGS84,
                zone: goToUtmZone,
                hemisphere: goToUtmHemi,
                easting: goToUtmEasting,
                northing: goToUtmNorthing
             });
        } else {
            if (!goToIndianEasting || !goToIndianNorthing) return;
            props.onGoTo({
                system: CoordSystem.IndianGrid_Everest1930,
                zone: goToIndianZone,
                easting: goToIndianEasting,
                northing: goToIndianNorthing
            });
        }
        props.onClose();
    };

    const handlePlotProjection = () => { const bearing = parseFloat(projBearing), distance = parseFloat(projDistance); if (!isNaN(bearing) && !isNaN(distance)) { props.onProjectPoint({ bearing, distance }); props.onClose(); } };
    const handleClearProjection = () => { props.onProjectPoint('clear'); setProjBearing(''); setProjDistance(''); };
    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && props.map) {
            const url = URL.createObjectURL(file);
            const img = new window.Image();
            img.onload = () => {
                const center = props.map.getCenter();
                const mapWidthMeters = props.map.getBounds().getSouthWest().distanceTo(props.map.getBounds().getSouthEast());
                const initialWidthMeters = mapWidthMeters * 0.5;
                aspectRatioRef.current = img.height / img.width;
                props.setImageOverlay({ url, center: center, width: initialWidthMeters, height: initialWidthMeters * aspectRatioRef.current, rotation: 0, opacity: 0.7 });
            };
            img.src = url;
        }
    };

    return (
        <div className="settings-menu-overlay" onClick={props.onClose}>
            <div className="settings-menu-content" onClick={(e) => e.stopPropagation()}>
                <div className="settings-menu-header">
                    <h2>Settings</h2>
                    <button onClick={props.onClose} className="p-1 rounded-full hover:bg-[var(--color-surface-light)]"><X size={20} /></button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto pr-2 space-y-2">
                    <AccordionItem title="Image Overlay">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageFileChange} className="hidden" />
                        {!props.imageOverlay ? (
                            <button onClick={() => fileInputRef.current?.click()} className="button-primary w-full"><ImageUp size={18} /><span>Import Image</span></button>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <img src={props.imageOverlay.url} alt="Overlay preview" className="w-12 h-12 object-cover rounded-md border-2 border-[var(--color-surface-light)]" />
                                    <p className="text-xs text-[var(--color-text-secondary)]">Drag to move. Use controls to adjust.</p>
                                </div>
                                <div className="settings-row"><label htmlFor="imgOpacity">Opacity</label><input id="imgOpacity" type="range" min="0" max="1" step="0.05" value={props.imageOverlay.opacity} onChange={(e) => props.setImageOverlay({ ...props.imageOverlay!, opacity: parseFloat(e.target.value) })} className="w-40" /></div>
                                <div className="settings-row"><label htmlFor="imgRotation">Rotation</label><input id="imgRotation" type="range" min="-180" max="180" step="1" value={props.imageOverlay.rotation} onChange={(e) => props.setImageOverlay({ ...props.imageOverlay!, rotation: parseInt(e.target.value, 10) })} className="w-40" /></div>
                                <div className="settings-row"><label htmlFor="imgWidth">Width ({Math.round(props.imageOverlay.width)}m)</label><input id="imgWidth" type="range" min="10" max={Math.max(5000, Math.round(props.imageOverlay.width * 2))} step="1" value={props.imageOverlay.width} onChange={(e) => { const w = parseInt(e.target.value, 10); props.setImageOverlay({ ...props.imageOverlay!, width: w, height: keepAspectRatio ? w * aspectRatioRef.current : props.imageOverlay!.height }); }} className="w-40" /></div>
                                <div className="settings-row"><label htmlFor="imgHeight">Height ({Math.round(props.imageOverlay.height)}m)</label><input id="imgHeight" type="range" min="10" max={Math.max(5000, Math.round(props.imageOverlay.height * 2))} step="1" value={props.imageOverlay.height} onChange={(e) => { const h = parseInt(e.target.value, 10); props.setImageOverlay({ ...props.imageOverlay!, height: h, width: keepAspectRatio ? h / aspectRatioRef.current : props.imageOverlay!.width }); }} className="w-40" /></div>
                                <div className="flex items-center justify-end"><label className="flex items-center space-x-2 cursor-pointer text-xs text-[var(--color-text-secondary)]"><input type="checkbox" checked={keepAspectRatio} onChange={e => setKeepAspectRatio(e.target.checked)} className="form-checkbox" /><span>Lock aspect ratio</span></label></div>
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-surface-light)]">
                                    <button onClick={() => props.map && props.imageOverlay && props.setImageOverlay({ ...props.imageOverlay, center: props.map.getCenter() })} className="button-secondary">Center on View</button>
                                    <button onClick={() => props.setImageOverlay(null)} className="button-danger">Remove Image</button>
                                </div>
                            </div>
                        )}
                    </AccordionItem>
                    <AccordionItem title="Waypoint Manager">
                        <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                            {props.waypoints.length > 0 ? props.waypoints.map(wp => (
                                <div key={wp.id} className="flex items-center justify-between p-2 rounded-md hover:bg-[var(--color-surface-light)]/50">
                                    <div><p className="font-bold">{wp.name}</p><p className="text-xs font-mono text-[var(--color-text-secondary)]">E {wp.coords.indianGrid?.easting.toFixed(0)} N {wp.coords.indianGrid?.northing.toFixed(0)}</p></div>
                                    <div className="flex items-center space-x-1"><button onClick={() => props.onNavigateToWaypoint(wp)} className="p-1.5 rounded-full hover:bg-[var(--color-surface-light)] text-[var(--color-accent)]" title="Go to waypoint"><LocateFixed size={16}/></button><button onClick={() => props.onDeleteWaypoint(wp.id)} className="p-1.5 rounded-full hover:bg-red-900/50 text-[var(--color-danger)]" title="Delete waypoint"><Trash2 size={16}/></button></div>
                                </div>
                            )) : <p className="text-center text-[var(--color-text-secondary)] py-4">No saved waypoints.</p>}
                        </div>
                    </AccordionItem>
                    <AccordionItem title="Go To Coordinates">
                        <form onSubmit={handleGoToSubmit} className="space-y-3">
                             <select value={goToSystem} onChange={e => setGoToSystem(e.target.value as CoordSystem)} className="input-field w-full">
                                <option value={CoordSystem.IndianGrid_Everest1930}>Indian Grid (Everest 1930)</option>
                                <option value={CoordSystem.UTM_WGS84}>UTM (WGS84)</option>
                            </select>

                            {goToSystem === CoordSystem.UTM_WGS84 && (
                                <div className="space-y-2 animate-fade-in-fast">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" placeholder="Zone" min="1" max="60" value={goToUtmZone} onChange={e => setGoToUtmZone(e.target.value)} className="input-field" required/>
                                        <div className="flex items-center justify-around bg-[var(--color-background)] rounded border border-[var(--color-surface-lighter)]">
                                            <label className="flex items-center space-x-2 cursor-pointer p-1"><input type="radio" name="hemisphere" value="N" checked={goToUtmHemi === 'N'} onChange={() => setGoToUtmHemi('N')} className="form-radio" /><span>N</span></label>
                                            <label className="flex items-center space-x-2 cursor-pointer p-1"><input type="radio" name="hemisphere" value="S" checked={goToUtmHemi === 'S'} onChange={() => setGoToUtmHemi('S')} className="form-radio" /><span>S</span></label>
                                        </div>
                                    </div>
                                    <input type="number" placeholder="Easting" value={goToUtmEasting} onChange={e => setGoToUtmEasting(e.target.value)} className="input-field w-full" required/>
                                    <input type="number" placeholder="Northing" value={goToUtmNorthing} onChange={e => setGoToUtmNorthing(e.target.value)} className="input-field w-full" required/>
                                </div>
                            )}

                            {goToSystem === CoordSystem.IndianGrid_Everest1930 && (
                                 <div className="space-y-2 animate-fade-in-fast">
                                     <select value={goToIndianZone} onChange={e => setGoToIndianZone(e.target.value as IndianGridZone)} className="input-field w-full">
                                        {Object.values(IndianGridZone).map(z => <option key={z} value={z}>{z}</option>)}
                                    </select>
                                    <input type="number" placeholder="Easting" value={goToIndianEasting} onChange={e => setGoToIndianEasting(e.target.value)} className="input-field w-full" required/>
                                    <input type="number" placeholder="Northing" value={goToIndianNorthing} onChange={e => setGoToIndianNorthing(e.target.value)} className="input-field w-full" required/>
                                </div>
                            )}

                            <button type="submit" className="button-primary w-full">Go</button>
                        </form>
                    </AccordionItem>
                     <AccordionItem title="Projection System">
                        <div className="space-y-2">
                             <div className="flex items-center space-x-2"><input type="number" placeholder="Bearing (°)" value={projBearing} onChange={(e) => setProjBearing(e.target.value)} className="input-field flex-grow" /><button onClick={() => setProjBearing(props.heading?.toFixed(1) || '')} className="button-icon" disabled={props.heading === null}><Compass size={20} /></button></div>
                            <input type="number" placeholder="Distance (m)" value={projDistance} onChange={(e) => setProjDistance(e.target.value)} className="input-field w-full" />
                        </div>
                        <div className="flex space-x-2 pt-2"><button onClick={handleClearProjection} className="button-danger w-full">Clear</button><button onClick={handlePlotProjection} className="button-primary w-full">Plot</button></div>
                    </AccordionItem>
                    <AccordionItem title="Grid Settings">
                       <div className="settings-row"><label htmlFor="gridColor">Color</label><input id="gridColor" type="color" value={props.gridSettings.color} onChange={(e) => props.setGridSettings({ ...props.gridSettings, color: e.target.value })} className="w-10 h-8 p-1 input-field" /></div>
                       <div className="settings-row"><label htmlFor="gridOpacity">Opacity</label><div className="flex items-center space-x-2"><input id="gridOpacity" type="range" min="0" max="1" step="0.1" value={props.gridSettings.opacity} onChange={(e) => props.setGridSettings({ ...props.gridSettings, opacity: parseFloat(e.target.value) })} className="w-32" /><span className="w-8 text-right font-mono">{props.gridSettings.opacity.toFixed(1)}</span></div></div>
                       <div className="settings-row"><label htmlFor="gridWeight">Thickness</label><div className="flex items-center space-x-2"><input id="gridWeight" type="range" min="1" max="5" step="1" value={props.gridSettings.weight} onChange={(e) => props.setGridSettings({ ...props.gridSettings, weight: parseInt(e.target.value, 10) })} className="w-32" /><span className="w-8 text-right font-mono">{props.gridSettings.weight}px</span></div></div>
                       <div className="settings-row"><label htmlFor="gridSpacing">Spacing</label><select id="gridSpacing" value={String(props.gridSpacing)} onChange={(e) => props.setGridSpacing(e.target.value === 'Auto' ? 'Auto' : parseInt(e.target.value, 10) as GridSpacing)} className="input-field"><option value="Auto">Auto</option><option value="1000">1km</option><option value="5000">5km</option><option value="10000">10km</option></select></div>
                    </AccordionItem>
                    <AccordionItem title="Map Display">
                           <div className="settings-row"><label htmlFor="coordSystem">Coord System</label><select id="coordSystem" value={props.coordSystem} onChange={e => props.setCoordSystem(e.target.value as CoordSystem)} className="input-field"><option value={CoordSystem.UTM_WGS84}>{CoordSystem.UTM_WGS84}</option><option value={CoordSystem.IndianGrid_Everest1930}>{CoordSystem.IndianGrid_Everest1930}</option></select></div>
                           {props.coordSystem === CoordSystem.IndianGrid_Everest1930 && <div className="settings-row"><label htmlFor="indianGridZone">Indian Zone</label><select id="indianGridZone" value={props.indianGridZone} onChange={(e) => props.setIndianGridZone(e.target.value as IndianGridZone)} className="input-field">{Object.values(IndianGridZone).map(z => <option key={z} value={z}>{z}</option>)}</select></div>}
                           {props.coordSystem === CoordSystem.UTM_WGS84 && <div className="settings-row"><label htmlFor="manualZone">Manual Zone</label><input id="manualZone" type="number" placeholder="Auto" min="1" max="60" value={props.manualZone ?? ''} onChange={e => props.setManualZone(e.target.value === '' ? null : parseInt(e.target.value, 10))} className="input-field w-24"/></div>}
                    </AccordionItem>
                    <AccordionItem title="Map Orientation">
                        { [{ id: MapOrientationMode.NorthUp, name: 'North Up' }, { id: MapOrientationMode.HeadUp, name: 'Head Up' }, { id: MapOrientationMode.Free, name: 'Free' }].map(opt => <div key={opt.id}><label className="flex items-center space-x-3 cursor-pointer"><input type="radio" name="orientationMode" value={opt.id} checked={props.mapOrientationMode === opt.id} onChange={e => props.setMapOrientationMode(e.target.value as MapOrientationMode)} className="form-radio" /><span>{opt.name}</span></label></div>) }
                    </AccordionItem>
                    <AccordionItem title="Map View & Offline">
                        <div className="flex space-x-2"><button onClick={() => { props.onSaveView(); props.onClose(); }} className="button-secondary w-full">Save View</button><button onClick={() => { props.onRestoreView(); props.onClose(); }} disabled={!props.isViewSaved} className="button-secondary w-full">Restore View</button></div>
                        <button onClick={() => { props.onOpenOfflineManager(); props.onClose(); }} className="button-primary w-full mt-2">Manage Offline Maps</button>
                    </AccordionItem>
                </div>
            </div>
            <style>{`
                .animate-fade-in-fast {
                    animation: fadeIn 0.15s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SettingsMenu;
