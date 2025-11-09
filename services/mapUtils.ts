import { LatLngBounds } from 'leaflet';

// Converts longitude to tile X coordinate.
function lon2tile(lon: number, zoom: number): number {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

// Converts latitude to tile Y coordinate.
function lat2tile(lat: number, zoom: number): number {
    return Math.floor(
        ((1 -
            Math.log(
                Math.tan((lat * Math.PI) / 180) +
                1 / Math.cos((lat * Math.PI) / 180)
            ) /
            Math.PI) /
            2) *
        Math.pow(2, zoom)
    );
}

/**
 * Generates an array of tile URLs for a given geographical area and zoom range.
 * @param bounds - The geographical bounding box.
 * @param minZoom - The minimum zoom level to download.
 * @param maxZoom - The maximum zoom level to download.
 * @param urlTemplate - The URL template for the map tiles.
 * @returns An array of string URLs for all required tiles.
 */
export function getTileUrlsForBounds(
    bounds: LatLngBounds,
    minZoom: number,
    maxZoom: number,
    urlTemplate: string
): string[] {
    const urls: string[] = [];
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    for (let z = minZoom; z <= maxZoom; z++) {
        const startX = lon2tile(sw.lng, z);
        const endX = lon2tile(ne.lng, z);
        const startY = lat2tile(ne.lat, z);
        const endY = lat2tile(sw.lat, z);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const url = urlTemplate
                    .replace('{s}', ['a', 'b', 'c'][Math.floor(Math.random() * 3)]) // Handle subdomains
                    .replace('{z}', String(z))
                    .replace('{x}', String(x))
                    .replace('{y}', String(y));
                urls.push(url);
            }
        }
    }
    return urls;
}
