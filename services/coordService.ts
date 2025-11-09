import { LatLng } from 'leaflet';
import { UTMCoordinates, IndianGridCoordinates, IndianGridZone } from '../types';

declare const proj4: any;

const WGS84 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

const indianGridZoneParams: Record<IndianGridZone, { lon_0: number; lat_1: number; x_0: number; y_0: number; k_0: number }> = {
    [IndianGridZone.Z0]:   { lon_0: 68, lat_1: 39.5,  x_0: 2153866.4, y_0: 2368292.9, k_0: 0.9984615 },
    [IndianGridZone.IA]:   { lon_0: 68, lat_1: 32.5,  x_0: 2743196.4, y_0: 914398.8,  k_0: 0.9987864 },
    [IndianGridZone.IB]:   { lon_0: 90, lat_1: 32.5,  x_0: 2743196.4, y_0: 914398.8,  k_0: 0.9987864 },
    [IndianGridZone.IIA]:  { lon_0: 74, lat_1: 26,    x_0: 2743196.4, y_0: 914398.8,  k_0: 0.9987864 },
    [IndianGridZone.IIB]:  { lon_0: 90, lat_1: 26,    x_0: 2743196.4, y_0: 914398.8,  k_0: 0.9987864 },
    [IndianGridZone.IIIA]: { lon_0: 80, lat_1: 19,    x_0: 2743196.4, y_0: 914398.8,  k_0: 0.9987864 },
    [IndianGridZone.IIIB]: { lon_0: 100,lat_1: 19,    x_0: 2743196.4, y_0: 914398.8,  k_0: 0.9987864 },
    [IndianGridZone.IVA]:  { lon_0: 80, lat_1: 12,    x_0: 2743196.4, y_0: 914398.8,  k_0: 0.9987864 },
    [IndianGridZone.IVB]:  { lon_0: 104,lat_1: 12,    x_0: 2743196.4, y_0: 914398.8,  k_0: 0.9987864 },
};

function getIndianGridProjection(zone: IndianGridZone): string {
    const params = indianGridZoneParams[zone];
    // For LCC 1SP (Lambert Conformal Conic with 1 standard parallel), lat_0 is usually the same as lat_1.
    return `+proj=lcc +lat_1=${params.lat_1} +lat_0=${params.lat_1} +lon_0=${params.lon_0} +k_0=${params.k_0} +x_0=${params.x_0} +y_0=${params.y_0} +ellps=evrst30 +towgs84=295,736,254,0,0,0,0 +units=m +no_defs`;
}

function getUtmProjection(zone: number, hemisphere: 'N' | 'S'): string {
    return `+proj=utm +zone=${zone} ${hemisphere === 'S' ? '+south' : ''} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
}

export function convertLatLonToUtm(latLng: LatLng, forceZone?: number): UTMCoordinates | null {
    try {
        const zone = forceZone || Math.floor((latLng.lng + 180) / 6) + 1;
        const hemisphere: 'N' | 'S' = latLng.lat >= 0 ? 'N' : 'S';
        const utmProjection = getUtmProjection(zone, hemisphere);
        const [easting, northing] = proj4(WGS84, utmProjection, [latLng.lng, latLng.lat]);

        return {
            zone,
            easting,
            northing,
            hemisphere
        };
    } catch (error) {
        console.error("Error converting LatLon to UTM:", error);
        return null;
    }
}

export function convertUtmToLatLon(utm: UTMCoordinates): LatLng | null {
    try {
        const utmProjection = getUtmProjection(utm.zone, utm.hemisphere);
        const [lon, lat] = proj4(utmProjection, WGS84, [utm.easting, utm.northing]);

        return new LatLng(lat, lon);
    } catch (error) {
        console.error("Error converting UTM to LatLon:", error);
        return null;
    }
}

export function convertLatLonToIndianGrid(latLng: LatLng, zone: IndianGridZone): IndianGridCoordinates | null {
    try {
        const indianGridProj = getIndianGridProjection(zone);
        const [easting, northing] = proj4(WGS84, indianGridProj, [latLng.lng, latLng.lat]);
        return {
            easting,
            northing,
            zone,
        };
    } catch (error) {
        console.error("Error converting LatLon to Indian Grid:", error);
        return null;
    }
}

export function convertIndianGridToLatLon(indianGrid: IndianGridCoordinates): LatLng | null {
    try {
        const indianGridProj = getIndianGridProjection(indianGrid.zone);
        const [lon, lat] = proj4(indianGridProj, WGS84, [indianGrid.easting, indianGrid.northing]);

        return new LatLng(lat, lon);
    } catch (error) {
        console.error("Error converting Indian Grid to LatLon:", error);
        return null;
    }
}
