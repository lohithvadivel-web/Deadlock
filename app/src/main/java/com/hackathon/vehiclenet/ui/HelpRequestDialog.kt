package com.hackathon.vehiclenet.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import com.hackathon.vehiclenet.model.EventType

@Composable
fun HelpRequestDialog(onDismiss: () -> Unit, onSelect: (EventType) -> Unit) {
    val options = listOf(
        EventType.BREAKDOWN, EventType.MEDICAL, EventType.ACCIDENT, EventType.CHARGING_HELP, EventType.HAZARD
    )
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("What kind of help?") },
        text = {
            Column {
                options.forEach { option ->
                    TextButton(onClick = { onSelect(option) }) {
                        Text(option.label)
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
