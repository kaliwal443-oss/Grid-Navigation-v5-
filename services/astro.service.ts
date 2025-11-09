import { Injectable } from '@angular/core';

// This is a direct adaptation of suncalc.js to be used as an Angular Service.
// Original library (c) 2011-2015, Vladimir Agafonkin

export interface SunTimes {
    solarNoon: Date; nadir: Date; sunrise: Date; sunset: Date; sunriseEnd: Date; sunsetStart: Date;
    dawn: Date; dusk: Date; nauticalDawn: Date; nauticalDusk: Date; nightEnd: Date;
    night: Date; goldenHourEnd: Date; goldenHour: Date;
}

@Injectable({ providedIn: 'root' })
export class AstroService {
    private readonly PI = Math.PI;
    private readonly sin = Math.sin;
    private readonly cos = Math.cos;
    private readonly tan = Math.tan;
    private readonly asin = Math.asin;
    private readonly atan = Math.atan2;
    private readonly acos = Math.acos;
    private readonly rad = this.PI / 180;

    private readonly dayMs = 1000 * 60 * 60 * 24;
    private readonly J1970 = 2440588;
    private readonly J2000 = 2451545;

    private readonly e = this.rad * 23.4397;

    private toJulian(date: Date): number { return date.valueOf() / this.dayMs - 0.5 + this.J1970; }
    private fromJulian(j: number): Date { return new Date((j + 0.5 - this.J1970) * this.dayMs); }
    private toDays(date: Date): number { return this.toJulian(date) - this.J2000; }

    private rightAscension(l: number, b: number): number { return this.atan(this.sin(l) * this.cos(this.e) - this.tan(b) * this.sin(this.e), this.cos(l)); }
    private declination(l: number, b: number): number { return this.asin(this.sin(b) * this.cos(this.e) + this.cos(b) * this.sin(this.e) * this.sin(l)); }
    private azimuth(H: number, phi: number, dec: number): number { return this.atan(this.sin(H), this.cos(H) * this.sin(phi) - this.tan(dec) * this.cos(phi)); }
    private altitude(H: number, phi: number, dec: number): number { return this.asin(this.sin(phi) * this.sin(dec) + this.cos(phi) * this.cos(dec) * this.cos(H)); }
    private siderealTime(d: number, lw: number): number { return this.rad * (280.4606 + 360.98564737 * d) - lw; }

    private solarMeanAnomaly(d: number): number { return this.rad * (357.5291 + 0.98560028 * d); }
    private eclipticLongitude(M: number): number {
        const C = this.rad * (1.9148 * this.sin(M) + 0.02 * this.sin(2 * M) + 0.0003 * this.sin(3 * M));
        const P = this.rad * 102.9372;
        return M + C + P + this.PI;
    }
    private sunCoords(d: number) {
        const M = this.solarMeanAnomaly(d);
        const L = this.eclipticLongitude(M);
        return { dec: this.declination(L, 0), ra: this.rightAscension(L, 0) };
    }

    getPosition(date: Date, lat: number, lng: number) {
        const lw = this.rad * -lng;
        const phi = this.rad * lat;
        const d = this.toDays(date);
        const c = this.sunCoords(d);
        const H = this.siderealTime(d, lw) - c.ra;
        return { azimuth: this.azimuth(H, phi, c.dec), altitude: this.altitude(H, phi, c.dec) };
    }

    getTimes(date: Date, lat: number, lng: number, height: number = 0): SunTimes {
        const lw = this.rad * -lng, phi = this.rad * lat, h = -2.076 * Math.sqrt(height) / 60;
        const d = this.toDays(date), n = Math.round(d - 0.0009 - lw / (2 * this.PI));
        const ds = 0.0009 + (0 + lw) / (2 * this.PI) + n;
        const M = this.solarMeanAnomaly(ds), L = this.eclipticLongitude(M), dec = this.declination(L, 0);
        const Jnoon = this.J2000 + ds + 0.0053 * this.sin(M) - 0.0069 * this.sin(2 * L);
        const result: any = { solarNoon: this.fromJulian(Jnoon), nadir: this.fromJulian(Jnoon - 0.5) };

        const times: [number, keyof SunTimes, keyof SunTimes][] = [
            [-0.833, 'sunrise', 'sunset'], [-0.3, 'sunriseEnd', 'sunsetStart'], [-6, 'dawn', 'dusk'],
            [-12, 'nauticalDawn', 'nauticalDusk'], [-18, 'nightEnd', 'night'], [6, 'goldenHourEnd', 'goldenHour']
        ];

        for (const time of times) {
            const h0 = (time[0] + h) * this.rad;
            const w = this.acos((this.sin(h0) - this.sin(phi) * this.sin(dec)) / (this.cos(phi) * this.cos(dec)));
            const a = 0.0009 + (w + lw) / (2 * this.PI) + n;
            const Jset = this.J2000 + a + 0.0053 * this.sin(M) - 0.0069 * this.sin(2 * L);
            const Jrise = Jnoon - (Jset - Jnoon);
            result[time[1]] = this.fromJulian(Jrise);
            result[time[2]] = this.fromJulian(Jset);
        }
        return result as SunTimes;
    }

    private moonCoords(d: number) {
        const L = this.rad * (218.316 + 13.176396 * d), M = this.rad * (134.963 + 13.064993 * d), F = this.rad * (93.272 + 13.229350 * d);
        const l = L + this.rad * 6.289 * this.sin(M), b = this.rad * 5.128 * this.sin(F), dt = 385001 - 20905 * this.cos(M);
        return { ra: this.rightAscension(l, b), dec: this.declination(l, b), dist: dt };
    }

    getMoonPosition(date: Date, lat: number, lng: number) {
        const lw = this.rad * -lng, phi = this.rad * lat, d = this.toDays(date);
        const c = this.moonCoords(d);
        const H = this.siderealTime(d, lw) - c.ra;
        let h = this.altitude(H, phi, c.dec);
        const pa = this.atan(this.sin(H), this.tan(phi) * this.cos(c.dec) - this.sin(c.dec) * this.cos(H));
        const h_corr = 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.0890117));
        h = h + (h < 0 ? 0 : h_corr);
        return { azimuth: this.azimuth(H, phi, c.dec), altitude: h, distance: c.dist, parallacticAngle: pa };
    }

    getMoonIllumination(date: Date) {
        const d = this.toDays(date || new Date()), s = this.sunCoords(d), m = this.moonCoords(d);
        const sdist = 149598000;
        const phi = this.acos(this.sin(s.dec) * this.sin(m.dec) + this.cos(s.dec) * this.cos(m.dec) * this.cos(s.ra - m.ra));
        const inc = this.atan(sdist * this.sin(phi), m.dist - sdist * this.cos(phi));
        const angle = this.atan(this.cos(s.dec) * this.sin(s.ra - m.ra), this.sin(s.dec) * this.cos(m.dec) - this.cos(s.dec) * this.sin(m.dec) * this.cos(s.ra - m.ra));
        return { fraction: (1 + this.cos(inc)) / 2, phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / this.PI, angle };
    }

    getMoonTimes(date: Date, lat: number, lng: number): { rise?: Date, set?: Date, alwaysUp?: boolean, alwaysDown?: boolean } {
        const t = new Date(date);
        t.setHours(0, 0, 0, 0);
        const hc = 0.133 * this.rad;
        let h0 = this.getMoonPosition(t, lat, lng).altitude - hc, rise: number | undefined, set: number | undefined;

        for (let i = 1; i <= 24; i += 1) {
            const h1 = this.getMoonPosition(new Date(t.getTime() + i * 3600000), lat, lng).altitude - hc;
            const h2 = this.getMoonPosition(new Date(t.getTime() + (i + 1) * 3600000), lat, lng).altitude - hc;
            const a = (h0 + h2) / 2 - h1, b = (h2 - h0) / 2, d = b * b - 4 * a * h1;
            if (d >= 0) {
                const D = Math.sqrt(d), taus = [(-b - D) / (2 * a), (-b + D) / (2 * a)].filter(tau => tau >= 0 && tau < 1);
                if (taus.length > 0) for (const tau of taus) if (h0 < 0) { if (!rise) rise = i + tau; } else { if (!set) set = i + tau; }
            }
            if (rise && set) break;
            h0 = h2;
        }

        const result: { rise?: Date, set?: Date, alwaysUp?: boolean, alwaysDown?: boolean } = {};
        if (rise) result.rise = new Date(t.getTime() + rise * 3600000);
        if (set) result.set = new Date(t.getTime() + set * 3600000);
        if (!rise && !set) result[h0 > 0 ? 'alwaysUp' : 'alwaysDown'] = true;
        return result;
    }
}
