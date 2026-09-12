package com.hackathon.vehiclenet.data

import com.hackathon.vehiclenet.model.EventType
import com.hackathon.vehiclenet.model.VehicleUpdate
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * Creates several virtual vehicles moving in loose circles around a center point,
 * so the demo works even with zero real devices in the room.
 * One virtual vehicle triggers a HAZARD event partway through, to show the
 * alert flow to judges without waiting on a real driving maneuver.
 */
class DemoModeSimulator(
    private val centerLat: Double,
    private val centerLon: Double,
    private val vehicleCount: Int = 8
) {
    private data class SimVehicle(
        val id: String,
        val angleOffset: Double,
        val radiusDegrees: Double,
        val speedDegPerTick: Double,
        var elapsedTicks: Int = 0,
        var triggeredEvent: Boolean = false
    )

    fun stream(tickMillis: Long = 1000L): Flow<List<VehicleUpdate>> = flow {
        val sims = (0 until vehicleCount).map {
            SimVehicle(
                id = "demo-${it + 1}",
                angleOffset = Random.nextDouble(0.0, 360.0),
                radiusDegrees = Random.nextDouble(0.001, 0.004), // roughly 100-450m
                speedDegPerTick = Random.nextDouble(2.0, 6.0)
            )
        }
        val eventVehicleIndex = Random.nextInt(sims.size)

        while (true) {
            val now = System.currentTimeMillis()
            val updates = sims.mapIndexed { index, sim ->
                sim.elapsedTicks++
                val angle = Math.toRadians(sim.angleOffset + sim.elapsedTicks * sim.speedDegPerTick)
                val lat = centerLat + sim.radiusDegrees * sin(angle)
                val lon = centerLon + sim.radiusDegrees * cos(angle)
                val heading = ((Math.toDegrees(angle) + 90) + 360) % 360
                val speed = Random.nextDouble(20.0, 55.0)

                // ~20s into the demo, one vehicle reports a hazard so judges see an alert fire
                val event = if (index == eventVehicleIndex && sim.elapsedTicks == 20) {
                    sim.triggeredEvent = true
                    EventType.HAZARD
                } else if (sim.triggeredEvent && sim.elapsedTicks < 25) {
                    EventType.HAZARD
                } else {
                    EventType.NORMAL
                }

                VehicleUpdate(
                    vehicleId = sim.id,
                    vehicleType = if (index % 3 == 0) "BIKE" else "CAR",
                    latitude = lat,
                    longitude = lon,
                    speedKmph = speed,
                    heading = heading,
                    event = event.name,
                    updatedAt = now
                )
            }
            emit(updates)
            delay(tickMillis)
        }
    }
}
