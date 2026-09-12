# VehicleNet — hackathon prototype

Advisory-only vehicle-to-cloud-to-vehicle safety prototype. Cars and bikes
share anonymous location/speed/heading; the app finds nearby participants
and raises short, structured alerts. **It never touches brakes, steering,
throttle, or any vehicle control system.**

## What's built
- Kotlin + Jetpack Compose Android app (single module, `app/`)
- GPS tracking via `FusedLocationProviderClient`, one update/second (`data/LocationTracker.kt`)
- Firebase Realtime Database sync + anonymous auth (`data/FirebaseVehicleRepository.kt`)
- Rotating anonymous vehicle ID, no name/phone/permanent ID (`data/VehicleIdProvider.kt`)
- Nearby-vehicle engine: Haversine distance, 500 m radius, 5 s staleness cutoff,
  hard-braking inference from a sharp speed drop + similar heading (`logic/NearbyVehicleEngine.kt`)
- Structured help requests only — `BREAKDOWN`, `MEDICAL`, `ACCIDENT`, `CHARGING_HELP`,
  `HAZARD` — no free-text chat while driving (`model/EventType.kt`)
- "I can help" is only enabled once the receiving driver has been stationary for
  a few seconds, per the driver-distraction requirement
- Demo Mode: 8 simulated vehicles circling a fixed point, one of which fires a
  hazard event ~20s in, so the whole flow is demoable with a single phone and
  zero setup (`data/DemoModeSimulator.kt`)
- Built-in radar view (`ui/RadarView.kt`) — a Compose Canvas showing you at the
  center and nearby vehicles as dots by bearing/distance, colored red when
  they're alerting. This needs no API key, so it's the safe fallback for judging.

## What you need to add (the "GPS and some other things" part)
1. **A physical device or emulator with location** — I can't test real GPS
   hardware from here. Run on an actual Android phone (or an emulator with a
   simulated location route) with location services turned on.
2. **A Firebase project**:
   - Create one at the Firebase console, add an Android app with package name
     `com.hackathon.vehiclenet`, download `google-services.json`, and drop it
     into `app/google-services.json`.
   - Enable **Realtime Database** (start in test mode for the hackathon).
   - Enable **Authentication → Anonymous** sign-in.
   - Suggested rules once you're past pure test mode:
     ```json
     {
       "rules": {
         "vehicles": { ".read": "auth != null", ".write": "auth != null" },
         "helpResponses": { ".read": "auth != null", ".write": "auth != null" }
       }
     }
     ```
3. **A real map (optional)** — swap `RadarView` for Google Maps Compose or
   OpenStreetMap once you have a Maps API key. The radar view already has the
   distance/bearing math you'll need for markers.

## Running it
1. Open the `VehicleNet/` folder in Android Studio. Let Gradle sync; if it
   suggests a newer Android Gradle Plugin/Kotlin version, accept it — the
   versions pinned here are a reasonable Sept-2026 baseline but Android
   Studio's own suggestions will be more current.
2. Grant location permission when prompted.
3. **Fastest path to a demo:** tap **Demo Mode** — no Firebase, no second
   device, no GPS needed. Watch a hazard alert appear on the radar ~20s in.
4. **Real two-phone test:** on both phones, pick Car/Bike, tap **Start
   Drive**, and drive/walk them within 500m of each other. Confirm a hard-brake
   or Request Help event on one phone shows up on the other within a few
   seconds.

## Known gaps / natural next steps
- `observeHelpResponses()` in the repository already streams how many vehicles
  offered to help, but it isn't wired into the UI yet — cheap to add as a small
  counter under the alert banner.
- Only one alert is shown at a time (the first in the list) — fine for a
  three-minute demo, but you'll want a short queue or list for anything longer.
- Radar view assumes "up" is compass north, not direction of travel — swap in
  a real map when you have a key if judges expect map-north orientation.
- Real radar, cameras, and CAN-bus signals are deliberately out of scope: those
  need OEM-level permissions and belong in a documented "future work" slide,
  not this prototype.
