package com.hackathon.vehiclenet.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.hackathon.vehiclenet.model.VehicleUpdate
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

/**
 * Talks to Firebase Realtime Database.
 * Requires a Firebase project with Realtime Database + Anonymous Auth enabled,
 * and app/google-services.json from that project (see README).
 */
class FirebaseVehicleRepository {

    private val database = FirebaseDatabase.getInstance()
    private val vehiclesRef = database.getReference("vehicles")
    private val helpResponsesRef = database.getReference("helpResponses")

    suspend fun ensureSignedIn() {
        val auth = FirebaseAuth.getInstance()
        if (auth.currentUser == null) {
            auth.signInAnonymously().await()
        }
    }

    fun publish(update: VehicleUpdate) {
        vehiclesRef.child(update.vehicleId).setValue(update)
    }

    /** Clears this vehicle's record, e.g. when the driver presses "Stop". */
    fun clear(vehicleId: String) {
        vehiclesRef.child(vehicleId).removeValue()
    }

    /** Live stream of every vehicle's latest record. */
    fun observeVehicles(): Flow<List<VehicleUpdate>> = callbackFlow {
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val list = snapshot.children.mapNotNull { it.getValue(VehicleUpdate::class.java) }
                trySend(list)
            }
            override fun onCancelled(error: DatabaseError) { /* demo-scale: ignore */ }
        }
        vehiclesRef.addValueEventListener(listener)
        awaitClose { vehiclesRef.removeEventListener(listener) }
    }

    fun offerHelp(targetVehicleId: String, helperVehicleId: String) {
        helpResponsesRef.child(targetVehicleId).child(helperVehicleId).setValue(System.currentTimeMillis())
    }

    /** Count of vehicles that have offered help to [vehicleId]. Not yet wired into the UI — see README. */
    fun observeHelpResponses(vehicleId: String): Flow<Int> = callbackFlow {
        val ref = helpResponsesRef.child(vehicleId)
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) { trySend(snapshot.childrenCount.toInt()) }
            override fun onCancelled(error: DatabaseError) { }
        }
        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }
}
