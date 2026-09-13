// vehicle-client/voice/tts.js
// Text-to-Speech module for driver safety alerts.

import { getPhrase } from "./phrases.js";

const DEFAULT_RATE = 1.02;
const DEFAULT_PITCH = 1.0;


// Speak any message
export function speak(message) {

    if (!message) {
        return;
    }

    if (!("speechSynthesis" in window)) {

        console.warn(
            "Text-to-Speech is not supported by this browser."
        );

        return;
    }

    try {

        window.speechSynthesis.cancel();

        const utterance =
            new SpeechSynthesisUtterance(message);

        utterance.rate = DEFAULT_RATE;
        utterance.pitch = DEFAULT_PITCH;

        window.speechSynthesis.speak(utterance);

    } catch (error) {

        console.warn(
            "Text-to-Speech failed:",
            error
        );
    }
}


// Speak a predefined safety phrase
export function speakMessage(
    messageType,
    distance = null
) {

    let message;

    if (distance !== null) {

        if (messageType === "BRAKING") {

            message =
                `Warning. Vehicle braking ahead at ${Math.round(distance)} metres.`;

        } else if (messageType === "COLLISION") {

            message =
                `Critical collision risk at ${Math.round(distance)} metres.`;

        } else {

            message = getPhrase(messageType);
        }

    } else {

        message = getPhrase(messageType);
    }

    speak(message);
}


// Stop current voice message
export function stopSpeaking() {

    if ("speechSynthesis" in window) {

        window.speechSynthesis.cancel();
    }
}