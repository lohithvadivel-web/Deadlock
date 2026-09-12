package com.hackathon.vehiclenet.data

import android.annotation.SuppressLint
import android.content.Context
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

data class LiveLocation(
    val latitude: Double,
    val longitude: Double,
    val speedKmph: Double,
    val heading: Double
)

/**
 * Wraps FusedLocationProviderClient and emits one LiveLocation per second.
 * Caller (Activity/ViewModel) must have already been granted ACCESS_FINE_LOCATION
 * before collecting this flow.
 */
class LocationTracker(context: Context) {

    private val client = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission") // permission is checked by the caller before starting
    fun locationUpdates(): Flow<LiveLocation> = callbackFlow {
        val request = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY, 1000L // one update per second, per spec
        ).setMinUpdateIntervalMillis(1000L).build()

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val loc = result.lastLocation ?: return
                trySend(
                    LiveLocation(
                        latitude = loc.latitude,
                        longitude = loc.longitude,
                        speedKmph = loc.speed * 3.6, // m/s -> km/h
                        heading = loc.bearing.toDouble()
                    )
                )
            }
        }

        client.requestLocationUpdates(request, callback, null)
        awaitClose { client.removeLocationUpdates(callback) }
    }
}
