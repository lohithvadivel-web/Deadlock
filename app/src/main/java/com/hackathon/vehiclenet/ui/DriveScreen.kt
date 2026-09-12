package com.hackathon.vehiclenet.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.hackathon.vehiclenet.model.EventType

@Composable
fun DriveScreen(
    viewModel: VehicleViewModel,
    hasLocationPermission: Boolean,
    onRequestPermission: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var showHelpDialog by remember { mutableStateOf(false) }
    var showVehicleTypePicker by remember { mutableStateOf(true) }
    var vehicleType by remember { mutableStateOf("CAR") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {

        if (showVehicleTypePicker) {
            Text("Vehicle type", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = vehicleType == "CAR",
                    onClick = { vehicleType = "CAR"; viewModel.setVehicleType("CAR") },
                    label = { Text("Car") }
                )
                FilterChip(
                    selected = vehicleType == "BIKE",
                    onClick = { vehicleType = "BIKE"; viewModel.setVehicleType("BIKE") },
                    label = { Text("Bike") }
                )
            }
            Spacer(Modifier.height(16.dp))
        }

        Text(
            text = when (state.driveState) {
                DriveState.STOPPED -> "Stopped"
                DriveState.DRIVING -> "Sharing live location"
                DriveState.DEMO -> "Demo Mode running"
            },
            style = MaterialTheme.typography.titleMedium
        )

        Spacer(Modifier.height(8.dp))
        RadarView(self = state.self, others = state.nearby)
        Spacer(Modifier.height(8.dp))

        state.alerts.firstOrNull()?.let { alert ->
            AlertBanner(
                alert = alert,
                canOfferHelp = state.canOfferHelp,
                onOfferHelp = { viewModel.offerHelpTo(alert.fromVehicleId) }
            )
            Spacer(Modifier.height(8.dp))
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = {
                showVehicleTypePicker = false
                if (hasLocationPermission) viewModel.startRealDrive() else onRequestPermission()
            }) { Text("Start Drive") }

            OutlinedButton(onClick = {
                showVehicleTypePicker = false
                viewModel.startDemoMode()
            }) { Text("Demo Mode") }

            if (state.driveState != DriveState.STOPPED) {
                OutlinedButton(onClick = {
                    viewModel.stopAll()
                    showVehicleTypePicker = true
                }) { Text("Stop") }
            }
        }

        Spacer(Modifier.height(16.dp))

        if (state.self != null && state.self?.event != EventType.NORMAL.name) {
            Button(onClick = { viewModel.cancelHelp() }) {
                Text("Cancel help request")
            }
        } else {
            Button(
                onClick = { showHelpDialog = true },
                enabled = state.driveState != DriveState.STOPPED
            ) { Text("Request Help") }
        }
    }

    if (showHelpDialog) {
        HelpRequestDialog(
            onDismiss = { showHelpDialog = false },
            onSelect = {
                viewModel.requestHelp(it)
                showHelpDialog = false
            }
        )
    }
}
