// vehicle-client/main.js
// Main wiring hub for the Vehicle Client.
//
// Current implementation:
// - Saathi UI controls
// - MQTT / V2V communication
// - Sensor simulation
// - Safety event detection
// - V2V message creation
// - Risk-level based V2V alerts
// - Voice commands
// - Text-to-Speech
// - Privacy control
// - Presenter demo controls
// - Reset functionality


// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import {
    connect,
    isConnected,
    publish,
    subscribe
} from "../shared/mqtt.js";

import { initializeMap } from "./ui/map.js";

import {
    initializeSpeechRecognition,
    startListening
} from "./voice/stt.js";

import {
    getSensorData,
    simulateNormalMovement,
    simulateHardBrake,
    simulateHazard,
    simulateEmergency,
    resetSensors
} from "./sensors/simulated-sensor.js";

import { processSensorData } from "./engine/event-engine.js";

import { createV2VMessage } from "../shared/protocol.js";

import { speak } from "./voice/tts.js";


// --------------------------------------------------
// DOM ELEMENTS
// --------------------------------------------------

const sharePosition =
    document.getElementById("sharePosition");

const reportHazardButton =
    document.getElementById("reportHazard");

const micButton =
    document.getElementById("micButton");

const needHelpButton =
    document.getElementById("needHelp");

const hardBrakeButton =
    document.getElementById("hardBrakeBtn");

const potholeButton =
    document.getElementById("potholeBtn");

const helpDemoButton =
    document.getElementById("helpDemoBtn");

const privacyDemoButton =
    document.getElementById("privacyDemoBtn");

const resetDemoButton =
    document.getElementById("resetDemoBtn");

const alertBanner =
    document.getElementById("alert-banner");


// --------------------------------------------------
// APPLICATION STATE
// --------------------------------------------------

const state = {
    sharingPosition: true,
    connected: false
};


// --------------------------------------------------
// MQTT CONNECTION
// --------------------------------------------------

async function initializeConnection() {

    try {

        await connect();

        state.connected =
            isConnected();

        console.log(
            "Vehicle client connected to MQTT."
        );

        subscribe(
            "v2v/safety",
            handleV2VMessage
        );

        console.log(
            "Listening for V2V safety messages."
        );

    } catch (error) {

        state.connected = false;

        console.warn(
            "MQTT connection is not available yet."
        );

        console.warn(
            "This is normal if the backend/broker is not running."
        );
    }
}


// --------------------------------------------------
// RECEIVE V2V SAFETY MESSAGE
// --------------------------------------------------

function handleV2VMessage(message) {

    console.log(
        "V2V MESSAGE RECEIVED:",
        message
    );

    if (!message) {
        return;
    }

    // Ignore our own messages.
    const ownVehicleId =
        getSensorData().vehicleId;

    if (message.vehicleId === ownVehicleId) {
        return;
    }

    let alertMessage = "";

    // ----------------------------------------------
    // EMERGENCY
    // ----------------------------------------------

    if (message.riskLevel === "EMERGENCY") {

        alertMessage =
            "EMERGENCY: Assistance required nearby.";

    }

    // ----------------------------------------------
    // CRITICAL
    // ----------------------------------------------

    else if (message.riskLevel === "CRITICAL") {

        if (message.messageType === "BRAKING") {

            alertMessage =
                "CRITICAL: Vehicle ahead is braking.";

        }

        else if (message.messageType === "COLLISION") {

            alertMessage =
                "CRITICAL: Collision risk nearby.";

        }

        else {

            alertMessage =
                "CRITICAL: Safety risk detected nearby.";
        }
    }

    // ----------------------------------------------
    // WARNING
    // ----------------------------------------------

    else if (message.riskLevel === "WARNING") {

        if (message.messageType === "HAZARD") {

            alertMessage =
                "WARNING: Road hazard reported nearby.";

        }

        else if (message.messageType === "BREAKDOWN") {

            alertMessage =
                "WARNING: Vehicle breakdown reported nearby.";

        }

        else {

            alertMessage =
                "WARNING: Safety event detected nearby.";
        }
    }

    // ----------------------------------------------
    // SAFE / UNKNOWN
    // ----------------------------------------------

    else {

        alertMessage =
            "SAFE: Vehicle event received.";
    }

    showAlert(alertMessage);
}


// --------------------------------------------------
// PRIVACY
// --------------------------------------------------

function updatePrivacyState() {

    if (!sharePosition) {
        return;
    }

    state.sharingPosition =
        sharePosition.checked;

    console.log(
        "Share position:",
        state.sharingPosition
    );
}


if (sharePosition) {

    sharePosition.addEventListener(
        "change",
        updatePrivacyState
    );
}


// --------------------------------------------------
// REPORT HAZARD
// --------------------------------------------------

function reportHazard() {

    console.log(
        "Hazard report requested."
    );

    // Simulate hazard detection.
    simulateHazard();

    const sensorData =
        getSensorData();

    console.log(
        "Hazard Sensor Data:",
        sensorData
    );

    // Process sensor data.
    const events =
        processSensorData(sensorData);

    events.forEach((event) => {

        console.log(
            "SAFETY EVENT DETECTED:",
            event
        );

        // Create standard V2V message.
        const v2vMessage =
            createV2VMessage(event);

        console.log(
            "V2V HAZARD MESSAGE CREATED:",
            v2vMessage
        );

        // Broadcast hazard message.
        publish(
            "v2v/safety",
            v2vMessage
        );
    });

    // Alert current driver.
    showAlert(
        "WARNING: Hazard reported to nearby vehicles."
    );
}


if (reportHazardButton) {

    reportHazardButton.addEventListener(
        "click",
        reportHazard
    );
}


// --------------------------------------------------
// MICROPHONE
// --------------------------------------------------

if (micButton) {

    micButton.addEventListener(
        "click",
        startListening
    );
}


// --------------------------------------------------
// VOICE COMMAND PROCESSING
// --------------------------------------------------

function handleVoiceCommand(command) {

    console.log(
        "Processing voice command:",
        command
    );

    if (
        command.includes("report hazard") ||
        command.includes("hazard")
    ) {

        reportHazard();

        return;
    }

    if (
        command.includes("need help") ||
        command.includes("need a tow") ||
        command.includes("tow")
    ) {

        requestHelp();

        return;
    }

    if (
        command.includes("emergency")
    ) {

        showAlert(
            "Emergency assistance requested."
        );

        return;
    }

    showAlert(
        `Voice command not recognised: "${command}"`
    );
}


// --------------------------------------------------
// NEED HELP
// --------------------------------------------------

function requestHelp() {

    console.log(
        "Help request initiated."
    );

    // Simulate emergency condition.
    simulateEmergency();

    const sensorData =
        getSensorData();

    console.log(
        "Emergency Sensor Data:",
        sensorData
    );

    // Process sensor data.
    const events =
        processSensorData(sensorData);

    events.forEach((event) => {

        console.log(
            "SAFETY EVENT DETECTED:",
            event
        );

        // Create emergency V2V message.
        const v2vMessage =
            createV2VMessage(event);

        console.log(
            "EMERGENCY V2V MESSAGE CREATED:",
            v2vMessage
        );

        // Broadcast emergency message.
        publish(
            "v2v/safety",
            v2vMessage
        );
    });

    // Alert current driver.
    showAlert(
        "EMERGENCY: Help request broadcast to nearby vehicles."
    );
}


if (needHelpButton) {

    needHelpButton.addEventListener(
        "click",
        requestHelp
    );
}


// --------------------------------------------------
// PRESENTER DEMO — HARD BRAKE
// --------------------------------------------------

function triggerHardBrake() {

    console.log(
        "Demo: Hard brake triggered."
    );

    // Simulate hard braking.
    simulateHardBrake();

    const sensorData =
        getSensorData();

    console.log(
        "Hard Brake Sensor Data:",
        sensorData
    );

    // The event engine requires two consecutive
    // hard-braking ticks.
    const events =
        processSensorData(sensorData);

    const secondEvents =
        processSensorData(sensorData);

    events.push(...secondEvents);

    events.forEach((event) => {

        console.log(
            "SAFETY EVENT DETECTED:",
            event
        );

        // Create V2V message.
        const v2vMessage =
            createV2VMessage(event);

        console.log(
            "HARD BRAKE V2V MESSAGE CREATED:",
            v2vMessage
        );

        // Broadcast braking warning.
        publish(
            "v2v/safety",
            v2vMessage
        );

        // Alert current driver.
        showAlert(
            "CRITICAL: Sudden braking detected!"
        );
    });
}


if (hardBrakeButton) {

    hardBrakeButton.addEventListener(
        "click",
        triggerHardBrake
    );
}


// --------------------------------------------------
// PRESENTER DEMO — POTHOLE
// --------------------------------------------------

function triggerPothole() {

    console.log(
        "Demo: Pothole hazard triggered."
    );

    simulateHazard();

    const sensorData =
        getSensorData();

    console.log(
        "Hazard Sensor Data:",
        sensorData
    );

    const events =
        processSensorData(sensorData);

    events.forEach((event) => {

        console.log(
            "SAFETY EVENT DETECTED:",
            event
        );

        const v2vMessage =
            createV2VMessage(event);

        console.log(
            "V2V MESSAGE CREATED:",
            v2vMessage
        );

        publish(
            "v2v/safety",
            v2vMessage
        );

        showAlert(
            "WARNING: Road hazard reported."
        );
    });
}


if (potholeButton) {

    potholeButton.addEventListener(
        "click",
        triggerPothole
    );
}


// --------------------------------------------------
// PRESENTER DEMO — HELP / EMERGENCY
// --------------------------------------------------

function triggerHelpDemo() {

    console.log(
        "Demo: Emergency triggered."
    );

    simulateEmergency();

    const sensorData =
        getSensorData();

    console.log(
        "Emergency Sensor Data:",
        sensorData
    );

    const events =
        processSensorData(sensorData);

    events.forEach((event) => {

        console.log(
            "SAFETY EVENT DETECTED:",
            event
        );

        const v2vMessage =
            createV2VMessage(event);

        console.log(
            "V2V MESSAGE CREATED:",
            v2vMessage
        );

        publish(
            "v2v/safety",
            v2vMessage
        );

        showAlert(
            "EMERGENCY: Assistance request broadcast."
        );
    });
}


if (helpDemoButton) {

    helpDemoButton.addEventListener(
        "click",
        triggerHelpDemo
    );
}


// --------------------------------------------------
// PRESENTER DEMO — PRIVACY
// --------------------------------------------------

function togglePrivacyDemo() {

    if (!sharePosition) {
        return;
    }

    sharePosition.checked =
        !sharePosition.checked;

    updatePrivacyState();

    console.log(
        "Demo: Privacy toggled."
    );
}


if (privacyDemoButton) {

    privacyDemoButton.addEventListener(
        "click",
        togglePrivacyDemo
    );
}


// --------------------------------------------------
// RESET DEMO
// --------------------------------------------------

function resetDemo() {

    console.log(
        "Demo reset."
    );

    resetSensors();

    if (sharePosition) {

        sharePosition.checked = true;
    }

    state.sharingPosition = true;

    hideAlert();
}


if (resetDemoButton) {

    resetDemoButton.addEventListener(
        "click",
        resetDemo
    );
}


// --------------------------------------------------
// ALERT DISPLAY
// --------------------------------------------------

function showAlert(message) {

    if (!alertBanner) {
        return;
    }

    alertBanner.textContent =
        message;

    alertBanner.style.display =
        "block";

    // Speak safety alert.
    speak(message);

    setTimeout(() => {

        hideAlert();

    }, 4000);
}


function hideAlert() {

    if (!alertBanner) {
        return;
    }

    alertBanner.style.display =
        "none";
}


// --------------------------------------------------
// VEHICLE SENSOR SIMULATION
// --------------------------------------------------

function updateVehicleSensors() {

    simulateNormalMovement();

    const sensorData =
        getSensorData();

    console.log(
        "Vehicle Sensor Data:",
        sensorData
    );

    const events =
        processSensorData(sensorData);

    if (events.length > 0) {

        events.forEach((event) => {

            console.log(
                "SAFETY EVENT DETECTED:",
                event
            );

            const v2vMessage =
                createV2VMessage(event);

            console.log(
                "V2V MESSAGE CREATED:",
                v2vMessage
            );

            publish(
                "v2v/safety",
                v2vMessage
            );
        });
    }
}


// --------------------------------------------------
// INITIALIZATION
// --------------------------------------------------

function initializeVehicleClient() {

    console.log(
        "Saathi Vehicle Client starting..."
    );

    updatePrivacyState();

    initializeMap();

    initializeSpeechRecognition(
        handleVoiceCommand
    );

    initializeConnection();

    setInterval(
        updateVehicleSensors,
        1000
    );
}


// --------------------------------------------------
// START APPLICATION
// --------------------------------------------------

initializeVehicleClient();