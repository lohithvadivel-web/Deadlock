// vehicle-client/main.js
// Main wiring hub for the Vehicle Client.
//
// Step 7:
// Connect the Saathi UI controls and prepare the vehicle-client
// for the modules that will be added in later steps.

import { connect, isConnected } from "../shared/mqtt.js";
import { initializeMap } from "./ui/map.js";

import {
    initializeSpeechRecognition,
    startListening
} from "./voice/stt.js";

import { speak } from "./voice/tts.js";

// --------------------------------------------------
// DOM ELEMENTS
// --------------------------------------------------

const sharePosition = document.getElementById("sharePosition");

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

        state.connected = isConnected();

        console.log("Vehicle client connected to MQTT.");

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

    console.log("Hazard report requested.");

    showAlert(
        "Hazard reported to nearby vehicles."
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

// --------------------------------------------------
// MICROPHONE
// --------------------------------------------------

if (micButton) {

    micButton.addEventListener(
        "click",
        startListening
    );
}
function handleVoiceCommand(command) {
    console.log("Processing voice command:", command);

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
            "Emergency assistance requested.",
            "critical"
        );
        return;
    }

    showAlert(
        `Voice command not recognised: "${command}"`,
        "warning"
    );
}

// --------------------------------------------------
// NEED HELP
// --------------------------------------------------

function requestHelp() {

    console.log(
        "Help request initiated."
    );

    showAlert(
        "Help request initiated."
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

    showAlert(
        "CRITICAL: Sudden braking detected!"
    );
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

    showAlert(
        "WARNING: Road hazard reported."
    );
}


if (potholeButton) {

    potholeButton.addEventListener(
        "click",
        triggerPothole
    );
}


// --------------------------------------------------
// PRESENTER DEMO — HELP
// --------------------------------------------------

function triggerHelpDemo() {

    console.log(
        "Demo: Help request triggered."
    );

    showAlert(
        "HELP: Assistance request broadcast."
    );
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

    alertBanner.textContent = message;

    alertBanner.style.display = "block";

    // Speak the safety alert
    speak(message);

    setTimeout(() => {
        hideAlert();
    }, 4000);
}


function hideAlert() {

    if (!alertBanner) {
        return;
    }

    alertBanner.style.display = "none";
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

    initializeSpeechRecognition(handleVoiceCommand);

    initializeConnection();
}


initializeVehicleClient();