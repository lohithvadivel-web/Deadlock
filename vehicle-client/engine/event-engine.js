// vehicle-client/engine/event-engine.js
// Detects safety events from simulated vehicle sensor data.

import {
    THRESHOLDS,
    MESSAGE_TYPES
} from "../../shared/protocol.js";


// --------------------------------------------------
// EVENT STATE
// --------------------------------------------------

let brakingTicks = 0;


// --------------------------------------------------
// PROCESS SENSOR DATA
// --------------------------------------------------

export function processSensorData(sensorData) {

    if (!sensorData) {
        return [];
    }

    const events = [];

    // ----------------------------------------------
    // HARD BRAKING DETECTION
    // ----------------------------------------------

    if (
        sensorData.acceleration <=
        -THRESHOLDS.DECELERATION
    ) {

        brakingTicks++;

    } else {

        brakingTicks = 0;
    }


    // Require braking for the configured number
    // of sensor ticks before creating an event.

    if (
        brakingTicks >=
        THRESHOLDS.BRAKING_TICKS
    ) {

        events.push({
            type: MESSAGE_TYPES.BRAKING,

            vehicleId: sensorData.vehicleId,

            latitude: sensorData.latitude,

            longitude: sensorData.longitude,

            speed: sensorData.speed,

            timestamp: sensorData.timestamp
        });

        // Prevent duplicate events
        brakingTicks = 0;
    }


    // ----------------------------------------------
    // HAZARD DETECTION
    // ----------------------------------------------

    if (sensorData.hazard === true) {

        events.push({
            type: MESSAGE_TYPES.HAZARD,

            vehicleId: sensorData.vehicleId,

            latitude: sensorData.latitude,

            longitude: sensorData.longitude,

            timestamp: sensorData.timestamp
        });
    }


    // ----------------------------------------------
    // EMERGENCY DETECTION
    // ----------------------------------------------

    if (sensorData.emergency === true) {

        events.push({
            type: MESSAGE_TYPES.EMERGENCY,

            vehicleId: sensorData.vehicleId,

            latitude: sensorData.latitude,

            longitude: sensorData.longitude,

            timestamp: sensorData.timestamp
        });
    }


    // ----------------------------------------------
    // LOW BATTERY DETECTION
    // ----------------------------------------------

    if (sensorData.battery <= 20) {

        events.push({
            type: MESSAGE_TYPES.BREAKDOWN,

            vehicleId: sensorData.vehicleId,

            latitude: sensorData.latitude,

            longitude: sensorData.longitude,

            battery: sensorData.battery,

            timestamp: sensorData.timestamp
        });
    }


    return events;
}


// --------------------------------------------------
// RESET EVENT ENGINE
// --------------------------------------------------

export function resetEventEngine() {

    brakingTicks = 0;
}