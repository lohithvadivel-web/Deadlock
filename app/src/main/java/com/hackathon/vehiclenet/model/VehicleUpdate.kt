package com.hackathon.vehiclenet.model

/**
 * The one record each vehicle writes to Firebase, once a second.
 * Deliberately minimal: no name, no phone number, no permanent ID.
 */
data class VehicleUpdate(
    val vehicleId: String = "",
    val vehicleType: String = "CAR", // "CAR" or "BIKE"
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val speedKmph: Double = 0.0,
    val heading: Double = 0.0, // degrees, 0 = north
    val event: String = EventType.NORMAL.name,
    val updatedAt: Long = 0L
) {
    // Explicit no-arg constructor: required for Firebase's reflection-based
    // deserialization of Realtime Database snapshots into this class.
    constructor() : this("", "CAR", 0.0, 0.0, 0.0, 0.0, EventType.NORMAL.name, 0L)
}
