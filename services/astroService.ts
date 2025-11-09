/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/

//
// This is a direct adaptation of suncalc.js to be used as a TypeScript module.
//

'use strict';

// shortcuts for easier to read formulas
const PI = Math.PI;
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const asin = Math.asin;
const atan = Math.atan2;
const acos = Math.acos;
const rad = PI / 180;

// date/time constants and conversions
const dayMs = 1000 * 60 * 60 * 24;
const J1970 = 2440588;
const J2000 = 2451545;

function toJulian(date: Date): number { return date.valueOf() / dayMs - 0.5 + J1970; }
function fromJulian(j: number): Date { return new Date((j + 0.5 - J1970) * dayMs); }
function toDays(date: Date): number { return toJulian(date) - J2000; }

// general calculations for position
const e = rad * 23.4397; // obliquity of the Earth

function rightAscension(l: number, b: number): number { return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l)); }
function declination(l: number, b: number): number { return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l)); }
function azimuth(H: number, phi: number, dec: number): number { return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)); }
function altitude(H: number, phi: number, dec: number): number { return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H)); }
function siderealTime(d: number, lw: number): number { return rad * (280.4606 + 360.98564737 * d) - lw; }
function astroRefraction(h: number): number {
    if (h < 0) h = 0; // correction 1
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.0890117));
}

// general sun calculations
function solarMeanAnomaly(d: number): number { return rad * (357.5291 + 0.98560028 * d); }
function eclipticLongitude(M: number): number {
    const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M));
    const P = rad * 102.9372;
    return M + C + P + PI;
}

function sunCoords(d: number) {
    const M = solarMeanAnomaly(d);
    const L = eclipticLongitude(M);
    return {
        dec: declination(L, 0),
        ra: rightAscension(L, 0)
    };
}

// calculates sun position for a given date and latitude/longitude
export function getPosition(date: Date, lat: number, lng: number) {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = sunCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    return {
        azimuth: azimuth(H, phi, c.dec),
        altitude: altitude(H, phi, c.dec)
    };
}


// calculations for sun times
const J0 = 0.0009;

function julianCycle(d: number, lw: number): number { return Math.round(d - J0 - lw / (2 * PI)); }
function approxTransit(Ht: number, lw: number, n: number): number { return J0 + (Ht + lw) / (2 * PI) + n; }
function solarTransitJ(ds: number, M: number, L: number): number { return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L); }
function hourAngle(h: number, phi: number, d: number): number { return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d))); }
function observerAngle(height: number): number { return -2.076 * Math.sqrt(height) / 60; }

// returns set time for the given sun altitude
function getSetJ(h: number, lw: number, phi: number, dec: number, n: number, M: number, L: number): number {
    const w = hourAngle(h, phi, dec);
    const a = approxTransit(w, lw, n);
    return solarTransitJ(a, M, L);
}

export interface SunTimes {
    solarNoon: Date;
    nadir: Date;
    sunrise: Date;
    sunset: Date;
    sunriseEnd: Date;
    sunsetStart: Date;
    dawn: Date;
    dusk: Date;
    nauticalDawn: Date;
    nauticalDusk: Date;
    nightEnd: Date;
    night: Date;
    goldenHourEnd: Date;
    goldenHour: Date;
}

// calculates sun times for a given date and latitude/longitude
export function getTimes(date: Date, lat: number, lng: number, height: number = 0): SunTimes {
    const lw = rad * -lng;
    const phi = rad * lat;
    const h = observerAngle(height);
    const d = toDays(date);
    const n = julianCycle(d, lw);
    const ds = approxTransit(0, lw, n);
    const M = solarMeanAnomaly(ds);
    const L = eclipticLongitude(M);
    const dec = declination(L, 0);
    const Jnoon = solarTransitJ(ds, M, L);
    let i, len, time, h0, Jset, Jrise;

    const result: any = {
        solarNoon: fromJulian(Jnoon),
        nadir: fromJulian(Jnoon - 0.5)
    };

    const times: [number, keyof SunTimes, keyof SunTimes][] = [
        [-0.833, 'sunrise', 'sunset'],
        [-0.3, 'sunriseEnd', 'sunsetStart'],
        [-6, 'dawn', 'dusk'],
        [-12, 'nauticalDawn', 'nauticalDusk'],
        [-18, 'nightEnd', 'night'],
        [6, 'goldenHourEnd', 'goldenHour']
    ];

    for (i = 0, len = times.length; i < len; i += 1) {
        time = times[i];
        h0 = (time[0] + h) * rad;
        Jset = getSetJ(h0, lw, phi, dec, n, M, L);
        Jrise = Jnoon - (Jset - Jnoon);
        result[time[1]] = fromJulian(Jrise);
        result[time[2]] = fromJulian(Jset);
    }
    return result as SunTimes;
}


// moon calculations
function moonCoords(d: number) { // geocentric ecliptic coordinates of the moon
    const L = rad * (218.316 + 13.176396 * d); // ecliptic longitude
    const M = rad * (134.963 + 13.064993 * d); // mean anomaly
    const F = rad * (93.272 + 13.229350 * d);  // mean distance
    const l = L + rad * 6.289 * sin(M); // longitude
    const b = rad * 5.128 * sin(F);     // latitude
    const dt = 385001 - 20905 * cos(M);  // distance to the moon in km
    return {
        ra: rightAscension(l, b),
        dec: declination(l, b),
        dist: dt
    };
}

export function getMoonPosition(date: Date, lat: number, lng: number) {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = moonCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    let h = altitude(H, phi, c.dec);
    const pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));
    h = h + astroRefraction(h); // altitude correction for refraction
    return {
        azimuth: azimuth(H, phi, c.dec),
        altitude: h,
        distance: c.dist,
        parallacticAngle: pa
    };
}


// calculations for moon illumination
export function getMoonIllumination(date: Date) {
    const d = toDays(date || new Date());
    const s = sunCoords(d);
    const m = moonCoords(d);
    const sdist = 149598000; // distance from Earth to Sun in km
    const phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));
    const inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi));
    const angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
    return {
        fraction: (1 + cos(inc)) / 2,
        phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / PI,
        angle: angle
    };
}


// calculations for moon rise/set times
export function getMoonTimes(date: Date, lat: number, lng: number): { rise?: Date, set?: Date, alwaysUp?: boolean, alwaysDown?: boolean } {
    const t = new Date(date);
    t.setHours(0, 0, 0, 0);

    const hc = 0.133 * rad;
    let h0 = getMoonPosition(t, lat, lng).altitude - hc;
    let rise: number | undefined, set: number | undefined;

    // go in 1-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
    for (let i = 1; i <= 24; i += 1) {
        const h1 = getMoonPosition(new Date(t.getTime() + i * 3600000), lat, lng).altitude - hc;
        const h2 = getMoonPosition(new Date(t.getTime() + (i + 1) * 3600000), lat, lng).altitude - hc;

        const a = (h0 + h2) / 2 - h1;
        const b = (h2 - h0) / 2;
        const d = b * b - 4 * a * h1;

        if (d < 0) {
            h0 = h2;
            continue;
        }

        const D = Math.sqrt(d);
        const tau1 = (-b - D) / (2 * a);
        const tau2 = (-b + D) / (2 * a);
        
        const taus: number[] = [];
        if (tau1 >= 0 && tau1 < 1) taus.push(tau1);
        if (tau2 >= 0 && tau2 < 1) taus.push(tau2);

        if (taus.length > 0) {
            for (const tau of taus) {
                if (h0 < 0) {
                   if (!rise) rise = i + tau;
                } else {
                   if (!set) set = i + tau;
                }
            }
        }
        
        if (rise && set) break;
        h0 = h2;
    }

    const result: { rise?: Date, set?: Date, alwaysUp?: boolean, alwaysDown?: boolean } = {};

    if (rise) result.rise = new Date(t.getTime() + rise * 3600000);
    if (set) result.set = new Date(t.getTime() + set * 3600000);

    if (!rise && !set) {
        // Use the final altitude h0 from the end of the 24-hour scan
        if (h0 > 0) result.alwaysUp = true;
        else result.alwaysDown = true;
    }

    return result;
}