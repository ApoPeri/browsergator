// physics.js - Core physics constants and coordinate transformations
export const PHYSICS = {
    MU: 3.986004418e14,        // Earth's gravitational parameter (m^3/s^2)
    J2: 1.08262668e-3,         // J2 perturbation coefficient
    EARTH_RADIUS: 6.378137e6,  // Earth's radius (m)
    EARTH_RADIUS_KM: 6371,     // Earth's radius (km)
    WGS84_A: 6378137.0,        // WGS84 semi-major axis (m)
    WGS84_F: 1.0 / 298.257223563, // WGS84 flattening
};

// Derived WGS84 constants
PHYSICS.WGS84_B = PHYSICS.WGS84_A * (1 - PHYSICS.WGS84_F);
PHYSICS.WGS84_E2 = 1 - (PHYSICS.WGS84_B / PHYSICS.WGS84_A) ** 2;

export const CoordinateSystem = {
    NADIR: 'nadir',
    VELOCITY: 'velocity', 
    SUN: 'sun',
    CUSTOM: 'custom'
};

export class CoordinateTransforms {
    static eciToEcef(x_eci, y_eci, z_eci, time) {
        const gmst = this.calculateGMST(time);
        const cosGmst = Math.cos(gmst);
        const sinGmst = Math.sin(gmst);
        
        return {
            x_ecef: cosGmst * x_eci + sinGmst * y_eci,
            y_ecef: -sinGmst * x_eci + cosGmst * y_eci,
            z_ecef: z_eci
        };
    }
    
    static ecefToGeodetic(x, y, z) {
        // Calculate longitude
        const lng = Math.atan2(y, x) * 180.0 / Math.PI;
        
        // Calculate latitude iteratively
        const p = Math.sqrt(x*x + y*y);
        let lat = Math.atan2(z, p * (1 - PHYSICS.WGS84_E2));
        
        // Iterate to improve latitude calculation
        for (let i = 0; i < 5; i++) {
            const N = PHYSICS.WGS84_A / Math.sqrt(1 - PHYSICS.WGS84_E2 * Math.sin(lat)**2);
            const h = p / Math.cos(lat) - N;
            lat = Math.atan2(z, p * (1 - PHYSICS.WGS84_E2 * N / (N + h)));
        }
        
        // Final altitude calculation
        const N = PHYSICS.WGS84_A / Math.sqrt(1 - PHYSICS.WGS84_E2 * Math.sin(lat)**2);
        const h = p / Math.cos(lat) - N;
        
        return {
            lat: lat * 180.0 / Math.PI,
            lng: lng,
            alt: h / 1000.0 // Convert to km
        };
    }
    
    static calculateGMST(unixTime) {
        const jd = unixTime / 86400 + 2440587.5;
        const t = (jd - 2451545.0) / 36525;
        
        let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
                  0.000387933 * t * t - t * t * t / 38710000;
        
        return (gmst % 360) * Math.PI / 180;
    }
}