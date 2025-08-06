// tle-parser.js - Two Line Element parser
import { PHYSICS } from './physics.js';

export class TLEParser {
    static parse(tleString) {
        // Accept both 2-line (classic) and 3-line (name + 2) formats

        const lines = tleString.trim().split(/\r?\n/).filter(l=>l.trim().length>0);
        const satellites = [];
        
        for (let i = 0; i < lines.length; ) {
            const current = lines[i].trim();
            // Case 1: name present (does not start with 1 or 2)
            if (!current.startsWith('1 ') && (i + 2 < lines.length) && lines[i+1].startsWith('1 ') && lines[i+2].startsWith('2 ')) {
                const name = current;
                const line1 = lines[i+1].trim();
                const line2 = lines[i+2].trim();
                const sat = this.parseTLELines(name, line1, line2);
                if (sat) satellites.push(sat);
                i += 3;
            }
            // Case 2: no name line (current is line1 starting with '1 ')
            else if (current.startsWith('1 ') && (i + 1 < lines.length) && lines[i+1].startsWith('2 ')) {
                const line1 = current;
                const line2 = lines[i+1].trim();
                const sat = this.parseTLELines('TLE-'+satellites.length, line1, line2);
                if (sat) satellites.push(sat);
                i += 2;
            } else {
                // Malformed line, skip
                i += 1;
            }
        }
        
        return satellites;
    }
    
    static parseTLELines(name, line1, line2) {
        try {
            // Parse epoch from line 1
            const epochYear = parseInt(line1.substring(18, 20));
            const epochDay = parseFloat(line1.substring(20, 32));
            const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
            
            // Parse orbital elements from line 2
            const inclination = parseFloat(line2.substring(8, 16)) * Math.PI / 180;
            const raan = parseFloat(line2.substring(17, 25)) * Math.PI / 180;
            const eccentricity = parseFloat('0.' + line2.substring(26, 33));
            const argOfPerigee = parseFloat(line2.substring(34, 42)) * Math.PI / 180;
            const meanAnomaly = parseFloat(line2.substring(43, 51)) * Math.PI / 180;
            const meanMotion = parseFloat(line2.substring(52, 63)); // rev/day
            
            // Convert to standard units
            const n = meanMotion * 2 * Math.PI / 86400; // rad/s
            const a = Math.pow(PHYSICS.MU / (n * n), 1/3); // semi-major axis in meters
            
            // Calculate epoch time
            const epochDate = new Date(fullYear, 0, 1);
            epochDate.setDate(epochDay);
            const epoch = epochDate.getTime() / 1000;
            
            return {
                name: name,
                type: 'TLE',
                a: a,
                e: eccentricity,
                i: inclination,
                raan: raan,
                argp: argOfPerigee,
                M0: meanAnomaly,
                epoch: epoch
            };
        } catch (error) {
            console.error('Error parsing TLE:', error);
            return null;
        }
    }
}