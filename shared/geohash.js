
// Converts latitude/longitude into a geohash
// and finds the 8 surrounding geohash cells.

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";


// Encode latitude and longitude into a geohash
export function encode(latitude, longitude, precision = 7) {
    let latRange = [-90.0, 90.0];
    let lonRange = [-180.0, 180.0];

    let geohash = "";
    let bits = 0;
    let bitCount = 0;
    let even = true;

    while (geohash.length < precision) {
        let range;
        
        if (even) {
            range = lonRange;
        } else {
            range = latRange;
        }

        const mid = (range[0] + range[1]) / 2;

        if ((even && longitude >= mid) || (!even && latitude >= mid)) {
            bits = (bits << 1) | 1;
            range[0] = mid;
        } else {
            bits = bits << 1;
            range[1] = mid;
        }

        bitCount++;

        if (bitCount === 5) {
            geohash += BASE32[bits];
            bits = 0;
            bitCount = 0;
        }

        even = !even;
    }

    return geohash;
}


// Return the 8 neighboring geohash cells
export function neighbors(geohash) {
    const result = new Set();

    const decoded = decode(geohash);

    const latStep = decoded.latError * 2;
    const lonStep = decoded.lonError * 2;

    for (let latOffset = -1; latOffset <= 1; latOffset++) {
        for (let lonOffset = -1; lonOffset <= 1; lonOffset++) {

            // Skip the original cell
            if (latOffset === 0 && lonOffset === 0) {
                continue;
            }

            const lat = decoded.latitude + latOffset * latStep;
            const lon = decoded.longitude + lonOffset * lonStep;

            result.add(encode(lat, lon, geohash.length));
        }
    }

    return [...result];
}


// Decode a geohash back into its approximate location
function decode(geohash) {
    let latRange = [-90.0, 90.0];
    let lonRange = [-180.0, 180.0];

    let even = true;

    for (const character of geohash) {
        const value = BASE32.indexOf(character);

        if (value === -1) {
            throw new Error(`Invalid geohash character: ${character}`);
        }

        for (let mask = 16; mask > 0; mask >>= 1) {

            if (even) {
                if (value & mask) {
                    lonRange[0] =
                        (lonRange[0] + lonRange[1]) / 2;
                } else {
                    lonRange[1] =
                        (lonRange[0] + lonRange[1]) / 2;
                }
            } else {
                if (value & mask) {
                    latRange[0] =
                        (latRange[0] + latRange[1]) / 2;
                } else {
                    latRange[1] =
                        (latRange[0] + latRange[1]) / 2;
                }
            }

            even = !even;
        }
    }

    return {
        latitude: (latRange[0] + latRange[1]) / 2,
        longitude: (lonRange[0] + lonRange[1]) / 2,
        latError: (latRange[1] - latRange[0]) / 2,
        lonError: (lonRange[1] - lonRange[0]) / 2
    };
}