
// Single source of truth for V2V safety thresholds and message types

export const THRESHOLDS = {
    // Sudden braking detection
    DECELERATION: 7,

    // Number of consecutive ticks required
    BRAKING_TICKS: 2,

    // Maximum distance for a relevant V2V message
    RANGE_METERS: 500,

    // Message lifetime
    TTL_MS: 5000,

    // Vehicle speed above which distracting controls are hidden
    DISTRACTION_SPEED_KMH: 25
};


// Risk levels used by the vehicle safety system
export const RISK_LEVELS = {
    SAFE: "SAFE",
    WARNING: "WARNING",
    CRITICAL: "CRITICAL",
    EMERGENCY: "EMERGENCY"
};


// Types of V2V events/messages
export const MESSAGE_TYPES = {
    BRAKING: "BRAKING",
    COLLISION: "COLLISION",
    EMERGENCY: "EMERGENCY",
    BREAKDOWN: "BREAKDOWN",
    HAZARD: "HAZARD"
};


// Basic protocol information
export const PROTOCOL = {
    VERSION: "1.0",
    SOURCE: "vehicle-client"
};

// Creates the standard message sent between vehicles.
export function createV2VMessage(event) {
    if (!event) {
        return null;
    }

    return {
        protocolVersion: PROTOCOL.VERSION,
        source: PROTOCOL.SOURCE,
        vehicleId: event.vehicleId,
        messageType: event.type,
        riskLevel: getRiskLevel(event),
        latitude: event.latitude,
        longitude: event.longitude,
        speed: event.speed ?? null,
        battery: event.battery ?? null,
        timestamp: event.timestamp ?? Date.now()
    };
}
// Determines the risk level of a V2V safety event.
export function getRiskLevel(event) {

    if (!event) {
        return RISK_LEVELS.SAFE;
    }

    if (event.type === MESSAGE_TYPES.EMERGENCY) {
        return RISK_LEVELS.EMERGENCY;
    }

    if (event.type === MESSAGE_TYPES.COLLISION) {
        return RISK_LEVELS.CRITICAL;
    }

    if (event.type === MESSAGE_TYPES.BRAKING) {
        return RISK_LEVELS.CRITICAL;
    }

    if (event.type === MESSAGE_TYPES.BREAKDOWN) {
        return RISK_LEVELS.WARNING;
    }

    if (event.type === MESSAGE_TYPES.HAZARD) {
        return RISK_LEVELS.WARNING;
    }

    return RISK_LEVELS.SAFE;
}