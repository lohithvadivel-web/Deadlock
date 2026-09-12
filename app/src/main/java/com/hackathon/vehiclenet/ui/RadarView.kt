package com.hackathon.vehiclenet.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import com.hackathon.vehiclenet.logic.GeoUtils
import com.hackathon.vehiclenet.model.EventType
import com.hackathon.vehiclenet.model.VehicleUpdate
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

/**
 * Stand-in for a real map: places "self" at the center and other vehicles
 * as dots by bearing/distance. Swap for the Google Maps SDK or OpenStreetMap
 * once you have an API key — see README for the hook point.
 */
@Composable
fun RadarView(self: VehicleUpdate?, others: List<VehicleUpdate>, radiusMeters: Double = 500.0) {
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1f)
    ) {
        val center = Offset(size.width / 2, size.height / 2)
        val maxRadiusPx = min(size.width, size.height) / 2 * 0.9f

        // range rings
        listOf(0.33f, 0.66f, 1.0f).forEach { fraction ->
            drawCircle(
                color = Color(0xFFDDDDDD),
                radius = maxRadiusPx * fraction,
                center = center,
                style = Stroke(width = 2f)
            )
        }

        // self, always centered
        drawCircle(color = Color(0xFF1976D2), radius = 16f, center = center)

        if (self == null) return@Canvas

        others.forEach { other ->
            val distance = GeoUtils.haversineMeters(self.latitude, self.longitude, other.latitude, other.longitude)
            if (distance > radiusMeters) return@forEach
            val bearing = GeoUtils.bearingDegrees(self.latitude, self.longitude, other.latitude, other.longitude)
            val angleRad = Math.toRadians(bearing - 90) // 0 deg = up
            val r = (distance / radiusMeters).toFloat() * maxRadiusPx
            val point = Offset(
                x = center.x + (r * cos(angleRad)).toFloat(),
                y = center.y + (r * sin(angleRad)).toFloat()
            )
            val isAlert = other.event != EventType.NORMAL.name
            drawCircle(
                color = if (isAlert) Color(0xFFD32F2F) else Color(0xFF43A047),
                radius = if (isAlert) 14f else 10f,
                center = point
            )
        }
    }
}
