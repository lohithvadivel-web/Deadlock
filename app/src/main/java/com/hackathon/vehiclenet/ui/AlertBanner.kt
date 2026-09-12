package com.hackathon.vehiclenet.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.hackathon.vehiclenet.logic.Alert

@Composable
fun AlertBanner(alert: Alert, canOfferHelp: Boolean, onOfferHelp: () -> Unit) {
    val isHelpRequest = alert.event.isHelpRequest
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (isHelpRequest) Color(0xFFFFF3E0) else Color(0xFFFFEBEE))
            .padding(16.dp)
    ) {
        Text(alert.message, style = MaterialTheme.typography.headlineSmall)
        if (isHelpRequest) {
            Spacer(Modifier.height(8.dp))
            Button(onClick = onOfferHelp, enabled = canOfferHelp) {
                Text(if (canOfferHelp) "I can help" else "Pull over to respond")
            }
        }
    }
}
