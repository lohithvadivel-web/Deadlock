// vehicle-client/voice/phrases.js
// Standard voice messages used by the Saathi vehicle client.

export const VOICE_PHRASES = {

    BRAKING:
        "Warning. Vehicle braking ahead.",

    COLLISION:
        "Critical collision risk ahead.",

    EMERGENCY:
        "Emergency event detected nearby.",

    BREAKDOWN:
        "Vehicle breakdown reported nearby.",

    HAZARD:
        "Road hazard reported nearby.",

    HELP_REQUESTED:
        "Help request has been sent to nearby vehicles.",

    HAZARD_REPORTED:
        "Hazard reported to nearby vehicles.",

    PRIVACY_ON:
        "Position sharing enabled.",

    PRIVACY_OFF:
        "Position sharing disabled.",

    VOICE_NOT_RECOGNISED:
        "Sorry, I did not understand that command."
};


// Get a phrase by its name
export function getPhrase(name) {

    return VOICE_PHRASES[name] ||
        "Message unavailable.";
}