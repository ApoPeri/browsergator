// constellations.js - manage constellation groups and defaults
export const constellations = [];

export function addConstellation({ name, color = '#4ade80', sensor = { fov: 45, rangeKm: 500 } }) {
    if (!name) return;
    if (constellations.find(c => c.name === name)) return; // unique
    constellations.push({ name, color, sensor, members: [] });
}

export function removeConstellation(name) {
    const idx = constellations.findIndex(c => c.name === name);
    if (idx !== -1) {
        constellations.splice(idx, 1);
    }
}

export function assignSatellite(satObj, constellationName) {
    const c = constellations.find(c => c.name === constellationName);
    if (!c) return;
    if (!c.members.includes(satObj)) {
        c.members.push(satObj);
        satObj.constellation = constellationName;
        if(typeof window!=='undefined') window.dispatchEvent(new CustomEvent('constellationChanged'));
    }
}

export function unassignSatellite(satObj) {
    if (!satObj.constellation) return;
    const c = constellations.find(c => c.name === satObj.constellation);
    if (c) {
        const idx = c.members.indexOf(satObj);
        if (idx !== -1) c.members.splice(idx, 1);
        if(typeof window!=='undefined') window.dispatchEvent(new CustomEvent('constellationChanged'));
    }
    delete satObj.constellation;
}

export function updateConstellationColor(name, color) {
    const c = constellations.find(c => c.name === name);
    if (c) c.color = color;
}

export function getConstellation(name) {
    return constellations.find(c => c.name === name);
}
