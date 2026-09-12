package com.hackathon.vehiclenet.logic

import com.hackathon.vehiclenet.model.EventType
import com.hackathon.vehiclenet.model.VehicleUpdate
import kotlin.math.abs
import kotlin.math.roundToInt

data class Alert(
    val fromVehicleId: String,
    val event: EventType,
    val distanceMeters: Double,
    val bearingDegrees: Double, // direction FROM self TO the other vehicle
    val message: String
)

/**
 * All the "which alerts matter" logic lives here, client-side, so it's easy
 * to demo and tweak without touching cloud rules.
 */
class NearbyVehicleEngine(
    private val radiusMeters: Double = 500.0,
    private val staleAfterMs: Long = 5000L,
    private val hardBrakeDropKmph: Double = 15.0,
    private val headingToleranceDegrees: Double = 45.0
) {
    // last-seen speed per vehicle, used only to detect hard braking
    private val lastSpeedByVehicle = mutableMapOf<String, Double>()

    fun evaluate(self: VehicleUpdate, others: List<VehicleUpdate>, now: Long): List<Alert> {
        val alerts = mutableListOf<Alert>()

        for (other in others) {
            if (other.vehicleId == self.vehicleId) continue
            if (now - other.updatedAt > staleAfterMs) continue // stale record, ignore

            val distance = GeoUtils.haversineMeters(self.latitude, self.longitude, other.latitude, other.longitude)
            if (distance > radiusMeters) {
                lastSpeedByVehicle.remove(other.vehicleId)
                continue
            }

            val bearing = GeoUtils.bearingDegrees(self.latitude, self.longitude, other.latitude, other.longitude)
            val headingDiff = angleDifference(self.heading, other.heading)
            val otherEvent = runCatching { EventType.valueOf(other.event) }.getOrDefault(EventType.NORMAL)

            // 1. explicit event (hazard reported, or a help request)
            if (otherEvent != EventType.NORMAL && otherEvent != EventType.HARD_BRAKING) {
                alerts += Alert(
                    fromVehicleId = other.vehicleId,
                    event = otherEvent,
                    distanceMeters = distance,
                    bearingDegrees = bearing,
                    message = "${otherEvent.label} nearby: ${distance.roundToInt()} m, ${GeoUtils.compassLabel(bearing)}"
                )
            }

            // 2. hard-braking inference: sharp speed drop + similar direction
            val previousSpeed = lastSpeedByVehicle[other.vehicleId]
            if (previousSpeed != null &&
                previousSpeed - other.speedKmph >= hardBrakeDropKmph &&
                headingDiff <= headingToleranceDegrees
            ) {
                alerts += Alert(
                    fromVehicleId = other.vehicleId,
                    event = EventType.HARD_BRAKING,
                    distanceMeters = distance,
                    bearingDegrees = bearing,
                    message = "Hazard ahead: vehicle braking (${distance.roundToInt()} m, ${GeoUtils.compassLabel(bearing)})"
                )
            }
            lastSpeedByVehicle[other.vehicleId] = other.speedKmph
        }

        return alerts
    }

    private fun angleDifference(a: Double, b: Double): Double {
        val diff = abs(a - b) % 360
        return if (diff > 180) 360 - diff else diff
    }
}
