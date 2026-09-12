package com.hackathon.vehiclenet.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.hackathon.vehiclenet.data.DemoModeSimulator
import com.hackathon.vehiclenet.data.FirebaseVehicleRepository
import com.hackathon.vehiclenet.data.LocationTracker
import com.hackathon.vehiclenet.data.VehicleIdProvider
import com.hackathon.vehiclenet.logic.Alert
import com.hackathon.vehiclenet.logic.NearbyVehicleEngine
import com.hackathon.vehiclenet.model.EventType
import com.hackathon.vehiclenet.model.VehicleUpdate
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class DriveState { STOPPED, DRIVING, DEMO }

data class VehicleUiState(
    val driveState: DriveState = DriveState.STOPPED,
    val self: VehicleUpdate? = null,
    val nearby: List<VehicleUpdate> = emptyList(),
    val alerts: List<Alert> = emptyList(),
    val canOfferHelp: Boolean = false // true once self has been stationary a few ticks
)

class VehicleViewModel(application: Application) : AndroidViewModel(application) {

    private val idProvider = VehicleIdProvider(application)
    private val locationTracker = LocationTracker(application)
    private val repository = FirebaseVehicleRepository()
    private val nearbyEngine = NearbyVehicleEngine()

    private val _uiState = MutableStateFlow(VehicleUiState())
    val uiState: StateFlow<VehicleUiState> = _uiState.asStateFlow()

    private var vehicleType = "CAR"
    private var stationaryTicks = 0
    private var driveJob: Job? = null

    fun setVehicleType(type: String) {
        vehicleType = type
    }

    /** Real GPS + Firebase path. Caller must have already granted location permission. */
    fun startRealDrive() {
        stopAll()
        _uiState.value = _uiState.value.copy(driveState = DriveState.DRIVING)

        driveJob = viewModelScope.launch {
            repository.ensureSignedIn()
            val vehicleId = idProvider.currentId()

            launch {
                locationTracker.locationUpdates().collect { loc ->
                    val update = VehicleUpdate(
                        vehicleId = vehicleId,
                        vehicleType = vehicleType,
                        latitude = loc.latitude,
                        longitude = loc.longitude,
                        speedKmph = loc.speedKmph,
                        heading = loc.heading,
                        event = _uiState.value.self?.event ?: EventType.NORMAL.name,
                        updatedAt = System.currentTimeMillis()
                    )
                    repository.publish(update)
                    trackStationary(update.speedKmph)
                    _uiState.value = _uiState.value.copy(self = update)
                }
            }

            launch {
                repository.observeVehicles().collect { others ->
                    processOthers(others)
                }
            }
        }
    }

    /** Demo Mode: no GPS, no Firebase, pure local simulation for judges. */
    fun startDemoMode() {
        stopAll()
        _uiState.value = _uiState.value.copy(driveState = DriveState.DEMO)

        // Fixed demo center; swap for a real starting fix if you have one.
        val simulator = DemoModeSimulator(centerLat = 11.0168, centerLon = 76.9558)
        val selfUpdate = VehicleUpdate(
            vehicleId = "you",
            vehicleType = vehicleType,
            latitude = 11.0168,
            longitude = 76.9558,
            speedKmph = 30.0,
            heading = 0.0,
            event = EventType.NORMAL.name,
            updatedAt = System.currentTimeMillis()
        )
        _uiState.value = _uiState.value.copy(self = selfUpdate, canOfferHelp = true)

        driveJob = viewModelScope.launch {
            simulator.stream().collect { others -> processOthers(others) }
        }
    }

    fun stopAll() {
        driveJob?.cancel()
        driveJob = null
        _uiState.value.self?.let {
            if (_uiState.value.driveState == DriveState.DRIVING) repository.clear(it.vehicleId)
        }
        _uiState.value = VehicleUiState()
        stationaryTicks = 0
    }

    fun requestHelp(event: EventType) {
        val current = _uiState.value.self ?: return
        val updated = current.copy(event = event.name)
        _uiState.value = _uiState.value.copy(self = updated)
        if (_uiState.value.driveState == DriveState.DRIVING) repository.publish(updated)
    }

    fun cancelHelp() {
        val current = _uiState.value.self ?: return
        val updated = current.copy(event = EventType.NORMAL.name)
        _uiState.value = _uiState.value.copy(self = updated)
        if (_uiState.value.driveState == DriveState.DRIVING) repository.publish(updated)
    }

    fun offerHelpTo(targetVehicleId: String) {
        val self = _uiState.value.self ?: return
        if (_uiState.value.driveState == DriveState.DRIVING) {
            repository.offerHelp(targetVehicleId, self.vehicleId)
        }
    }

    private fun processOthers(others: List<VehicleUpdate>) {
        val self = _uiState.value.self ?: return
        val now = System.currentTimeMillis()
        val alerts = nearbyEngine.evaluate(self, others, now)
        val nearbyOnly = others.filter { it.vehicleId != self.vehicleId }
        _uiState.value = _uiState.value.copy(nearby = nearbyOnly, alerts = alerts)
    }

    private fun trackStationary(speedKmph: Double) {
        stationaryTicks = if (speedKmph < 2.0) stationaryTicks + 1 else 0
        _uiState.value = _uiState.value.copy(canOfferHelp = stationaryTicks >= 3)
    }
}
