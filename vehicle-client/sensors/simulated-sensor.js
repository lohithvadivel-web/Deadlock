// vehicle-client/sensors/simulated-sensor.js
// Simulates vehicle sensor data for the Saathi project.

const sensorState = {
    vehicleId: "A92F",

    latitude: 11.0168,
    longitude: 76.9558,

    speed: 42,

    battery: 82,

    acceleration: 0,

    braking: false,

    hazard: false,

    emergency: false
};


// --------------------------------------------------
// GET CURRENT SENSOR DATA
// --------------------------------------------------

export function getSensorData() {
    return {
        vehicleId: sensorState.vehicleId,

        latitude: sensorState.latitude,
        longitude: sensorState.longitude,

        speed: sensorState.speed,

        battery: sensorState.battery,

        acceleration: sensorState.acceleration,

        braking: sensorState.braking,

        hazard: sensorState.hazard,

        emergency: sensorState.emergency,

        timestamp: Date.now()
    };
}


// --------------------------------------------------
// SIMULATE NORMAL VEHICLE MOVEMENT
// --------------------------------------------------

export function simulateNormalMovement() {

    sensorState.speed +=
        (Math.random() - 0.5) * 4;

    sensorState.speed = Math.max(
        0,
        Math.min(80, sensorState.speed)
    );


    sensorState.acceleration =
        (Math.random() - 0.5) * 2;


    // Small GPS movement

    sensorState.latitude +=
        (Math.random() - 0.5) * 0.0001;

    sensorState.longitude +=
        (Math.random() - 0.5) * 0.0001;


    // Slowly reduce battery

    sensorState.battery =
        Math.max(
            0,
            sensorState.battery - 0.01
        );


    sensorState.braking = false;
    sensorState.hazard = false;
    sensorState.emergency = false;
}


// --------------------------------------------------
// SIMULATE HARD BRAKING
// --------------------------------------------------

export function simulateHardBrake() {

    sensorState.braking = true;

    sensorState.acceleration = -8;

    sensorState.speed = Math.max(
        0,
        sensorState.speed - 20
    );
}


// --------------------------------------------------
// SIMULATE HAZARD
// --------------------------------------------------

export function simulateHazard() {

    sensorState.hazard = true;
}


// --------------------------------------------------
// SIMULATE EMERGENCY
// --------------------------------------------------

export function simulateEmergency() {

    sensorState.emergency = true;
}


// --------------------------------------------------
// RESET SENSOR
// --------------------------------------------------

export function resetSensors() {

    sensorState.speed = 42;

    sensorState.battery = 82;

    sensorState.acceleration = 0;

    sensorState.braking = false;

    sensorState.hazard = false;

    sensorState.emergency = false;
}


// --------------------------------------------------
// CHANGE VEHICLE ID
// --------------------------------------------------

export function setVehicleId(id) {

    if (!id) {
        return;
    }

    sensorState.vehicleId = id;
}