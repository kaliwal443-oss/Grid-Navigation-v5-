import React from 'react';
import useGeolocation from '../hooks/useGeolocation';
import { Compass, ChevronsUp, Gauge, Satellite } from 'lucide-react';

interface ConstellationData { name: string; prefix: string; color: string; range?: [number, number]; values?: number[]; }

const constellationData: Record<string, ConstellationData> = {
    GPS: { name: 'GPS', prefix: 'G', color: '#4285F4', range: [1, 32] },
    GLONASS: { name: 'GLONASS', prefix: 'R', color: '#DB4437', range: [65, 96] },
    BeiDou: { name: 'BeiDou', prefix: 'B', color: '#F4B400', range: [201, 237] },
    Galileo: { name: 'Galileo', prefix: 'E', color: '#0F9D58', range: [301, 336] },
    SBAS: { name: 'SBAS', prefix: 'S', color: '#9C27B0', values: [120, 122, 124, 125, 126, 127, 128, 129, 131, 133, 134, 135, 137, 138, 139, 140, 141] },
    QZSS: { name: 'QZSS', prefix: 'Q', color: '#FF6F00', range: [193, 197] }
};

interface SatelliteInfo { id: string; constellation: string; color: string; elevation: number; azimuth: number; snr: number; }

const GpsDataCard: React.FC<{ icon: React.ReactNode; title: string; value: string | React.ReactNode; }> = ({ icon, title, value }) => (
    <div className="gps-data-card">
        <div className="gps-data-card-icon">{icon}</div>
        <div>
            <p className="gps-data-card-title">{title}</p>
            <p className="gps-data-card-value">{value}</p>
        </div>
    </div>
);

const SatelliteSkyPlot: React.FC<{ satellites: SatelliteInfo[] }> = ({ satellites }) => (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="48" fill="none" stroke="var(--color-surface-light)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="var(--color-surface-light)" strokeWidth="0.5" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="16" fill="none" stroke="var(--color-surface-light)" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="2" y1="50" x2="98" y2="50" stroke="var(--color-surface-light)" strokeWidth="0.5" />
            <line x1="50" y1="2" x2="50" y2="98" stroke="var(--color-surface-light)" strokeWidth="0.5" />
            <text x="50" y="5" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="4" className="font-sans">N</text>
            <text x="50" y="98" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="4" className="font-sans">S</text>
            <text x="5" y="53" textAnchor="start" fill="var(--color-text-secondary)" fontSize="4" className="font-sans">W</text>
            <text x="95" y="53" textAnchor="end" fill="var(--color-text-secondary)" fontSize="4" className="font-sans">E</text>
            {satellites.map(sat => {
                const distance = 48 - (sat.elevation / 90) * 48;
                const x = 50 + distance * Math.cos((sat.azimuth - 90) * (Math.PI / 180));
                const y = 50 + distance * Math.sin((sat.azimuth - 90) * (Math.PI / 180));
                return (
                    <g key={sat.id} transform={`translate(${x}, ${y})`}>
                        <circle r="2.5" fill={sat.color} className="satellite-sky-plot-dot" style={{ color: sat.color }} />
                        <text y="1" x="4" fill="var(--color-text-primary)" fontSize="3" className="font-mono">{sat.id}</text>
                    </g>
                );
            })}
        </svg>
    </div>
);

const GpsSatellitePage: React.FC = () => {
    const { lat, lon, error, accuracy, altitude, heading, speed } = useGeolocation();
    
    const satellites = React.useMemo(() => {
        let numSatellites = accuracy === null ? 0 : accuracy > 50 ? 6 : accuracy > 20 ? 8 : accuracy > 10 ? 12 : accuracy > 5 ? 15 : 18;
        let snrRange = accuracy === null ? {min:0, max:0} : accuracy > 50 ? { min: 10, max: 25 } : accuracy > 20 ? { min: 15, max: 30 } : accuracy > 10 ? { min: 20, max: 35 } : accuracy > 5 ? { min: 25, max: 45 } : { min: 30, max: 50 };

        const constellationKeys = Object.keys(constellationData);
        const usedIds = new Set<string>();
        const generatedSatellites: SatelliteInfo[] = [];

        for (let i = 0; i < numSatellites; i++) {
            const data = constellationData[constellationKeys[Math.floor(Math.random() * constellationKeys.length)]];
            let satIdNum: number;
            if (data.range) satIdNum = Math.floor(Math.random() * (data.range[1] - data.range[0] + 1)) + data.range[0];
            else satIdNum = data.values![Math.floor(Math.random() * data.values!.length)];
            const satIdStr = `${data.prefix}${satIdNum}`;
            if (usedIds.has(satIdStr)) { i--; continue; }
            usedIds.add(satIdStr);
            generatedSatellites.push({
                id: satIdStr, constellation: data.name, color: data.color,
                elevation: Math.floor(Math.random() * 90), azimuth: Math.floor(Math.random() * 360),
                snr: Math.floor(Math.random() * (snrRange.max - snrRange.min + 1)) + snrRange.min,
            });
        }
        return generatedSatellites;
    }, [accuracy]);

    const getDirection = (h: number | null) => {
        if (h === null) return '';
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return dirs[Math.floor(((h + 22.5) % 360) / 45)];
    };
    
    return (
        <div className="h-full w-full bg-[var(--color-background)] text-white p-2 sm:p-4 flex flex-col overflow-y-auto">
            <h1 className="text-xl font-bold text-center text-[var(--color-accent-hover)] mb-4 flex-shrink-0">GPS Status</h1>
            
            {error && <p className="text-center text-red-400 bg-red-900/50 p-2 rounded-md font-mono mb-4">{error}</p>}

            <div className="grid lg:grid-cols-3 gap-4">
                <div className="space-y-4">
                    <div className="gps-info-box">
                        <p className="gps-info-box-title">Coordinates (WGS84)</p>
                        {lat && lon ? (
                            <p className="text-lg">{lat.toFixed(6)}°, {lon.toFixed(6)}°</p>
                        ) : ( <p className="animate-pulse">Acquiring signal...</p> )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <GpsDataCard icon={<ChevronsUp size={20}/>} title="Altitude" value={altitude !== null ? `${altitude.toFixed(1)}m` : '--'} />
                        <GpsDataCard icon={<Gauge size={20}/>} title="Speed" value={speed !== null ? `${speed.toFixed(1)} m/s` : '--'} />
                        <GpsDataCard icon={<Compass size={20}/>} title="Heading" value={heading !== null ? `${heading.toFixed(0)}° ${getDirection(heading)}` : '--'} />
                        <GpsDataCard icon={<Satellite size={20}/>} title="H. Accuracy" value={accuracy !== null ? `± ${accuracy.toFixed(1)}m` : '--'} />
                    </div>
                </div>

                <div className="gps-info-box flex flex-col justify-center items-center">
                    <SatelliteSkyPlot satellites={satellites} />
                </div>
                
                <div className="gps-info-box flex flex-col">
                    <h2 className="gps-info-box-title mb-2">Satellites In View ({satellites.length})</h2>
                    <div className="grid grid-cols-5 text-center font-bold text-[var(--color-text-secondary)] text-xs uppercase tracking-wider border-b border-[var(--color-surface-light)] pb-1">
                        <span>ID</span><span>System</span><span>Elev</span><span>Azim</span><span>SNR</span>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-1 pt-1 pr-1">
                        {satellites.sort((a,b) => b.snr - a.snr).map(sat => (
                            <div key={sat.id} className="grid grid-cols-5 text-center font-mono text-sm py-0.5 rounded odd:bg-white/5">
                                <span className="font-bold" style={{color: sat.color}}>{sat.id}</span>
                                <span className="text-[var(--color-text-secondary)] text-[10px] truncate self-center font-sans">{sat.constellation}</span>
                                <span>{sat.elevation}°</span>
                                <span>{sat.azimuth}°</span>
                                <span className={sat.snr > 35 ? 'text-green-400' : sat.snr > 25 ? 'text-yellow-400' : 'text-red-400'}>{sat.snr} dB</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <p className="text-xs text-gray-600 text-center w-full pt-4 flex-shrink-0">Satellite constellation, ID, and signal data are simulated for visualization based on location accuracy.</p>
        </div>
    );
};

export default GpsSatellitePage;