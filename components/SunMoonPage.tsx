import React, { useState, useMemo } from 'react';
import { LatLng } from 'leaflet';
import useGeolocation from '../hooks/useGeolocation';
import * as AstroService from '../services/astroService';
import { convertLatLonToIndianGrid } from '../services/coordService';
import { IndianGridZone } from '../types';
import { Sun, Moon, Sunrise, Sunset, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-surface-light)] h-full flex flex-col">
        <h2 className="text-lg font-bold text-[var(--color-accent)] flex items-center mb-3">{icon}<span className="ml-2">{title}</span></h2>
        <div className="space-y-2 flex-grow flex flex-col">{children}</div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm py-1"><span className="text-[var(--color-text-secondary)]">{label}</span><span className="font-mono font-bold text-[var(--color-text-primary)] text-right">{value}</span></div>
);

const SunTimeline: React.FC<{ times: AstroService.SunTimes }> = ({ times }) => {
    const timelineEvents = useMemo(() => {
        const dayStart = new Date(times.solarNoon).setHours(0, 0, 0, 0);
        const toPercent = (d: Date) => (d.getTime() - dayStart) / 864000;
        const events = [
            { name: 'Night', start: 0, end: toPercent(times.nightEnd), color: '#1e3a8a' },
            { name: 'Astronomical', start: toPercent(times.nightEnd), end: toPercent(times.nauticalDawn), color: '#312e81' },
            { name: 'Nautical', start: toPercent(times.nauticalDawn), end: toPercent(times.dawn), color: '#4c1d95' },
            { name: 'Civil', start: toPercent(times.dawn), end: toPercent(times.sunrise), color: '#86198f' },
            { name: 'Daylight', start: toPercent(times.sunrise), end: toPercent(times.sunset), color: 'var(--color-accent)' },
            { name: 'Civil', start: toPercent(times.sunset), end: toPercent(times.dusk), color: '#86198f' },
            { name: 'Nautical', start: toPercent(times.dusk), end: toPercent(times.nauticalDusk), color: '#4c1d95' },
            { name: 'Astronomical', start: toPercent(times.nauticalDusk), end: toPercent(times.night), color: '#312e81' },
            { name: 'Night', start: toPercent(times.night), end: 100, color: '#1e3a8a' },
        ];
        return events.filter(e => e.start < e.end && !isNaN(e.start) && !isNaN(e.end));
    }, [times]);
    return (
        <div className="w-full mt-2">
            <div className="h-4 w-full flex rounded overflow-hidden shadow-inner bg-black/20">{timelineEvents.map((e, i) => <div key={i} title={e.name} style={{ width: `${e.end - e.start}%`, backgroundColor: e.color }} />)}</div>
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
        </div>
    );
};

const MoonPhase: React.FC<{ phase: number; angle: number; size?: number }> = ({ phase, angle, size = 80 }) => {
    const r = size / 2;
    const path = useMemo(() => {
        const arc = Math.abs(2 * phase - 1);
        const rx = (1 - arc) * r;
        const largeArc = (phase > 0.25 && phase < 0.75) ? 1 : 0;
        const sweep = 1;
        if (phase > 0.495 && phase < 0.505) return `M 0,${r} A ${r},${r} 0 1 1 ${size},${r} A ${r},${r} 0 1 1 0,${r}`;
        return `M ${r},${0} A ${r},${r} 0 1,1 ${r},${size} A ${rx},${r} 0 ${largeArc},${sweep} ${r},${0} Z`;
    }, [phase, r, size]);
    const transform = phase > 0.5 ? `scale(-1, 1) translate(${-size}, 0)` : '';

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto my-1 drop-shadow-lg">
            <defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            <circle cx={r} cy={r} r={r} fill="#4b5563" />
            <g transform={`rotate(${(angle * 180 / Math.PI) - 90}, ${r}, ${r})`}><g transform={transform}><path d={path} fill="#f9fafb" filter="url(#glow)" /></g></g>
        </svg>
    );
};

const MoonDisplay: React.FC<{
    baseDate: Date; lat: number; lon: number;
    moonTimes: { rise?: Date; set?: Date; alwaysUp?: boolean; alwaysDown?: boolean };
}> = ({ baseDate, lat, lon, moonTimes }) => {
    const [hour, setHour] = useState(() => new Date().toDateString() === baseDate.toDateString() ? new Date().getHours() : 12);
    const currentDate = useMemo(() => { const d = new Date(baseDate); d.setHours(hour, 0, 0, 0); return d; }, [baseDate, hour]);
    const moonData = useMemo(() => ({ ...AstroService.getMoonIllumination(currentDate), ...AstroService.getMoonPosition(currentDate, lat, lon) }), [currentDate, lat, lon]);
    const getPhaseName = (p:number) => p<0.03||p>0.97?"New Moon":p<0.22?"Waxing Crescent":p<0.28?"First Quarter":p<0.47?"Waxing Gibbous":p<0.53?"Full Moon":p<0.72?"Waning Gibbous":p<0.78?"Last Quarter":"Waning Crescent";

    const sliderBackground = useMemo(() => {
        if (moonTimes.alwaysUp) return 'linear-gradient(to right, #fbbf24 0%, #fbbf24 100%)';
        if (moonTimes.alwaysDown) return 'linear-gradient(to right, #374151 0%, #374151 100%)';
        const riseHour = moonTimes.rise?.getHours();
        const setHour = moonTimes.set?.getHours();
        if (riseHour === undefined || setHour === undefined) return '#374151';

        const rP = (riseHour / 23) * 100, sP = (setHour / 23) * 100;
        if (riseHour < setHour) return `linear-gradient(to right, #374151 ${rP}%, #fbbf24 ${rP}%, #fbbf24 ${sP}%, #374151 ${sP}%)`;
        return `linear-gradient(to right, #fbbf24 ${sP}%, #374151 ${sP}%, #374151 ${rP}%, #fbbf24 ${rP}%)`;
    }, [moonTimes]);

    return (
        <>
            <div className="flex items-center gap-4">
                <MoonPhase phase={moonData.phase} angle={moonData.angle} />
                <div className="flex-grow space-y-1 text-sm">
                    <p className="font-bold text-base text-[var(--color-accent-hover)]">{getPhaseName(moonData.phase)}</p>
                    <p><span className="text-[var(--color-text-secondary)]">Illumination:</span> {(moonData.fraction * 100).toFixed(1)}%</p>
                    <p className="font-mono bg-black/20 px-2 py-1 rounded w-fit text-lg">{currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
            <div className="pt-2 mt-2">
                <input type="range" min="0" max="23" step="1" value={hour} onChange={(e) => setHour(parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb" style={{ background: sliderBackground }} />
                <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mt-1"><span>00:00</span><span>12:00</span><span>23:00</span></div>
            </div>
            <div className="pt-2 mt-2 border-t border-[var(--color-surface-light)] grid grid-cols-2 gap-x-4 text-sm">
                <InfoRow label="Azimuth" value={`${((moonData.azimuth * 180 / Math.PI + 180) % 360).toFixed(1)}°`} />
                <InfoRow label="Altitude" value={`${(moonData.altitude * 180 / Math.PI).toFixed(1)}°`} />
            </div>
            <style>{`.slider-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #fff; border-radius: 50%; border: 2px solid #9ca3af; cursor: pointer; margin-top: -6px; }`}</style>
        </>
    );
};

const MonthlyCalendar: React.FC<{ selectedDate: Date; onDateSelect: (date: Date) => void; lat: number; lon: number }> = ({ selectedDate, onDateSelect, lat, lon }) => {
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    const changeMonth = (offset: number) => setDisplayDate(current => { const newDate = new Date(current); newDate.setMonth(newDate.getMonth() + offset); return newDate; });

    const calendarGrid = useMemo(() => {
        const year = displayDate.getFullYear(), month = displayDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid = Array.from({ length: firstDay }, () => null);
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i, 12, 0, 0); // use noon for average phase
            const illum = AstroService.getMoonIllumination(date);
            grid.push({ date: i, phase: illum.phase, angle: illum.angle });
        }
        return grid;
    }, [displayDate, lat, lon]);

    return (
        <div className="bg-[var(--color-surface)] p-3 sm:p-4 rounded-lg border border-[var(--color-surface-light)] mt-4">
            <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-[var(--color-surface-light)]"><ChevronLeft/></button>
                <h3 className="text-lg font-bold text-center">{displayDate.toLocaleString('default', { month: 'long' })} {displayDate.getFullYear()}</h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-[var(--color-surface-light)]"><ChevronRight/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-text-secondary)] mb-2 font-bold">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarGrid.map((day, index) => (
                    <div key={index} className="aspect-square">
                        {day && (
                            <button
                                onClick={() => onDateSelect(new Date(displayDate.getFullYear(), displayDate.getMonth(), day.date))}
                                className={`w-full h-full rounded-lg flex flex-col items-center justify-center transition-colors ${selectedDate.toDateString() === new Date(displayDate.getFullYear(), displayDate.getMonth(), day.date).toDateString() ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-surface-light)]'}`}>
                                <span className="text-xs font-bold">{day.date}</span>
                                <MoonPhase phase={day.phase} angle={day.angle} size={24} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const SunMoonPage: React.FC = () => {
    const [date, setDate] = useState(() => new Date());
    const { lat, lon, error: geoError } = useGeolocation();
    const astroData = useMemo(() => {
        if (lat === null || lon === null) return null;
        return {
            sunTimes: AstroService.getTimes(date, lat, lon),
            moonTimes: AstroService.getMoonTimes(date, lat, lon),
            indianGrid: convertLatLonToIndianGrid(new LatLng(lat, lon), IndianGridZone.IIA)
        };
    }, [date, lat, lon]);

    const formatTime = (d?: Date) => d && !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const formatDateInput = (d: Date) => { const tz_offset = d.getTimezoneOffset() * 60000; return new Date(d.getTime() - tz_offset).toISOString().slice(0, 16); };

    return (
        <div className="h-full w-full bg-[var(--color-background)] text-white p-2 sm:p-4 flex flex-col overflow-y-auto">
            <h1 className="text-xl font-bold text-center text-[var(--color-accent-hover)] mb-4">Sun & Moon</h1>
            <div className="bg-[var(--color-surface)] p-3 rounded-lg mb-4 border border-[var(--color-surface-light)]">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center text-sm"><MapPin size={16} className="text-[var(--color-text-secondary)] mr-2 flex-shrink-0" />
                        <div className="font-mono text-xs">
                            {lat !== null && lon !== null ? (<><p>Lat/Lon: {lat.toFixed(4)}, {lon.toFixed(4)}</p><p className="text-[var(--color-text-secondary)]">Indian Grid: {astroData?.indianGrid ? `${astroData.indianGrid.easting.toFixed(0)}E ${astroData.indianGrid.northing.toFixed(0)}N` : '...'}</p></>) : (<span className="animate-pulse">{geoError || 'Getting location...'}</span>)}
                        </div>
                    </div>
                    <input type="datetime-local" value={formatDateInput(date)} onChange={(e) => {if(e.target.value) setDate(new Date(e.target.value))}} className="input-field font-mono text-sm"/>
                </div>
            </div>
            {!astroData ? <div className="flex-grow flex items-center justify-center"><p className="text-[var(--color-text-secondary)] animate-pulse">Waiting for location data...</p></div> : (
                <>
                    <div className="grid md:grid-cols-2 gap-4">
                        <InfoCard title="Sun" icon={<Sun size={20} />}><div className="flex-grow"><SunTimeline times={astroData.sunTimes} /></div><div className="pt-2 border-t border-[var(--color-surface-light)]/50"><InfoRow label="Sunrise" value={<><Sunrise size={16} className="inline mr-2 text-[var(--color-text-secondary)]"/> {formatTime(astroData.sunTimes.sunrise)}</>} /><InfoRow label="Sunset" value={<><Sunset size={16} className="inline mr-2 text-[var(--color-text-secondary)]"/> {formatTime(astroData.sunTimes.sunset)}</>} /></div></InfoCard>
                        <InfoCard title="Moon" icon={<Moon size={20} />}>
                            <div className="flex-grow"><MoonDisplay baseDate={date} lat={lat!} lon={lon!} moonTimes={astroData.moonTimes} /></div>
                            <div className="pt-2 border-t border-[var(--color-surface-light)]/50">
                                {astroData.moonTimes.alwaysUp ? ( <InfoRow label="Visibility" value="Always Up" /> ) : astroData.moonTimes.alwaysDown ? ( <InfoRow label="Visibility" value="Always Down" /> ) : (
                                    <>
                                        <InfoRow label="Moonrise" value={formatTime(astroData.moonTimes.rise)} />
                                        <InfoRow label="Moonset" value={formatTime(astroData.moonTimes.set)} />
                                    </>
                                )}
                            </div>
                        </InfoCard>
                    </div>
                    <MonthlyCalendar selectedDate={date} onDateSelect={setDate} lat={lat!} lon={lon!} />
                </>
            )}
        </div>
    );
};

export default SunMoonPage;