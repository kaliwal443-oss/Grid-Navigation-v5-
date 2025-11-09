import React, { useState, useCallback } from 'react';
import { LatLngBounds, Map as LeafletMap } from 'leaflet';
import { X, Download, Trash2, Loader } from 'lucide-react';
import useOfflineMaps from '../hooks/useOfflineMaps';
import { getTileUrlsForBounds } from '../services/mapUtils';
import { OfflineRegionInfo } from '../types';

const MAX_TILES_TO_DOWNLOAD = 5000; // Safety limit
const MIN_DOWNLOAD_ZOOM = 10;
const MAX_DOWNLOAD_ZOOM = 16;


interface OfflineMapDownloaderProps {
    isOpen: boolean;
    onClose: () => void;
    map: LeafletMap | null;
    currentTileUrl: string;
}

const OfflineMapDownloader: React.FC<OfflineMapDownloaderProps> = ({ isOpen, onClose, map, currentTileUrl }) => {
    const { regions, addRegion, deleteRegion } = useOfflineMaps();
    const [regionName, setRegionName] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);

    const handleDownload = useCallback(async () => {
        if (!map || !regionName.trim()) {
            setError("Please provide a name for the region.");
            return;
        }
        setError(null);
        setIsDownloading(true);
        setProgress({ current: 0, total: 0 });

        const bounds = map.getBounds();
        const minZoom = Math.max(MIN_DOWNLOAD_ZOOM, Math.floor(map.getZoom()));
        const maxZoom = MAX_DOWNLOAD_ZOOM;

        const urlsToDownload = getTileUrlsForBounds(bounds, minZoom, maxZoom, currentTileUrl);

        if (urlsToDownload.length > MAX_TILES_TO_DOWNLOAD) {
            setError(`Too many tiles to download (${urlsToDownload.length}). Please zoom in or select a smaller area.`);
            setIsDownloading(false);
            return;
        }
        
        if (urlsToDownload.length === 0) {
            setError("No tiles to download for the current view and zoom levels.");
            setIsDownloading(false);
            return;
        }

        setProgress({ current: 0, total: urlsToDownload.length });

        let downloadedCount = 0;
        for (const url of urlsToDownload) {
            try {
                // Fetching the tile will trigger the service worker to cache it.
                // We use { mode: 'no-cors' } because we don't need to read the response,
                // and it can prevent CORS issues with some tile servers.
                await fetch(url, { mode: 'no-cors' });
            } catch (err) {
                console.warn(`Could not fetch tile ${url}:`, err);
                // Continue even if some tiles fail
            }
            downloadedCount++;
            setProgress({ current: downloadedCount, total: urlsToDownload.length });
        }

        addRegion({
            name: regionName.trim(),
            bounds: { // Convert to plain object for serialization
                _southWest: bounds.getSouthWest(),
                _northEast: bounds.getNorthEast(),
            },
            minZoom,
            maxZoom,
            tileCount: urlsToDownload.length,
            layerUrl: currentTileUrl,
        });

        setRegionName('');
        setIsDownloading(false);

    }, [map, regionName, currentTileUrl, addRegion]);

    const handleDelete = (region: OfflineRegionInfo) => {
        if (!window.confirm(`Are you sure you want to delete the offline region "${region.name}"?`)) {
            return;
        }
        const bounds = new LatLngBounds(region.bounds._southWest, region.bounds._northEast);
        const urlsToDelete = getTileUrlsForBounds(bounds, region.minZoom, region.maxZoom, region.layerUrl);
        deleteRegion(region.id, urlsToDelete);
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="absolute inset-0 bg-black/75 z-[1200] flex items-center justify-center" onClick={onClose}>
            <div className="bg-[var(--color-surface)] text-white rounded-lg shadow-2xl w-11/12 max-w-md p-4 animate-fade-in border border-[var(--color-surface-light)]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-[var(--color-surface-light)] pb-2 mb-3">
                    <h2 className="text-lg font-bold">Offline Maps</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-surface-light)]"><X size={20} /></button>
                </div>
                
                <div className="bg-[var(--color-background)] p-3 rounded-md border border-[var(--color-surface-light)]">
                    <h3 className="text-sm font-semibold mb-2 text-[var(--color-accent)]">Download Current View</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                        Save map tiles for the current screen area (zoom {map ? Math.max(MIN_DOWNLOAD_ZOOM, Math.floor(map.getZoom())) : MIN_DOWNLOAD_ZOOM}-{MAX_DOWNLOAD_ZOOM}).
                    </p>
                    <input
                        type="text"
                        placeholder="Name for this region..."
                        value={regionName}
                        onChange={(e) => setRegionName(e.target.value)}
                        disabled={isDownloading}
                        className="w-full bg-[var(--color-surface-light)] p-2 rounded border border-[var(--color-surface-lighter)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] mb-2"
                    />
                    <button 
                        onClick={handleDownload}
                        disabled={isDownloading || !regionName.trim()}
                        className="w-full flex items-center justify-center space-x-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                         {isDownloading ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
                         <span>{isDownloading ? `Downloading... (${progress.current}/${progress.total})` : 'Download'}</span>
                    </button>
                    {isDownloading && (
                        <div className="w-full bg-gray-600 rounded-full h-1.5 mt-2">
                            <div className="bg-[var(--color-accent-hover)] h-1.5 rounded-full" style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}></div>
                        </div>
                    )}
                    {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                </div>

                <div className="mt-4">
                     <h3 className="text-sm font-semibold mb-2">Saved Regions</h3>
                     <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {regions.length > 0 ? regions.map(region => (
                            <div key={region.id} className="flex items-center justify-between p-2 rounded-md bg-white/5">
                                <div>
                                    <p className="font-bold text-sm">{region.name}</p>
                                    <p className="text-xs font-mono text-[var(--color-text-secondary)]">
                                        {region.tileCount} tiles (Zoom {region.minZoom}-{region.maxZoom})
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(region)} className="p-1.5 rounded-full hover:bg-red-900/50 text-[var(--color-danger)]" title="Delete region"><Trash2 size={16}/></button>
                            </div>
                        )) : (
                            <p className="text-center text-sm text-[var(--color-text-secondary)] py-4">No offline regions saved.</p>
                        )}
                     </div>
                </div>

            </div>
        </div>
    );
};

export default OfflineMapDownloader;