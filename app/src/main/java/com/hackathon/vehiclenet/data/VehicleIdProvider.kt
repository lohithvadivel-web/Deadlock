package com.hackathon.vehiclenet.data

import android.content.Context
import java.util.UUID
import java.util.concurrent.TimeUnit

/**
 * Generates a rotating anonymous ID so the same vehicle can't be tracked
 * across a whole trip from the ID alone. Rotates every ROTATE_INTERVAL_MS.
 */
class VehicleIdProvider(context: Context) {

    private val prefs = context.getSharedPreferences("vehiclenet_id", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_ID = "current_id"
        private const val KEY_CREATED_AT = "created_at"
        private val ROTATE_INTERVAL_MS = TimeUnit.MINUTES.toMillis(15)
    }

    fun currentId(): String {
        val createdAt = prefs.getLong(KEY_CREATED_AT, 0L)
        val existing = prefs.getString(KEY_ID, null)
        val expired = System.currentTimeMillis() - createdAt > ROTATE_INTERVAL_MS

        if (existing == null || expired) {
            val newId = "veh-" + UUID.randomUUID().toString().take(8)
            prefs.edit()
                .putString(KEY_ID, newId)
                .putLong(KEY_CREATED_AT, System.currentTimeMillis())
                .apply()
            return newId
        }
        return existing
    }
}
