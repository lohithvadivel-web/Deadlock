// vehicle-client/voice/stt.js
// Speech-to-Text module for driver voice commands.

let recognition = null;
let listening = false;

export function initializeSpeechRecognition(onCommand) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.error("Speech Recognition is NOT supported.");
        alert(
            "Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
        );
        return false;
    }

    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
        listening = true;

        console.log("🎤 Listening...");

        alert("🎤 Listening... Please speak now.");
    };

    recognition.onresult = (event) => {

        const transcript =
            event.results[0][0].transcript
                .trim()
                .toLowerCase();

        console.log("Voice command received:", transcript);

        if (typeof onCommand === "function") {
            onCommand(transcript);
        }
    };

    recognition.onerror = (event) => {

        listening = false;

        console.error(
            "Speech recognition error:",
            event.error
        );

        if (event.error === "not-allowed") {

            alert(
                "Microphone permission was denied. Please allow microphone access for localhost."
            );

        } else if (event.error === "no-speech") {

            alert(
                "No speech detected. Please click Speak and try again."
            );

        } else {

            alert(
                "Voice recognition error: " + event.error
            );
        }
    };

    recognition.onend = () => {

        listening = false;

        console.log("🎤 Voice recognition stopped.");
    };

    console.log("Speech recognition initialized.");

    return true;
}


export function startListening() {

    if (!recognition) {

        console.error(
            "Speech recognition has not been initialized."
        );

        alert(
            "Voice recognition is not initialized."
        );

        return;
    }

    if (listening) {
        return;
    }

    try {

        console.log("Starting microphone...");

        recognition.start();

    } catch (error) {

        console.error(
            "Could not start speech recognition:",
            error
        );
    }
}


export function stopListening() {

    if (!recognition) {
        return;
    }

    try {
        recognition.stop();
    } catch (error) {
        console.warn(error);
    }
}


export function isListening() {
    return listening;
}