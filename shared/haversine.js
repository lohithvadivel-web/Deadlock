
// Calculates the distance between two GPS coordinates in metres.

const EARTH_RADIUS_METERS = 6371000;


/**
 * Calculate the distance between two latitude/longitude points.
 *
 * @param {number} lat1 - Latitude of first vehicle
 * @param {number} lon1 - Longitude of first vehicle
 * @param {number} lat2 - Latitude of second vehicle
 * @param {number} lon2 - Longitude of second vehicle
 * @returns {number} Distance in metres
 */
export function haversine(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => {
        return degrees * Math.PI / 180;
    };

    const latitudeDifference = toRadians(lat2 - lat1);
    const longitudeDifference = toRadians(lon2 - lon1);

    const lat1Radians = toRadians(lat1);
    const lat2Radians = toRadians(lat2);

    const a =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(lat1Radians) *
        Math.cos(lat2Radians) *
        Math.sin(longitudeDifference / 2) ** 2;

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return EARTH_RADIUS_METERS * c;
}