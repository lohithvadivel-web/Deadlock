package com.hackathon.vehiclenet.model

/**
 * Structured event types only — no free-text chat while driving.
 */
enum class EventType {
    NORMAL,
    HARD_BRAKING,
    HAZARD,
    BREAKDOWN,
    MEDICAL,
    ACCIDENT,
    CHARGING_HELP;

    val isHelpRequest: Boolean
        get() = this == BREAKDOWN || this == MEDICAL || this == ACCIDENT || this == CHARGING_HELP

    val label: String
        get() = when (this) {
            NORMAL -> "Normal"
            HARD_BRAKING -> "Hard braking"
            HAZARD -> "Hazard ahead"
            BREAKDOWN -> "Breakdown"
            MEDICAL -> "Medical help"
            ACCIDENT -> "Accident"
            CHARGING_HELP -> "Charging help"
        }
}
